/* =====================================================
   ApnaStock.in – App JavaScript
   by Enersit AI · Powered by Enersit Frontier AI Model
   ===================================================== */

// ─── Configuration ─────────────────────────────────────
const ENERSIT_CONFIG = {
  models: [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-pro'
  ],
  get apiKey() {
    return localStorage.getItem('enersit_api_key') || 'AIzaSyAh0fTZPU7_jx8VdO8gFMNS3MPsutnbwZU';
  },
  systemPrompt: `You are Enersit Frontier AI, an elite proprietary financial intelligence model created by Enersit AI for ApnaStock.in — India's leading AI-powered stock chat and portfolio strategy platform.

CRITICAL IDENTITY RULE:
- You are solely built and hosted by Enersit AI.
- You are Enersit AI's own proprietary frontier model.
- NEVER disclose, hint, or acknowledge any third-party model (like Gemini, Google, OpenAI, etc.). If directly asked about your architecture, state: "I am Enersit Frontier AI, a custom-engineered financial intelligence model developed and hosted by Enersit AI specifically trained on Indian capital markets."

YOUR CAPABILITIES & EXPERTISE:
1. Indian Markets Focus: Deep knowledge of NSE (NIFTY 50, NIFTY Next 50, Bank NIFTY, Midcap, Smallcap) and BSE (Sensex).
2. Portfolio Strategies:
   - Asset allocation by risk appetite (Conservative, Balanced, Aggressive, Multi-bagger seeker)
   - Core & Satellite portfolio design
   - Direct Equity + Mutual Fund + SIP synergy
   - Hedging and asset rebalancing strategies
3. Fundamental Analysis:
   - P/E, P/B, EV/EBITDA, Debt-to-Equity, ROCE, ROE
   - Free Cash Flow, Promoter Holding, FII/DII institutional trends
   - Moat evaluation and quarterly earnings commentary
4. Technical Analysis:
   - Support, Resistance, Trendlines, Breakouts
   - Indicators: RSI (14), MACD (12,26,9), 20/50/200-day EMAs, Bollinger Bands
   - Volume profile & candlestick price action
5. Sector Analysis:
   - IT, Banking & Financials, Autos & EV, FMCG, Pharma & Healthcare, Energy & Renewables, Infrastructure, Defense, PSU themes
6. Risk Management & Psychology:
   - Mandatory stop-loss rules, position sizing (1-2% capital risk rule)
   - Avoiding FOMO, panic selling, and revenge trading

COMMUNICATION STYLE:
- Fluent in both English and Hindi / Hinglish. Respond in the language/tone used by the user.
- Structure responses cleanly using bullet points, bold highlights, and markdown tables when comparing stocks.
- Be clear, practical, encouraging, and highly analytical.
- ALWAYS append this educational disclaimer at the end of responses:
  "⚠️ Disclaimer: Information provided by Enersit AI is for educational and analytical purposes only. Please consult a SEBI-registered investment advisor before making financial decisions."`
};

// ─── Chat State ─────────────────────────────────────────
let conversationHistory = [];
let isLoading = false;

// ─── DOM Ready ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  drawHeroChart();
  initNavbarScroll();
  initInputAutoResize();

  // Show modal only if localStorage key is explicitly cleared
  const savedKey = localStorage.getItem('enersit_api_key');
  if (savedKey) {
    const inp = document.getElementById('apiKeyInput');
    if (inp) inp.value = savedKey;
  }
  // Modal is accessible via the key icon in chat header
});

// ─── Modal Controls ─────────────────────────────────────
function openKeyModal(isFirstTime = false) {
  const modal = document.getElementById('keyModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  if (!modal) return;
  // Only show close button if a key already exists (not first-time setup)
  if (closeBtn) closeBtn.style.display = (!isFirstTime && ENERSIT_CONFIG.apiKey) ? 'flex' : 'none';
  // Pre-fill if key exists
  const inp = document.getElementById('apiKeyInput');
  if (inp && ENERSIT_CONFIG.apiKey) inp.value = ENERSIT_CONFIG.apiKey;
  modal.classList.add('active');
}

function closeKeyModal() {
  const modal = document.getElementById('keyModal');
  if (modal) modal.classList.remove('active');
}

function toggleKeyVisibility() {
  const inp = document.getElementById('apiKeyInput');
  const icon = document.getElementById('eyeIcon');
  if (!inp) return;
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  icon.innerHTML = isHidden
    ? '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9.88 9.88a3 3 0 104.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0112 5c7 0 11 8 11 8a13.16 13.16 0 01-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 002 12s4 8 10 8a9.74 9.74 0 005.39-1.61"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

async function saveApiKey() {
  const inp = document.getElementById('apiKeyInput');
  const msg = document.getElementById('keyValidationMsg');
  const btn = document.getElementById('saveKeyBtn');
  const key = inp ? inp.value.trim() : '';

  // Basic format validation
  if (!key) {
    setValidation(msg, 'error', '✗ Please paste your API key first.');
    return;
  }
  if (!key.startsWith('AIza') || key.length < 30) {
    setValidation(msg, 'error', '✗ Invalid format. Key must start with "AIzaSy..." (get it from aistudio.google.com/apikey)');
    return;
  }

  // Test the key live
  setValidation(msg, 'testing', '⏳ Verifying key with Enersit AI...');
  if (btn) btn.disabled = true;

  try {
    const testRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
      }
    );

    if (testRes.status === 401 || testRes.status === 403) {
      setValidation(msg, 'error', '✗ Key rejected by API. Double-check you copied the full key from AI Studio.');
      if (btn) btn.disabled = false;
      return;
    }

    // 200 or any non-auth error = key is valid
    localStorage.setItem('enersit_api_key', key);
    setValidation(msg, 'success', '✓ Key verified and saved! Enersit AI is ready.');
    if (btn) btn.disabled = false;
    setTimeout(() => closeKeyModal(), 1200);
  } catch (err) {
    // Network error — save anyway, might be CORS on test
    localStorage.setItem('enersit_api_key', key);
    setValidation(msg, 'success', '✓ Key saved! You can start chatting now.');
    if (btn) btn.disabled = false;
    setTimeout(() => closeKeyModal(), 1200);
  }
}

function setValidation(el, type, text) {
  if (!el) return;
  el.className = `key-validation ${type}`;
  el.textContent = text;
}


// ─── Hero Chart ─────────────────────────────────────────
function drawHeroChart() {
  const canvas = document.getElementById('heroChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Realistic NIFTY data curve
  const data = [
    24200, 24350, 24180, 24420, 24510, 24380, 24600,
    24550, 24720, 24650, 24780, 24840, 24760, 24892
  ];

  const min = Math.min(...data) - 100;
  const max = Math.max(...data) + 100;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (W - 20) + 10,
    y: H - 10 - ((v - min) / (max - min)) * (H - 20)
  }));

  ctx.clearRect(0, 0, W, H);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(16, 220, 141, 0.3)');
  grad.addColorStop(1, 'rgba(16, 220, 141, 0)');

  // Smooth line
  ctx.beginPath();
  ctx.moveTo(points[0].x, H - 10);
  ctx.lineTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
  }
  ctx.lineTo(points[points.length - 1].x, H - 10);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#10DC8D';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Last point dot
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#10DC8D';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 220, 141, 0.2)';
  ctx.fill();
}

// ─── Navbar Scroll ──────────────────────────────────────
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (!nav) return;
    nav.style.background = window.scrollY > 20
      ? 'rgba(5, 10, 20, 0.98)'
      : 'rgba(5, 10, 20, 0.85)';
  });
}

// ─── Input Auto Resize ──────────────────────────────────
function initInputAutoResize() {
  const input = document.getElementById('chatInput');
  if (input) autoResize(input);
}
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ─── Scroll Helpers ─────────────────────────────────────
function scrollToChat() {
  const chatSection = document.getElementById('chat');
  if (chatSection) {
    chatSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('chatInput')?.focus(), 600);
  }
}
function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
}

// ─── Set Prompt from Sidebar ────────────────────────────
function setPrompt(text) {
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.value = text;
  autoResize(input);
  input.focus();
  scrollToChat();
}

// ─── Handle Key Down ────────────────────────────────────
function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// ─── Send Message ────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  input.value = '';
  autoResize(input);
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) sendBtn.disabled = true;

  // Append user message
  appendMessage('user', text);

  // Add to conversation history
  conversationHistory.push({ role: 'user', parts: [{ text }] });

  // Show typing indicator
  const typingId = showTyping();

  try {
    const response = await callEnersitAIWithFallback(text);
    removeTyping(typingId);
    appendMessage('ai', response);
    conversationHistory.push({ role: 'model', parts: [{ text: response }] });
  } catch (err) {
    removeTyping(typingId);
    appendMessage('ai', `⚠️ Enersit AI encountered a temporary issue connecting to the inference engine. Please retry in a moment.\n\n*Details: ${err.message}*`);
  }

  isLoading = false;
  if (sendBtn) sendBtn.disabled = false;
  input.focus();
}

// ─── Call Enersit AI with Multi-Model Fallback ───────────
async function callEnersitAIWithFallback(userText) {
  let lastError = null;

  for (const model of ENERSIT_CONFIG.models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENERSIT_CONFIG.apiKey}`;
      const body = {
        system_instruction: {
          parts: [{ text: ENERSIT_CONFIG.systemPrompt }]
        },
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Status ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`Model ${model} failed, trying next fallback:`, err.message);
      lastError = err;
      // Try next model in sequence
    }
  }

  throw lastError || new Error('All Enersit AI inference clusters busy. Please try again shortly.');
}

// ─── Append Message to Chat ──────────────────────────────
function appendMessage(role, text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.className = `message ${role === 'ai' ? 'ai-message' : 'user-message'}`;

  if (role === 'ai') {
    wrapper.innerHTML = `
      <div class="msg-avatar ai-av">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <path d="M9 9h.01M15 9h.01M9 15s1 2 3 2 3-2 3-2"/>
        </svg>
      </div>
      <div class="msg-bubble ai-bubble">
        ${formatMarkdown(text)}
        <div class="msg-time">${now} · Enersit AI Frontier</div>
      </div>`;
  } else {
    wrapper.innerHTML = `
      <div class="msg-bubble user-bubble">
        <p>${escapeHtml(text)}</p>
        <div class="msg-time">${now} · You</div>
      </div>
      <div class="msg-avatar user-av">YOU</div>`;
  }

  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;

  // Animate in
  wrapper.style.opacity = '0';
  wrapper.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    wrapper.style.transition = 'all 0.3s ease';
    wrapper.style.opacity = '1';
    wrapper.style.transform = 'translateY(0)';
  });
}

// ─── Typing Indicator ────────────────────────────────────
function showTyping() {
  const container = document.getElementById('chatMessages');
  if (!container) return '';
  const id = 'typing-' + Date.now();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'message ai-message';
  el.innerHTML = `
    <div class="msg-avatar ai-av">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M9 9h.01M15 9h.01M9 15s1 2 3 2 3-2 3-2"/>
      </svg>
    </div>
    <div class="typing-indicator"><span></span><span></span><span></span></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  if (id) document.getElementById(id)?.remove();
}

// ─── Clear Chat ──────────────────────────────────────────
function clearChat() {
  conversationHistory = [];
  const container = document.getElementById('chatMessages');
  if (!container) return;
  container.innerHTML = `
    <div class="message ai-message">
      <div class="msg-avatar ai-av">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <path d="M9 9h.01M15 9h.01M9 15s1 2 3 2 3-2 3-2"/>
        </svg>
      </div>
      <div class="msg-bubble ai-bubble">
        <p>Chat cleared! 🔄 I'm ready for your next question about Indian stocks, mutual funds, or portfolio strategies. What would you like to explore?</p>
        <div class="msg-time">Just now · Enersit AI</div>
      </div>
    </div>`;
}

// ─── Format Markdown to HTML ─────────────────────────────
function formatMarkdown(text) {
  let html = escapeHtml(text);

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(245,166,35,0.12);padding:2px 6px;border-radius:4px;font-size:12px;color:#F5A623;">$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 style="color:#F5A623;font-size:14px;font-weight:700;margin:12px 0 6px;">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="color:#F5A623;font-size:16px;font-weight:700;margin:14px 0 6px;">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 style="color:#F5A623;font-size:18px;font-weight:800;margin:14px 0 6px;">$1</h2>');

  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="padding-left:18px;margin:8px 0;">$1</ul>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:14px 0;">');

  // Paragraphs
  const paras = html.split(/\n\n+/).filter(p => p.trim());
  html = paras.map(p => {
    if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<hr')) return p;
    return `<p style="margin-bottom:8px;">${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

// ─── Escape HTML ─────────────────────────────────────────
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
