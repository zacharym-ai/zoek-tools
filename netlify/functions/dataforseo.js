// Netlify serverless function — DataForSEO proxy
// Credentials stored in Netlify environment variables (Site settings → Environment)

const BASE_URL = 'https://api.dataforseo.com/v3';

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: '' };

  // Read from Netlify environment variables — never hardcoded
  const login    = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'DataForSEO credentials not configured in environment variables' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { endpoint, payload } = body;
  if (!endpoint || !payload) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing endpoint or payload' }) };
  }

  // Whitelist allowed endpoints
  const ALLOWED = [
    'on_page/task_post',
    'on_page/summary',
    'backlinks/summary/live',
    'serp/google/organic/live/advanced',
  ];
  if (!ALLOWED.some(e => endpoint.includes(e))) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Endpoint not allowed' }) };
  }

  try {
    const creds = Buffer.from(login + ':' + password).toString('base64');
    const url   = BASE_URL + '/' + endpoint.replace(/^\//, '');

    const resp = await fetch(url, {
      method:  'POST',
      headers: { 'Authorization': 'Basic ' + creds, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
