// Netlify serverless function — DataForSEO proxy
// Sits between the browser and DataForSEO API to avoid CORS issues

const DATAFORSEO_LOGIN    = 'zacharym@gozoek.com';
const DATAFORSEO_PASSWORD = '39c3676937317577';
const BASE_URL            = 'https://api.dataforseo.com/v3';

exports.handler = async function(event, context) {
  // CORS headers — allow requests from your domain
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { endpoint, payload } = body;
  if (!endpoint || !payload) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing endpoint or payload' }) };
  }

  // Whitelist allowed endpoints for security
  const ALLOWED = [
    'on_page/task_post',
    'on_page/summary',
    'backlinks/summary/live',
    'serp/google/organic/live/advanced',
  ];
  const allowed = ALLOWED.some(e => endpoint.includes(e));
  if (!allowed) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Endpoint not allowed' }) };
  }

  try {
    const creds = Buffer.from(DATAFORSEO_LOGIN + ':' + DATAFORSEO_PASSWORD).toString('base64');
    const url   = BASE_URL + '/' + endpoint.replace(/^\//, '');

    const resp = await fetch(url, {
      method:  'POST',
      headers: {
        'Authorization': 'Basic ' + creds,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch(e) {
    console.error('DataForSEO proxy error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
