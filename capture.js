/*
  ZOEK TOOLS — REPORT CAPTURE
  Add <script src="capture.js"></script> before </body>, alongside cta.js.

  WHY THIS EXISTS
  Two of twenty tools capture an email (business-snapshot and its white-label
  twin). The other eighteen give away the whole result and collect nothing.

  The fix is NOT to gate the tools — free and instant is why people use them.
  It gates the SAVED / EMAILED report instead. Anyone who wants their results
  in writing will give an email; anyone who won't was never a lead.

  TWO WAYS TO USE IT
  1. Markup only, no JS. Drop a button anywhere on the page:
       <button data-zoek-report>Email me this report</button>
     Optionally describe the result so the lead arrives with context:
       <button data-zoek-report data-summary-from="#score">…</button>

  2. From your own code, when results render:
       ZoekCapture.ask({
         tool: 'revenue_loss',
         business_name: biz.name,
         overall_score: 42,
         weak_areas: ['No mobile site', 'No reviews'],
         extra: { website: biz.url }
       }).then(function (lead) { if (lead) unlockPdf(); });

  Posts to the existing /.netlify/functions/leads, so Supabase and the Resend
  alert to Kesley keep working exactly as they do today.
*/
(function () {
  if (window.ZoekCapture) return;

  var ENDPOINT = '/.netlify/functions/leads';

  // Tool slug from the filename, so every tool is tracked separately without
  // anyone having to remember to set it.
  function toolSlug() {
    var f = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/, '');
    return (f || 'index').replace(/-/g, '_');
  }

  var style = document.createElement('style');
  style.textContent = [
    '#zk-cap-ov{position:fixed;inset:0;z-index:9500;background:rgba(10,8,24,.72);',
    'backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:1.25rem;}',
    '#zk-cap-ov.open{display:flex;}',
    '#zk-cap{width:100%;max-width:400px;background:#1a1a2e;border:1px solid rgba(108,99,255,.3);',
    'border-radius:8px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.6);',
    "font-family:'Plus Jakarta Sans','DM Sans',system-ui,sans-serif;}",
    '#zk-cap .zk-h{background:linear-gradient(135deg,#692C8E,#ED0875);padding:1.15rem 1.35rem;}',
    '#zk-cap .zk-h b{display:block;color:#fff;font-size:1.05rem;font-weight:800;letter-spacing:-.01em;}',
    '#zk-cap .zk-h span{display:block;color:rgba(255,255,255,.78);font-size:.76rem;margin-top:.25rem;}',
    '#zk-cap .zk-b{padding:1.35rem;}',
    '#zk-cap label{display:block;color:#a0a0c0;font-size:.68rem;letter-spacing:.09em;',
    'text-transform:uppercase;margin:.85rem 0 .3rem;}',
    '#zk-cap label:first-child{margin-top:0;}',
    '#zk-cap input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);',
    'border:1px solid rgba(108,99,255,.28);border-radius:4px;padding:.65rem .75rem;',
    'color:#fff;font-family:inherit;font-size:.92rem;}',
    '#zk-cap input:focus{outline:none;border-color:#1EBFDC;}',
    '#zk-cap .zk-go{width:100%;margin-top:1.15rem;background:linear-gradient(135deg,#692C8E,#ED0875);',
    'color:#fff;border:0;border-radius:4px;padding:.85rem;font-family:inherit;font-size:.95rem;',
    'font-weight:700;cursor:pointer;}',
    '#zk-cap .zk-go:disabled{opacity:.6;cursor:default;}',
    '#zk-cap .zk-fine{color:#6e6e8a;font-size:.68rem;text-align:center;margin:.8rem 0 0;line-height:1.5;}',
    '#zk-cap .zk-err{color:#ff5c7c;font-size:.78rem;margin:.7rem 0 0;}',
    '#zk-cap .zk-x{position:absolute;top:.7rem;right:.9rem;background:none;border:0;color:rgba(255,255,255,.6);',
    'font-size:1.4rem;cursor:pointer;line-height:1;}',
    '#zk-cap .zk-wrap{position:relative;}',
    '#zk-cap .zk-done{padding:2rem 1.35rem;text-align:center;}',
    '#zk-cap .zk-done .tick{width:46px;height:46px;border-radius:50%;background:rgba(79,255,176,.14);',
    'color:#4fffb0;font-size:1.4rem;display:flex;align-items:center;justify-content:center;margin:0 auto .9rem;}',
    '#zk-cap .zk-done b{color:#fff;font-size:1.05rem;display:block;margin-bottom:.35rem;}',
    '#zk-cap .zk-done p{color:#a0a0c0;font-size:.85rem;margin:0;}',
    // honeypot — offscreen, never focusable
    '#zk-cap .zk-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}',
  ].join('');
  document.head.appendChild(style);

  var ov = document.createElement('div');
  ov.id = 'zk-cap-ov';
  ov.innerHTML =
    '<div id="zk-cap"><div class="zk-wrap">' +
    '<button class="zk-x" aria-label="Close">&times;</button>' +
    '<div class="zk-h"><b>Send me this report</b><span>Your results, in writing. Takes 15 seconds.</span></div>' +
    '<div class="zk-b" id="zk-form">' +
    '<label for="zk-email">Email</label><input id="zk-email" type="email" placeholder="you@yourbusiness.com" autocomplete="email">' +
    '<label for="zk-name">Your name</label><input id="zk-name" placeholder="Jane Smith" autocomplete="name">' +
    '<label for="zk-biz">Business name</label><input id="zk-biz" placeholder="Smith Plumbing" autocomplete="organization">' +
    '<div class="zk-hp"><label for="zk-hp">Leave blank</label><input id="zk-hp" tabindex="-1" autocomplete="off"></div>' +
    '<p class="zk-err" id="zk-err" style="display:none"></p>' +
    '<button class="zk-go" id="zk-go">Send it over</button>' +
    '<p class="zk-fine">We\u2019ll never sell your details. Unsubscribe any time.</p>' +
    '</div></div></div>';
  document.body.appendChild(ov);

  var elForm = ov.querySelector('#zk-form');
  var elEmail = ov.querySelector('#zk-email');
  var elName = ov.querySelector('#zk-name');
  var elBiz = ov.querySelector('#zk-biz');
  var elHp = ov.querySelector('#zk-hp');
  var elErr = ov.querySelector('#zk-err');
  var elGo = ov.querySelector('#zk-go');

  var pending = null;

  function close(result) {
    ov.classList.remove('open');
    if (pending) { pending(result || null); pending = null; }
  }

  ov.querySelector('.zk-x').addEventListener('click', function () { close(null); });
  ov.addEventListener('click', function (e) { if (e.target === ov) close(null); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ov.classList.contains('open')) close(null);
  });

  function send(ctx) {
    var email = (elEmail.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      elErr.textContent = 'That email doesn\u2019t look right.';
      elErr.style.display = 'block';
      return;
    }
    // Bot filled the hidden field. Look successful, save nothing.
    if ((elHp.value || '').trim()) { showDone(); return; }

    elErr.style.display = 'none';
    elGo.disabled = true;
    elGo.textContent = 'Sending\u2026';

    var utm = {};
    try {
      new URLSearchParams(location.search).forEach(function (v, k) {
        if (k.indexOf('utm_') === 0) utm[k] = v;
      });
    } catch (e) {}

    var payload = {
      tool: ctx.tool || toolSlug(),
      name: (elName.value || '').trim() || null,
      email: email,
      business_name: (elBiz.value || '').trim() || ctx.business_name || null,
      overall_score: typeof ctx.overall_score === 'number' ? ctx.overall_score : null,
      weak_areas: ctx.weak_areas || [],
      location: ctx.location || null,
      industry: ctx.industry || null,
      extra: Object.assign({ page: location.pathname, utm: utm }, ctx.extra || {}),
    };

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function () { showDone(payload); })
      .catch(function () {
        // Never trap someone behind a failed request — let them through.
        showDone(payload);
      });
  }

  function showDone(payload) {
    elForm.innerHTML =
      '<div class="zk-done"><div class="tick">&#10003;</div>' +
      '<b>On its way.</b><p>Check your inbox in the next few minutes.</p></div>';
    setTimeout(function () { close(payload || {}); }, 1600);
  }

  window.ZoekCapture = {
    /** Opens the gate. Resolves with the lead, or null if they closed it. */
    ask: function (ctx) {
      ctx = ctx || {};
      if (ctx.business_name && !elBiz.value) elBiz.value = ctx.business_name;
      ov.classList.add('open');
      setTimeout(function () { elEmail.focus(); }, 60);
      elGo.onclick = function () { send(ctx); };
      elEmail.onkeydown = function (e) { if (e.key === 'Enter') send(ctx); };
      elBiz.onkeydown = function (e) { if (e.key === 'Enter') send(ctx); };
      return new Promise(function (resolve) { pending = resolve; });
    },
  };

  // Markup-only path: any [data-zoek-report] button opens the gate.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-zoek-report]');
    if (!btn) return;
    e.preventDefault();

    var ctx = { tool: btn.getAttribute('data-tool') || toolSlug() };
    var sel = btn.getAttribute('data-summary-from');
    if (sel) {
      var node = document.querySelector(sel);
      if (node) ctx.extra = { result_summary: (node.textContent || '').trim().slice(0, 600) };
    }
    var scoreSel = btn.getAttribute('data-score-from');
    if (scoreSel) {
      var s = document.querySelector(scoreSel);
      if (s) {
        var num = parseInt((s.textContent || '').replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) ctx.overall_score = num;
      }
    }
    ZoekCapture.ask(ctx);
  });
})();
