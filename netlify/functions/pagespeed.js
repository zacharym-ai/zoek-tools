// Netlify serverless function — PageSpeed Insights proxy
// API key stored in Netlify environment variables

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: '' };

  // Read from Netlify environment variables
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Google API key not configured in environment variables' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { url, strategy } = body;
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing url' }) };

  try {
    const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url='
      + encodeURIComponent(url)
      + '&strategy=' + (strategy || 'mobile')
      + '&key=' + apiKey;

    const resp = await fetch(apiUrl);
    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
