import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Application Default Credentials (ADC)
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Helper to acquire ADC Bearer Access Token & Project ID
async function getAuthDetails() {
  try {
    const client = await auth.getClient();
    const tokenResp = await client.getAccessToken();
    const token = tokenResp.token || '';
    
    let projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'iceu-songpa03';
    try {
      const detectedProj = await auth.getProjectId();
      if (detectedProj) projectId = detectedProj;
    } catch {
      // Keep default project if detection fails
    }

    return { token, projectId, error: null };
  } catch (err) {
    console.error('ADC Authentication error:', err.message);
    return { token: null, projectId: 'iceu-songpa03', error: err.message };
  }
}

// Available models definition for Vertex AI / Model API
const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    shortName: '2.5 Flash',
    description: 'Vertex AI 최신 초고속 플래시 모델 (ADC 최적화)',
    badge: 'ADC 기본 / 최신'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    shortName: '2.5 Pro',
    description: 'Vertex AI 차세대 고성능 플래그십 모델',
    badge: '고성능 추론'
  }
];

// Health and Config endpoint
app.get('/api/config', async (req, res) => {
  const { token, projectId, error } = await getAuthDetails();
  const isAuthenticated = Boolean(token);

  res.json({
    status: isAuthenticated ? 'healthy' : 'unauthenticated',
    platform: 'Google Cloud Run (ADC Mode)',
    authMethod: 'Application Default Credentials (ADC)',
    projectId: projectId,
    hasApiKey: isAuthenticated, // Frontend compatibility flag
    defaultModel: 'gemini-2.5-flash',
    models: AVAILABLE_MODELS,
    errorNotice: error ? 'ADC 인증 정보가 없습니다. (로컬: gcloud auth application-default login 필요)' : null
  });
});

// Chat SSE streaming endpoint using ADC Bearer Token
app.post('/api/chat', async (req, res) => {
  const { token, projectId, error } = await getAuthDetails();
  if (!token) {
    return res.status(401).json({
      error: `ADC 인증 실패: ${error || 'Application Default Credentials를 찾을 수 없습니다.'}. 로컬 개발 시에는 'gcloud auth application-default login'을 실행해 주세요.`
    });
  }

  const { model = 'gemini-2.5-flash', messages = [], useWebSearch = true } = req.body;

  // Validate or map model to supported Vertex AI models
  let selectedModel = 'gemini-2.5-flash';
  if (model === 'gemini-2.5-pro') {
    selectedModel = 'gemini-2.5-pro';
  }

  // Format contents for Vertex AI Model API
  const contents = messages.map(msg => {
    const parts = [];

    // Inline attachments
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

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Vertex AI streamGenerateContent REST API Endpoint
  const apiUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/google/models/${selectedModel}:streamGenerateContent?alt=sse`;

  const payload = { contents };
  if (useWebSearch) {
    payload.tools = [{ googleSearch: {} }];
  }

  try {
    const vertexResp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Goog-User-Project': projectId
      },
      body: JSON.stringify(payload)
    });

    if (!vertexResp.ok) {
      const errorText = await vertexResp.text();
      res.write(`data: ${JSON.stringify({ error: `Vertex AI API 에러 (${vertexResp.status}): ${errorText}` })}\n\n`);
      res.end();
      return;
    }

    const reader = vertexResp.body.getReader();
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

            // Grounding metadata
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
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(`🚀 Gemini Web Chatbot (ADC Mode) running on Cloud Run`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`🔒 Authentication: Application Default Credentials (ADC)`);
  
  const { token, projectId } = await getAuthDetails();
  console.log(`🏷️  Target Project: ${projectId}`);
  console.log(`🔑 ADC Token Status: ${token ? '인증 성공 (Found)' : '인증 정보 없음 (ADC Required)'}`);
  console.log(`====================================================`);
});
