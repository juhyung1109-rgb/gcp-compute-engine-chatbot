/**
 * Gemini Web Chatbot Frontend Script
 * Model support: Gemini 3.8 Flash & Gemini 3.7 Flash
 * SSE streaming, multimodal file attachments, voice input, markdown rendering
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatViewport = document.getElementById('chat-viewport');
  const heroSection = document.getElementById('hero-section');
  const heroInputSlot = document.getElementById('hero-input-slot');
  const bottomInputSlot = document.getElementById('bottom-input-slot');
  const inputAreaWrapper = document.getElementById('input-area-wrapper');
  const messagesContainer = document.getElementById('messages-container');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('pill-send-btn');
  const actionBtn = document.getElementById('pill-action-btn');
  const plusIcon = document.getElementById('plus-icon');
  const closeIcon = document.getElementById('close-icon');
  const geminiActionMenu = document.getElementById('gemini-action-menu');
  const realFileInput = document.getElementById('real-file-input');
  const attachmentPreviewBar = document.getElementById('attachment-preview-bar');
  const micBtn = document.getElementById('pill-mic-btn');
  const pillSearchBtn = document.getElementById('pill-search-btn');
  const menuToggleWebsearch = document.getElementById('menu-toggle-websearch');
  const menuSearchBadge = document.getElementById('menu-search-badge');
  const modelPillBtn = document.getElementById('model-pill-btn');
  const modelPillText = document.getElementById('model-pill-text');
  const modelPillTooltip = document.getElementById('model-pill-tooltip');
  const topModelBtn = document.getElementById('top-model-btn');
  const currentModelDisplay = document.getElementById('current-model-display');
  const navModelTag = document.getElementById('nav-model-tag');
  const modelDropdownMenu = document.getElementById('model-dropdown-menu');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const newChatBtn = document.getElementById('new-chat-btn');
  const chatHistoryList = document.getElementById('chat-history-list');
  const canvasDrawer = document.getElementById('canvas-drawer');
  const closeCanvasBtn = document.getElementById('close-canvas-btn');
  const apiStatusText = document.getElementById('api-status-text');
  const sidebarModelBadge = document.getElementById('sidebar-model-badge');

  // App State
  let currentModel = 'gemini-3.8-flash';
  let useWebSearch = true;
  let conversations = []; // { id, title, messages: [] }
  let activeConversationId = null;
  let currentAttachments = []; // { name, mimeType, base64, previewUrl }
  let isStreaming = false;
  let speechRecognition = null;
  let isRecording = false;

  // Web Search Toggle Function
  function toggleWebSearch(forceState = null) {
    useWebSearch = forceState !== null ? forceState : !useWebSearch;
    if (pillSearchBtn) {
      if (useWebSearch) {
        pillSearchBtn.classList.add('active');
        pillSearchBtn.title = '실시간 웹 검색 활성화됨 (Google Search Grounding)';
      } else {
        pillSearchBtn.classList.remove('active');
        pillSearchBtn.title = '실시간 웹 검색 비활성화됨 (클릭하여 켜기)';
      }
    }
    if (menuSearchBadge) {
      if (useWebSearch) {
        menuSearchBadge.textContent = '켬';
        menuSearchBadge.classList.remove('off');
      } else {
        menuSearchBadge.textContent = '끔';
        menuSearchBadge.classList.add('off');
      }
    }
    localStorage.setItem('gemini_use_web_search', useWebSearch ? 'true' : 'false');
  }

  // Placement function: elevate input in home mode, dock at bottom in chat mode
  function updateInputPlacement(isHome) {
    if (!inputAreaWrapper) return;
    if (isHome) {
      if (heroInputSlot && !heroInputSlot.contains(inputAreaWrapper)) {
        heroInputSlot.appendChild(inputAreaWrapper);
      }
    } else {
      if (bottomInputSlot && !bottomInputSlot.contains(inputAreaWrapper)) {
        bottomInputSlot.appendChild(inputAreaWrapper);
      }
    }
  }

  // Configure marked options
  if (window.marked) {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  // ----------------------------------------------------
  // Initialization & Config Fetch
  // ----------------------------------------------------
  async function init() {
    const savedSearch = localStorage.getItem('gemini_use_web_search');
    if (savedSearch !== null) {
      toggleWebSearch(savedSearch === 'true');
    }
    loadConversationsFromStorage();
    setupEventListeners();
    setupSpeechRecognition();
    await checkApiConfig();
    renderConversationList();
    renderCurrentConversation();
  }

  async function checkApiConfig() {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const config = await resp.json();
        if (config.hasApiKey) {
          apiStatusText.textContent = 'Gemini API 연동 완료';
        } else {
          apiStatusText.textContent = 'API 키 누락 (확인 필요)';
          apiStatusText.style.color = '#ef4444';
        }
      }
    } catch (e) {
      console.warn('Config fetch error:', e);
    }
  }

  // ----------------------------------------------------
  // Model Management & Dropdowns
  // ----------------------------------------------------
  function setModel(modelId) {
    currentModel = modelId;
    const is38 = modelId === 'gemini-3.8-flash';
    const displayName = is38 ? 'Gemini 3.8 Flash' : 'Gemini 3.7 Flash';
    const pillName = is38 ? 'Flash' : '3.7 Flash';
    const tag = is38 ? '3.8 Flash' : '3.7 Flash';

    currentModelDisplay.textContent = displayName;
    modelPillText.textContent = pillName;
    navModelTag.textContent = tag;
    sidebarModelBadge.textContent = displayName;

    // Update active class in dropdown
    document.querySelectorAll('.model-option').forEach(opt => {
      if (opt.dataset.model === modelId) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    closeAllMenus();
  }

  function toggleModelDropdown() {
    const isOpen = modelDropdownMenu.classList.contains('show');
    closeAllMenus();
    if (!isOpen) {
      modelDropdownMenu.classList.add('show');
      topModelBtn.setAttribute('aria-expanded', 'true');
    }
  }

  function toggleActionMenu() {
    const isOpen = geminiActionMenu.classList.contains('show');
    closeAllMenus();
    if (!isOpen) {
      // Measure available vertical space below the + button
      const rect = actionBtn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 380) {
        geminiActionMenu.classList.add('open-upwards');
      } else {
        geminiActionMenu.classList.remove('open-upwards');
      }

      geminiActionMenu.classList.add('show');
      plusIcon.style.display = 'none';
      closeIcon.style.display = 'block';
    } else {
      plusIcon.style.display = 'block';
      closeIcon.style.display = 'none';
    }
  }

  function closeAllMenus() {
    modelDropdownMenu.classList.remove('show');
    topModelBtn.setAttribute('aria-expanded', 'false');
    geminiActionMenu.classList.remove('show');
    plusIcon.style.display = 'block';
    closeIcon.style.display = 'none';
  }

  // ----------------------------------------------------
  // Speech Recognition (STT)
  // ----------------------------------------------------
  function setupSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      speechRecognition = new SpeechRec();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = true;
      speechRecognition.lang = 'ko-KR';

      speechRecognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.title = '음성 인식 중... (클릭하여 중지)';
      };

      speechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        chatInput.value = (chatInput.value + ' ' + transcript).trim();
        adjustTextareaHeight();
        updateSendBtnState();
      };

      speechRecognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        stopSpeechRecognition();
      };

      speechRecognition.onend = () => {
        stopSpeechRecognition();
      };
    } else {
      micBtn.title = '이 브라우저에서는 음성 인식을 지원하지 않습니다.';
      micBtn.style.opacity = '0.5';
    }
  }

  function toggleSpeechRecognition() {
    if (!speechRecognition) {
      alert('브라우저에서 Web Speech API 음성 인식을 지원하지 않습니다. Chrome 등 Chromium 기반 브라우저를 이용해주세요.');
      return;
    }
    if (isRecording) {
      speechRecognition.stop();
    } else {
      try {
        speechRecognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  }

  function stopSpeechRecognition() {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.title = '음성으로 입력하기';
  }

  // ----------------------------------------------------
  // File Uploads & Attachments
  // ----------------------------------------------------
  function handleFilesSelected(files) {
    if (!files || files.length === 0) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        currentAttachments.push({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: base64,
          previewUrl: file.type.startsWith('image/') ? dataUrl : null
        });
        renderAttachmentPreviews();
        updateSendBtnState();
      };
      reader.readAsDataURL(file);
    }
  }

  function renderAttachmentPreviews() {
    attachmentPreviewBar.innerHTML = '';
    if (currentAttachments.length === 0) {
      attachmentPreviewBar.style.display = 'none';
      return;
    }

    attachmentPreviewBar.style.display = 'flex';
    currentAttachments.forEach((att, idx) => {
      const card = document.createElement('div');
      card.className = 'attachment-preview-card';

      if (att.previewUrl) {
        const img = document.createElement('img');
        img.src = att.previewUrl;
        img.className = 'preview-thumb';
        card.appendChild(img);
      } else {
        const fileIcon = document.createElement('span');
        fileIcon.textContent = '📄';
        card.appendChild(fileIcon);
      }

      const nameSpan = document.createElement('span');
      nameSpan.textContent = att.name.length > 18 ? att.name.slice(0, 15) + '...' : att.name;
      card.appendChild(nameSpan);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-attach-btn';
      removeBtn.innerHTML = '✕';
      removeBtn.title = '첨부 삭제';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        currentAttachments.splice(idx, 1);
        renderAttachmentPreviews();
        updateSendBtnState();
      };
      card.appendChild(removeBtn);

      attachmentPreviewBar.appendChild(card);
    });
  }

  // ----------------------------------------------------
  // Storage & Conversations
  // ----------------------------------------------------
  function loadConversationsFromStorage() {
    try {
      const saved = localStorage.getItem('gemini_chat_sessions');
      if (saved) {
        conversations = JSON.parse(saved);
      }
    } catch (e) {
      conversations = [];
    }

    if (conversations.length > 0) {
      activeConversationId = conversations[0].id;
    } else {
      createNewConversation();
    }
  }

  function saveConversationsToStorage() {
    try {
      localStorage.setItem('gemini_chat_sessions', JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  function createNewConversation() {
    const newConv = {
      id: 'chat_' + Date.now(),
      title: '새로운 대화',
      messages: [],
      timestamp: Date.now()
    };
    conversations.unshift(newConv);
    activeConversationId = newConv.id;
    saveConversationsToStorage();
    renderConversationList();
    renderCurrentConversation();
    chatInput.focus();
  }

  function getActiveConversation() {
    return conversations.find(c => c.id === activeConversationId);
  }

  function renderConversationList() {
    chatHistoryList.innerHTML = '';
    conversations.forEach(conv => {
      const li = document.createElement('li');
      li.className = `chat-history-item ${conv.id === activeConversationId ? 'active' : ''}`;
      li.dataset.id = conv.id;

      const titleSpan = document.createElement('span');
      titleSpan.style.overflow = 'hidden';
      titleSpan.style.textOverflow = 'ellipsis';
      titleSpan.textContent = conv.title;
      li.appendChild(titleSpan);

      const delBtn = document.createElement('button');
      delBtn.className = 'del-session-btn';
      delBtn.innerHTML = '✕';
      delBtn.title = '대화 삭제';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteConversation(conv.id);
      };
      li.appendChild(delBtn);

      li.onclick = () => {
        if (activeConversationId !== conv.id) {
          activeConversationId = conv.id;
          renderConversationList();
          renderCurrentConversation();
        }
      };

      chatHistoryList.appendChild(li);
    });
  }

  function deleteConversation(convId) {
    conversations = conversations.filter(c => c.id !== convId);
    if (conversations.length === 0) {
      createNewConversation();
    } else {
      if (activeConversationId === convId) {
        activeConversationId = conversations[0].id;
      }
      saveConversationsToStorage();
      renderConversationList();
      renderCurrentConversation();
    }
  }

  // ----------------------------------------------------
  // Messages & Chat Rendering
  // ----------------------------------------------------
  function renderCurrentConversation() {
    const conv = getActiveConversation();
    if (!conv || conv.messages.length === 0) {
      heroSection.style.display = 'flex';
      messagesContainer.innerHTML = '';
      updateInputPlacement(true);
      return;
    }

    heroSection.style.display = 'none';
    messagesContainer.innerHTML = '';
    updateInputPlacement(false);

    conv.messages.forEach((msg, idx) => {
      appendMessageToDOM(msg, idx);
    });

    scrollToBottom();
  }

  function appendMessageToDOM(msg, msgIndex = null) {
    const row = document.createElement('div');
    row.className = `message-row ${msg.role}`;

    if (msg.role === 'assistant') {
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar gemini-avatar-sparkle';
      avatar.innerHTML = '✦';
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // User attachments if present
    if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
      const attachWrap = document.createElement('div');
      attachWrap.className = 'msg-attachments-container';
      msg.attachments.forEach(att => {
        if (att.previewUrl || (att.base64 && att.mimeType.startsWith('image/'))) {
          const img = document.createElement('img');
          img.src = att.previewUrl || `data:${att.mimeType};base64,${att.base64}`;
          img.className = 'msg-attachment-thumb';
          attachWrap.appendChild(img);
        } else {
          const filePill = document.createElement('div');
          filePill.className = 'msg-file-pill';
          filePill.innerHTML = `📄 ${att.name || '첨부 파일'}`;
          attachWrap.appendChild(filePill);
        }
      });
      bubble.appendChild(attachWrap);
    }

    // Text Content
    const textContentEl = document.createElement('div');
    textContentEl.className = 'msg-text-content';

    if (msg.role === 'assistant') {
      textContentEl.innerHTML = parseMarkdownWithCodeBlocks(msg.content || '');
    } else {
      textContentEl.textContent = msg.content;
    }
    bubble.appendChild(textContentEl);

    // Assistant action buttons (Copy, TTS)
    if (msg.role === 'assistant') {
      const actionsRow = document.createElement('div');
      actionsRow.className = 'msg-actions-row';

      // Copy Button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-icon-btn';
      copyBtn.title = '답변 복사';
      copyBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(msg.content).then(() => {
          copyBtn.style.color = '#10b981';
          setTimeout(() => { copyBtn.style.color = ''; }, 1500);
        });
      };
      actionsRow.appendChild(copyBtn);

      // Speak TTS Button
      const speakBtn = document.createElement('button');
      speakBtn.className = 'action-icon-btn';
      speakBtn.title = '음성으로 듣기';
      speakBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      speakBtn.onclick = () => {
        speakText(msg.content);
      };
      actionsRow.appendChild(speakBtn);

      // Thumbs Up
      const thumbsUp = document.createElement('button');
      thumbsUp.className = 'action-icon-btn';
      thumbsUp.title = '좋은 답변';
      thumbsUp.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      `;
      thumbsUp.onclick = () => thumbsUp.classList.toggle('active');
      actionsRow.appendChild(thumbsUp);

      bubble.appendChild(actionsRow);

      // Render grounding sources if present
      if (msg.grounding) {
        renderGroundingContent(bubble, msg.grounding);
      }
    }

    row.appendChild(bubble);
    messagesContainer.appendChild(row);

    // Apply syntax highlighting
    if (window.hljs) {
      row.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }

    return row;
  }

  function renderGroundingContent(bubble, grounding) {
    if (!grounding) return;

    // Search query indicator pill (at the top of the message)
    if (grounding.queries && grounding.queries.length > 0 && !bubble.querySelector('.grounding-search-pill')) {
      const pill = document.createElement('div');
      pill.className = 'grounding-search-pill';
      pill.innerHTML = `
        <span class="grounding-icon">🌐</span>
        <span>웹 검색: "${grounding.queries.slice(0, 2).join('", "')}"</span>
      `;
      bubble.insertBefore(pill, bubble.firstChild);
    }

    // Sources container (before actionsRow or at end of bubble)
    if (grounding.sources && grounding.sources.length > 0 && !bubble.querySelector('.grounding-sources-container')) {
      const sourcesContainer = document.createElement('div');
      sourcesContainer.className = 'grounding-sources-container';

      const header = document.createElement('div');
      header.className = 'grounding-sources-header';
      header.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>출처 및 참고 웹사이트 (${grounding.sources.length})</span>
      `;
      sourcesContainer.appendChild(header);

      const list = document.createElement('div');
      list.className = 'grounding-sources-list';

      grounding.sources.forEach(src => {
        const a = document.createElement('a');
        a.className = 'source-chip';
        a.href = src.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = src.title || src.url;
        a.innerHTML = `
          <span class="source-chip-icon">🔗</span>
          <span class="source-chip-text">${src.title || '웹 출처'}</span>
        `;
        list.appendChild(a);
      });

      sourcesContainer.appendChild(list);

      const actionsRow = bubble.querySelector('.msg-actions-row');
      if (actionsRow) {
        bubble.insertBefore(sourcesContainer, actionsRow);
      } else {
        bubble.appendChild(sourcesContainer);
      }
    }
  }

  function parseMarkdownWithCodeBlocks(text) {
    if (!window.marked) return text;
    let html = marked.parse(text);

    // Enhance code blocks with custom headers and copy buttons
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const preElements = tempDiv.querySelectorAll('pre');
    preElements.forEach(pre => {
      const code = pre.querySelector('code');
      const langClass = code ? Array.from(code.classList).find(c => c.startsWith('language-')) : null;
      const lang = langClass ? langClass.replace('language-', '') : 'code';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span>${lang}</span>
        <button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').innerText); this.innerText='복사됨!'; setTimeout(() => this.innerText='코드 복사', 1500)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          코드 복사
        </button>
      `;

      wrapper.appendChild(header);
      const clonedPre = pre.cloneNode(true);
      wrapper.appendChild(clonedPre);

      pre.parentNode.replaceChild(wrapper, pre);
    });

    return tempDiv.innerHTML;
  }

  function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*_#`~>\[\]\(\)]/g, ' ').slice(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // ----------------------------------------------------
  // Send Message & Streaming Flow
  // ----------------------------------------------------
  async function sendMessage() {
    const text = chatInput.value.trim();
    if ((!text && currentAttachments.length === 0) || isStreaming) return;

    const conv = getActiveConversation();
    if (!conv) return;

    // User Message Object
    const userMessage = {
      role: 'user',
      content: text,
      attachments: [...currentAttachments]
    };

    conv.messages.push(userMessage);

    // Update conversation title if first message
    if (conv.messages.length === 1 && text) {
      conv.title = text.length > 25 ? text.slice(0, 22) + '...' : text;
      renderConversationList();
    }

    // Clear input & attachments
    chatInput.value = '';
    adjustTextareaHeight();
    currentAttachments = [];
    renderAttachmentPreviews();
    updateSendBtnState();

    // Hide hero section and dock input at bottom
    heroSection.style.display = 'none';
    updateInputPlacement(false);

    // Append user message to DOM
    appendMessageToDOM(userMessage);
    scrollToBottom();

    // Prepare Assistant Message Placeholder
    const assistantMessage = {
      role: 'assistant',
      content: ''
    };
    conv.messages.push(assistantMessage);

    const assistantRow = document.createElement('div');
    assistantRow.className = 'message-row assistant';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar gemini-avatar-sparkle';
    avatar.innerHTML = '✦';
    assistantRow.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    const textContentEl = document.createElement('div');
    textContentEl.className = 'msg-text-content';
    textContentEl.innerHTML = '<span class="streaming-cursor"></span>';
    bubble.appendChild(textContentEl);

    assistantRow.appendChild(bubble);
    messagesContainer.appendChild(assistantRow);
    scrollToBottom();

    // Start SSE Streaming
    isStreaming = true;
    updateSendBtnState();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: currentModel,
          useWebSearch: useWebSearch,
          messages: conv.messages.slice(0, -1) // send history except current placeholder
        })
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                accumulatedText += `\n\n> ⚠️ **오류:** ${parsed.error}`;
              } else if (parsed.text) {
                accumulatedText += parsed.text;
                assistantMessage.content = accumulatedText;
                textContentEl.innerHTML = parseMarkdownWithCodeBlocks(accumulatedText) + '<span class="streaming-cursor"></span>';
                scrollToBottom();
              } else if (parsed.grounding) {
                assistantMessage.grounding = parsed.grounding;
                renderGroundingContent(bubble, parsed.grounding);
                scrollToBottom();
              }
            } catch (err) {
              // Ignore non-json data chunks
            }
          }
        }
      }

      // Finalize message rendering
      assistantMessage.content = accumulatedText;
      textContentEl.innerHTML = parseMarkdownWithCodeBlocks(accumulatedText);

      // Add actions row
      const actionsRow = document.createElement('div');
      actionsRow.className = 'msg-actions-row';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-icon-btn';
      copyBtn.title = '답변 복사';
      copyBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(assistantMessage.content);
        copyBtn.style.color = '#10b981';
        setTimeout(() => { copyBtn.style.color = ''; }, 1500);
      };
      actionsRow.appendChild(copyBtn);

      const speakBtn = document.createElement('button');
      speakBtn.className = 'action-icon-btn';
      speakBtn.title = '음성으로 듣기';
      speakBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      speakBtn.onclick = () => speakText(assistantMessage.content);
      actionsRow.appendChild(speakBtn);

      bubble.appendChild(actionsRow);

      // Highlight any code
      if (window.hljs) {
        assistantRow.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }

      saveConversationsToStorage();
    } catch (error) {
      console.error('Chat error:', error);
      textContentEl.innerHTML = `<span style="color:#ef4444;">⚠️ 오류가 발생했습니다: ${error.message}</span>`;
      assistantMessage.content = `오류: ${error.message}`;
      saveConversationsToStorage();
    } finally {
      isStreaming = false;
      updateSendBtnState();
      scrollToBottom();
    }
  }

  // ----------------------------------------------------
  // Helper Functions
  // ----------------------------------------------------
  function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
  }

  function updateSendBtnState() {
    const hasText = chatInput.value.trim().length > 0;
    const hasAttachments = currentAttachments.length > 0;
    sendBtn.disabled = (!hasText && !hasAttachments) || isStreaming;
  }

  // ----------------------------------------------------
  // Event Listeners Setup
  // ----------------------------------------------------
  function setupEventListeners() {
    // Input typing & Enter key handling
    chatInput.addEventListener('input', () => {
      adjustTextareaHeight();
      updateSendBtnState();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Left Action Button (+)
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleActionMenu();
    });

    // Model Selector Buttons
    topModelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleModelDropdown();
    });

    modelPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleModelDropdown();
    });

    modelPillBtn.addEventListener('mouseenter', () => {
      if (!modelPillTooltip) return;
      const rect = modelPillBtn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 60) {
        modelPillTooltip.classList.add('tooltip-upwards');
      } else {
        modelPillTooltip.classList.remove('tooltip-upwards');
      }
    });

    // Model Options Selection
    document.querySelectorAll('.model-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        setModel(opt.dataset.model);
      });
    });

    // Global shortcut Ctrl+Shift+M (or Cmd+Shift+M) for switching model
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        toggleModelDropdown();
      }
    });

    // Close menus on outside click
    document.addEventListener('click', (e) => {
      if (!geminiActionMenu.contains(e.target) && !actionBtn.contains(e.target)) {
        geminiActionMenu.classList.remove('show');
        plusIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
      if (!modelDropdownMenu.contains(e.target) && !topModelBtn.contains(e.target) && !modelPillBtn.contains(e.target)) {
        modelDropdownMenu.classList.remove('show');
        topModelBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Real File Upload trigger from menu item
    document.getElementById('menu-upload-file').addEventListener('click', () => {
      closeAllMenus();
      realFileInput.click();
    });

    realFileInput.addEventListener('change', (e) => {
      handleFilesSelected(e.target.files);
      realFileInput.value = ''; // reset
    });

    // Other Action Menu Items (matching screenshot)
    document.getElementById('menu-drive-file').addEventListener('click', () => {
      closeAllMenus();
      alert('Google Drive 연동 모달입니다. 로컬 파일을 업로드하시려면 "파일 업로드"를 이용해주세요.');
    });

    document.getElementById('menu-upload-more').addEventListener('click', () => {
      closeAllMenus();
      realFileInput.click();
    });

    document.getElementById('menu-create-image').addEventListener('click', () => {
      closeAllMenus();
      chatInput.value = '다음을 주제로 고화질 일러스트/사진 생성 프롬프트를 작성해줘: ';
      chatInput.focus();
      adjustTextareaHeight();
      updateSendBtnState();
    });

    document.getElementById('menu-create-video').addEventListener('click', () => {
      closeAllMenus();
      chatInput.value = '다음을 주제로 숏폼 영상 기획안 및 비디오 프롬프트를 구성해줘: ';
      chatInput.focus();
      adjustTextareaHeight();
      updateSendBtnState();
    });

    document.getElementById('menu-create-music').addEventListener('click', () => {
      closeAllMenus();
      chatInput.value = '다음을 주제로 음악 컨셉, 장르, 가사, 악기 구성을 제안해줘: ';
      chatInput.focus();
      adjustTextareaHeight();
      updateSendBtnState();
    });

    document.getElementById('menu-canvas').addEventListener('click', () => {
      closeAllMenus();
      canvasDrawer.classList.add('open');
    });

    closeCanvasBtn.addEventListener('click', () => {
      canvasDrawer.classList.remove('open');
    });

    document.getElementById('menu-tools-more').addEventListener('click', () => {
      closeAllMenus();
      alert('현재 Gemini 3.8 Flash 및 Gemini 3.7 Flash 모델의 Google Search 실시간 웹 검색, 멀티모달 분석, 코드 작성, 브라우저 음성 인식(STT), 음성 읽기(TTS) 도구가 활성화되어 있습니다.');
    });

    // Real-time Web Search Toggles
    if (pillSearchBtn) {
      pillSearchBtn.addEventListener('click', () => toggleWebSearch());
    }

    if (menuToggleWebsearch) {
      menuToggleWebsearch.addEventListener('click', () => {
        toggleWebSearch();
        closeAllMenus();
      });
    }

    // Microphone STT
    micBtn.addEventListener('click', toggleSpeechRecognition);

    // Suggestion Chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          chatInput.value = prompt;
          adjustTextareaHeight();
          updateSendBtnState();
          sendMessage();
        }
      });
    });

    // Sidebar Toggles
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    newChatBtn.addEventListener('click', () => {
      createNewConversation();
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
      }
    });

    // Drag and drop files to main viewport
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    });
  }

  // Run init
  init();
});
