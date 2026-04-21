// netlify/functions/leads.js
// Saves public tool leads to Supabase public_leads table
// Sends hot lead email to Kesley via Resend
// Called from Business Snapshot and Local Market Scanner on scan completion

exports.handler = async function(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: '' };

  const supabaseUrl  = process.env.ZOEKTOOLS_SUPABASE_URL;
  const supabaseKey  = process.env.ZOEKTOOLS_SUPABASE_ANON_KEY;
  const resendKey    = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const {
    tool,           // 'business_snapshot' | 'local_market_scanner'
    name,           // prospect's name (from form)
    email,          // prospect's email
    business_name,  // their business name
    overall_score,  // 0–100
    weak_areas,     // array of section names scoring < 70
    location,       // city/state (scanner only)
    industry,       // industry key
    extra,          // any extra JSON blob (keywords, radius, etc.)
  } = body;

  // ── 1. Save to Supabase ───────────────────────────────────────────
  let leadId = null;
  try {
    const sbRes = await fetch(`${supabaseUrl}/rest/v1/public_leads`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer':        'return=representation',
      },
      body: JSON.stringify({
        tool,
        name:          name  || null,
        email:         email || null,
        business_name: business_name || null,
        overall_score: overall_score ?? null,
        weak_areas:    weak_areas    || [],
        location:      location      || null,
        industry:      industry      || null,
        extra:         extra         || null,
        created_at:    new Date().toISOString(),
      }),
    });

    if (sbRes.ok) {
      const [row] = await sbRes.json();
      leadId = row?.id;
    } else {
      const err = await sbRes.text();
      console.error('Supabase insert error:', err);
    }
  } catch(e) {
    console.error('Supabase save failed:', e.message);
  }

  // ── 2. Email Kesley via Resend ────────────────────────────────────
  if (resendKey && email) {
    try {
      const toolLabel   = tool === 'business_snapshot' ? 'Business Snapshot' : 'Local Market Scanner';
      const scoreColor  = overall_score >= 70 ? '#4fffb0' : overall_score >= 50 ? '#FAA31C' : '#ff5c7c';
      const scoreLabel  = overall_score >= 70 ? 'Strong' : overall_score >= 50 ? 'Needs Work' : 'Critical Gaps';
      const weakHtml    = (weak_areas || []).length > 0
        ? `<p style="margin:0 0 8px"><strong>Weak areas flagged:</strong></p><ul style="margin:0 0 16px;padding-left:20px">${(weak_areas || []).map(w => `<li style="color:#a0a0c0;font-size:14px">${w}</li>`).join('')}</ul>`
        : '';

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    'Zoek Tools <noreply@gozoek.com>',
          to:      ['kesley@gozoek.com'],
          subject: `🔥 New ${toolLabel} Lead — ${business_name || 'Unknown Business'} (Score: ${overall_score ?? '?'}/100)`,
          html: `
            <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#1E1044;border-radius:10px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#692C8E,#ED0875);padding:24px 28px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px;">Zoek Tools · ${toolLabel}</div>
                <div style="font-size:22px;font-weight:800;color:white;">New Public Lead 🔥</div>
              </div>
              <div style="padding:28px;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:8px 0;color:#a0a0c0;font-size:14px;width:140px;">Business</td><td style="padding:8px 0;color:white;font-size:14px;font-weight:700;">${business_name || '—'}</td></tr>
                  <tr><td style="padding:8px 0;color:#a0a0c0;font-size:14px;">Contact Name</td><td style="padding:8px 0;color:white;font-size:14px;">${name || '—'}</td></tr>
                  <tr><td style="padding:8px 0;color:#a0a0c0;font-size:14px;">Email</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#1EBFDC;">${email}</a></td></tr>
                  ${location ? `<tr><td style="padding:8px 0;color:#a0a0c0;font-size:14px;">Location</td><td style="padding:8px 0;color:white;font-size:14px;">${location}</td></tr>` : ''}
                  ${industry ? `<tr><td style="padding:8px 0;color:#a0a0c0;font-size:14px;">Industry</td><td style="padding:8px 0;color:white;font-size:14px;">${industry}</td></tr>` : ''}
                </table>

                ${overall_score != null ? `
                <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(105,44,142,0.3);border-radius:8px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:16px;">
                  <div style="font-family:Georgia,serif;font-size:42px;font-weight:800;color:${scoreColor};line-height:1;">${overall_score}</div>
                  <div>
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a0a0c0;margin-bottom:4px;">Overall Score</div>
                    <div style="font-size:14px;font-weight:700;color:${scoreColor};">${scoreLabel}</div>
                  </div>
                </div>` : ''}

                ${weakHtml}

                <div style="margin-top:24px;text-align:center;">
                  <a href="mailto:${email}?subject=Your Zoek Marketing Report — ${encodeURIComponent(business_name || '')}" 
                     style="display:inline-block;background:linear-gradient(135deg,#692C8E,#ED0875);color:white;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;">
                    Email This Lead →
                  </a>
                </div>
                <p style="font-size:12px;color:#555;text-align:center;margin-top:16px;">Lead ID: ${leadId || 'not saved'} · Zoek Tools · zoek-tools.netlify.app</p>
              </div>
            </div>
          `,
        }),
      });
    } catch(e) {
      console.error('Resend email failed:', e.message);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, leadId }),
  };
};
