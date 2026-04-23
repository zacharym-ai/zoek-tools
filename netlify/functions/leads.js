// netlify/functions/leads.js
// Saves public tool leads to Supabase public_leads table
// Sends hot lead email to Kesley via Resend

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

  const supabaseUrl = process.env.ZOEKTOOLS_SUPABASE_URL;
  const supabaseKey = process.env.ZOEKTOOLS_SUPABASE_ANON_KEY;
  const resendKey   = process.env.RESEND_API_KEY;

  console.log('leads.js called — supabase configured:', !!(supabaseUrl && supabaseKey));

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { tool, name, email, business_name, overall_score, weak_areas, location, industry, extra } = body;

  // ── 1. Save to Supabase ──────────────────────────────────────────
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
        tool, name: name || null, email: email || null,
        business_name: business_name || null,
        overall_score: overall_score ?? null,
        weak_areas: weak_areas || [],
        location: location || null, industry: industry || null,
        extra: extra || null,
        created_at: new Date().toISOString(),
      }),
    });
    if (sbRes.ok) {
      const rows = await sbRes.json();
      leadId = rows?.[0]?.id;
      console.log('Lead saved to Supabase:', leadId);
    } else {
      const err = await sbRes.text();
      console.error('Supabase insert error:', sbRes.status, err);
    }
  } catch(e) {
    console.error('Supabase save failed:', e.message);
  }

  // ── 2. Email Kesley via Resend ───────────────────────────────────
  if (resendKey && email) {
    try {
      const toolLabel  = tool === 'business_snapshot' ? 'Business Snapshot' : 'Local Market Scanner';
      const scoreColor = overall_score >= 70 ? '#4fffb0' : overall_score >= 50 ? '#FAA31C' : '#ff5c7c';
      const scoreLabel = overall_score >= 70 ? 'Strong' : overall_score >= 50 ? 'Needs Work' : 'Critical Gaps';
      const weakHtml   = (weak_areas || []).length > 0
        ? `<p style="margin:0 0 8px"><strong>Weak areas flagged:</strong></p><ul style="margin:0 0 16px;padding-left:20px">${(weak_areas||[]).map(w=>`<li style="color:#a0a0c0;font-size:14px">${w}</li>`).join('')}</ul>`
        : '';

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    'Zoek Tools <noreply@gozoek.com>',
          to:      ['kesley@gozoek.com'],
          subject: `🔥 New ${toolLabel} Lead — ${business_name || 'Unknown Business'} (Score: ${overall_score ?? '?'}/100)`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#1E1044;border-radius:10px;overflow:hidden;"><div style="background:linear-gradient(135deg,#692C8E,#ED0875);padding:24px 28px;"><div style="font-size:22px;font-weight:800;color:white;">New Public Lead 🔥</div><div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">${toolLabel}</div></div><div style="padding:28px;color:white;font-family:Arial,sans-serif;"><p style="margin:0 0 8px"><strong>Business:</strong> ${business_name||'—'}</p><p style="margin:0 0 8px"><strong>Contact:</strong> ${name||'—'}</p><p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${email}" style="color:#1EBFDC;">${email}</a></p>${location?`<p style="margin:0 0 8px"><strong>Location:</strong> ${location}</p>`:''}<div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:16px;margin:16px 0;"><span style="font-size:36px;font-weight:800;color:${scoreColor};">${overall_score??'?'}</span><span style="color:${scoreColor};margin-left:10px;font-weight:700;">/100 — ${scoreLabel}</span></div>${weakHtml}<div style="text-align:center;margin-top:20px;"><a href="mailto:${email}" style="background:linear-gradient(135deg,#692C8E,#ED0875);color:white;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;display:inline-block;">Email This Lead →</a></div><p style="font-size:11px;color:#666;text-align:center;margin-top:16px;">Lead ID: ${leadId||'not saved'} · zoek-tools.netlify.app</p></div></div>`,
        }),
      });
      console.log('Resend response:', emailRes.status);
    } catch(e) {
      console.error('Resend email failed:', e.message);
    }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true, leadId }) };
};
