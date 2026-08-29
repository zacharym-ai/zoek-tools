// netlify/functions/chat.js
// Proxies Claude API for the AI chat widget on Business Snapshot + Local Market Scanner results
// Keeps the Anthropic API key server-side

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { system, messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing messages array' }) };
  }

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 24000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key':         apiKey,
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        system:     system || 'You are a helpful Zoek Marketing assistant.',
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    if (e.name === 'AbortError') {
      return { statusCode: 504, headers, body: JSON.stringify({ error: 'Request timed out' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
