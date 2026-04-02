/*
  ZOEK MARKETING — BOOK A CALL CTA FLOATER
  Fixed bottom-right button that opens a "Book a Strategy Call" panel.
  Add <script src="cta.js"></script> before </body> on every tool page.
*/
(function () {
  if (document.getElementById('zoek-cta-wrap')) return;

  const style = document.createElement('style');
  style.textContent = `
    #zoek-cta-wrap {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9000;
      display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;
      font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
    }
    #zoek-cta-btn {
      background: linear-gradient(135deg, #6c63ff 0%, #00a8ff 100%);
      color: #ffffff;
      border: none;
      padding: 0.7rem 1.3rem;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      cursor: pointer;
      display: flex; align-items: center; gap: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(108,99,255,0.4);
      transition: all 0.2s;
      white-space: nowrap;
    }
    #zoek-cta-btn:hover {
      box-shadow: 0 6px 28px rgba(108,99,255,0.6);
      transform: translateY(-1px);
    }
    #zoek-cta-btn .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4fffb0;
      animation: ctaPulse 1.8s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes ctaPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    #zoek-cta-panel {
      display: none; width: 320px;
      background: #1a1a2e;
      border: 1px solid rgba(108,99,255,0.3);
      border-radius: 6px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    #zoek-cta-panel.open { display: block; }
    .zcp-head {
      background: linear-gradient(135deg, #1f1b3a 0%, #16213e 100%);
      padding: 1.1rem 1.25rem;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(108,99,255,0.2);
    }
    .zcp-head-left { display: flex; flex-direction: column; gap: 0.2rem; }
    .zcp-title {
      font-weight: 700; font-size: 0.95rem; color: #ffffff;
      letter-spacing: 0.02em;
    }
    .zcp-sub { font-size: 0.72rem; color: #a0a0c0; }
    .zcp-close {
      background: none; border: none; color: rgba(255,255,255,0.35);
      cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 0;
      transition: color 0.15s;
    }
    .zcp-close:hover { color: #ffffff; }
    .zcp-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
    .zcp-pitch {
      font-size: 0.82rem; color: #a0a0c0; line-height: 1.7;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .zcp-pitch strong { color: #ffffff; font-weight: 600; }
    .zcp-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.2rem; }
    .zcp-badge {
      font-size: 0.65rem; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; padding: 0.2rem 0.55rem;
      background: rgba(108,99,255,0.15); color: #6c63ff;
      border-radius: 3px; border: 1px solid rgba(108,99,255,0.25);
    }
    .zcp-cta-main {
      display: block; width: 100%; padding: 0.9rem 1rem;
      background: linear-gradient(135deg, #6c63ff 0%, #00a8ff 100%);
      color: #ffffff; text-decoration: none;
      text-align: center; font-weight: 700; font-size: 0.9rem;
      border-radius: 4px; letter-spacing: 0.02em;
      transition: all 0.2s; box-shadow: 0 4px 16px rgba(108,99,255,0.3);
    }
    .zcp-cta-main:hover {
      box-shadow: 0 6px 24px rgba(108,99,255,0.5);
      transform: translateY(-1px);
    }
    .zcp-cta-main span { display: block; font-size: 0.7rem; font-weight: 400; opacity: 0.85; margin-top: 0.15rem; }
    .zcp-secondary {
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .zcp-sec-btn {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 4px; cursor: pointer; text-decoration: none;
      transition: all 0.15s;
    }
    .zcp-sec-btn:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(108,99,255,0.3);
    }
    .zcp-sec-icon { font-size: 1rem; flex-shrink: 0; }
    .zcp-sec-text { display: flex; flex-direction: column; gap: 0.1rem; }
    .zcp-sec-title { font-size: 0.8rem; font-weight: 600; color: #ffffff; }
    .zcp-sec-desc { font-size: 0.68rem; color: #a0a0c0; line-height: 1.4; }
    .zcp-footer {
      padding: 0.75rem 1.25rem;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex; align-items: center; gap: 0.5rem;
    }
    .zcp-footer-logo {
      font-weight: 800; font-size: 0.75rem; color: rgba(255,255,255,0.4);
      letter-spacing: 0.05em; text-transform: uppercase;
    }
    .zcp-footer-sep { color: rgba(255,255,255,0.15); font-size: 0.75rem; }
    .zcp-footer-note { font-size: 0.68rem; color: rgba(255,255,255,0.25); }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'zoek-cta-wrap';
  wrap.innerHTML = `
    <div id="zoek-cta-panel">
      <div class="zcp-head">
        <div class="zcp-head-left">
          <span class="zcp-title">Ready to grow faster?</span>
          <span class="zcp-sub">Talk to a Zoek growth strategist — free</span>
        </div>
        <button class="zcp-close" onclick="document.getElementById('zoek-cta-panel').classList.remove('open')">&#215;</button>
      </div>
      <div class="zcp-body">
        <div class="zcp-pitch">
          These tools show you <strong>what's happening</strong> in your marketing. Our team shows you <strong>exactly what to do about it</strong> — and builds it for you.
          <div class="zcp-badges">
            <span class="zcp-badge">#1 Wix Partner</span>
            <span class="zcp-badge">Premier Google Partner</span>
            <span class="zcp-badge">50k+ clients</span>
          </div>
        </div>
        <a href="https://calendly.com/expert-sales" target="_blank" class="zcp-cta-main">
          Book a Free Strategy Call
          <span>30 min · No pitch, just strategy</span>
        </a>
        <div class="zcp-secondary">
          <a href="https://gozoek.com" target="_blank" class="zcp-sec-btn">
            <span class="zcp-sec-icon">🌐</span>
            <div class="zcp-sec-text">
              <span class="zcp-sec-title">Visit gozoek.com</span>
              <span class="zcp-sec-desc">See our full suite of growth marketing services</span>
            </div>
          </a>
          <div class="zcp-sec-btn" onclick="zoekShareTool()">
            <span class="zcp-sec-icon">🔗</span>
            <div class="zcp-sec-text">
              <span class="zcp-sec-title">Share this tool</span>
              <span class="zcp-sec-desc">Send it to a colleague or client who needs it</span>
            </div>
          </div>
        </div>
      </div>
      <div class="zcp-footer">
        <span class="zcp-footer-logo">Zoek Marketing</span>
        <span class="zcp-footer-sep">·</span>
        <span class="zcp-footer-note">132,000+ websites · Irvine, CA</span>
      </div>
    </div>
    <button id="zoek-cta-btn" onclick="toggleZoekCTA()">
      <span class="pulse-dot"></span>
      Book a Free Call
    </button>
  `;
  document.body.appendChild(wrap);

  function toggleZoekCTA() {
    document.getElementById('zoek-cta-panel').classList.toggle('open');
  }
  window.toggleZoekCTA = toggleZoekCTA;

  window.zoekShareTool = function () {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Zoek Marketing Tools', text: 'Free growth marketing tools from Zoek — the #1 Wix Partner Agency.', url });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
    }
  };

  // Auto-show panel after 45 seconds if not already opened
  let autoShown = false;
  setTimeout(function () {
    if (!autoShown) {
      autoShown = true;
      document.getElementById('zoek-cta-panel').classList.add('open');
    }
  }, 45000);
})();
