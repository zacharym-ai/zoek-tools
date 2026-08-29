// Netlify serverless function — PageSpeed Insights proxy

exports.handler = async function(event, context) {
  // Set function timeout budget
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: '' };

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GOOGLE_API_KEY not set in environment variables' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { url, strategy } = body;
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing url' }) };

  try {
    // Use AbortController to enforce a hard timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s max

    const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
      + '?url=' + encodeURIComponent(url)
      + '&strategy=' + (strategy || 'mobile')
      + '&category=performance&category=seo&category=best-practices&category=accessibility'
      + '&key=' + apiKey;

    const resp = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: 'PageSpeed API error: ' + resp.status }) };
    }

    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    if (e.name === 'AbortError') {
      return { statusCode: 504, headers, body: JSON.stringify({ error: 'PageSpeed request timed out' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
