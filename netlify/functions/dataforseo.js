// Netlify serverless function — DataForSEO proxy
// Credentials stored in Netlify environment variables

const BASE_URL = 'https://api.dataforseo.com/v3';

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

  const login    = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'DataForSEO credentials not set' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { endpoint, payload } = body;
  if (!endpoint || payload === undefined) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing endpoint or payload' }) };
  }

  const ALLOWED = [
    'on_page/task_post',
    'on_page/summary',
    'backlinks/summary/live',
    'serp/google/organic/live/advanced',
    'content_analysis/search/live',
  ];
  if (!ALLOWED.some(e => endpoint.includes(e))) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Endpoint not allowed: ' + endpoint }) };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 24000);

    const creds = Buffer.from(login + ':' + password).toString('base64');
    const url   = BASE_URL + '/' + endpoint.replace(/^\//, '');

    const resp = await fetch(url, {
      method:  'POST',
      headers: { 'Authorization': 'Basic ' + creds, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timeout);

    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    if (e.name === 'AbortError') {
      return { statusCode: 504, headers, body: JSON.stringify({ error: 'Request timed out' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
