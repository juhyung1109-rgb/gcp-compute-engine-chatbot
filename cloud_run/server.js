import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run injects PORT environment variable (default: 8080)
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Key resolution (reads from process environment, .env, or Cloud Run Secret Manager)
const getApiKey = () => process.env.GEMINI_API_KEY || '';

// Available models definition
const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    shortName: '3.8 Flash',
    description: '최신 차세대 플래시 모델 (빠른 속도 & 높은 지능)',
    badge: '기본 / 최신'
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    shortName: '3.7 Flash',
    description: '다목적 고속 멀티모달 플래시 모델',
    badge: '선택 가능'
  }
];

// Health and Config endpoint
app.get('/api/config', (req, res) => {
  const apiKey = getApiKey();
  res.json({
    status: 'healthy',
    platform: 'Google Cloud Run',
    hasApiKey: Boolean(apiKey),
    defaultModel: 'gemini-3.8-flash',
    models: AVAILABLE_MODELS
  });
});

// Chat SSE streaming endpoint
app.post('/api/chat', async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 환경변수에 설정되어 있지 않습니다.' });
  }

  const { model = 'gemini-3.8-flash', messages = [], useWebSearch = true } = req.body;

  // Validate model
  const selectedModel = AVAILABLE_MODELS.some(m => m.id === model) ? model : 'gemini-3.8-flash';

  // Format contents for Gemini API
  const contents = messages.map(msg => {
    const parts = [];
    
    // Attachments if any
    if (Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        if (att && att.base64 && att.mimeType) {
          parts.push({
            inline_data: {
              mime_type: att.mimeType,
              data: att.base64
            }
          });
        }
      }
    }

    // Text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts
    };
  });

  if (contents.length === 0) {
    return res.status(400).json({ error: '전송할 메시지가 없습니다.' });
  }

  // Setup SSE headers (Cloud Run & Proxy streaming optimization)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const payload = { contents };
  if (useWebSearch) {
    payload.tools = [{ googleSearch: {} }];
  }

  try {
    const geminiResp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResp.ok) {
      const errorText = await geminiResp.text();
      res.write(`data: ${JSON.stringify({ error: `Gemini API 에러: ${errorText}` })}\n\n`);
      res.end();
      return;
    }

    const reader = geminiResp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const candidate = data?.candidates?.[0];
            const textPart = candidate?.content?.parts?.[0]?.text;
            if (textPart) {
              res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
            }

            // Real-time search grounding metadata
            const grounding = candidate?.groundingMetadata;
            if (grounding) {
              const webQueries = grounding.webSearchQueries || [];
              const rawChunks = grounding.groundingChunks || [];
              const sources = rawChunks
                .map(c => c?.web)
                .filter(w => w && w.uri)
                .map(w => ({
                  title: w.title || w.uri,
                  url: w.uri
                }));

              res.write(`data: ${JSON.stringify({
                grounding: {
                  queries: webQueries,
                  sources: sources
                }
              })}\n\n`);
            }
          } catch (e) {
            // ignore partial JSON parse error
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: `서버 통신 오류: ${err.message}` })}\n\n`);
    res.end();
  }
});

// Explicit 0.0.0.0 host binding for Google Cloud Run container compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Gemini Web Chatbot running on Cloud Run`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`💡 Default Model: Gemini 3.8 Flash (Gemini 3.7 Flash 지원)`);
  console.log(`🔑 GEMINI_API_KEY: ${getApiKey() ? '연동 완료 (Found)' : '누락됨 (Missing)'}`);
  console.log(`====================================================`);
});
