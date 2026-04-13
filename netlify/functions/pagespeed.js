// Netlify serverless function — PageSpeed Insights proxy
// Keeps your Google API key server-side

const PAGESPEED_API_KEY = 'AIzaSyCsyy7qI25JAs4h1BaTZMaSPWgGISqD42o'; // ← same key

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: '' };

  let body;
  try { body = JSON.parse(event.body); } 
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { url, strategy } = body;
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing url' }) };

  try {
    const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' 
      + encodeURIComponent(url) 
      + '&strategy=' + (strategy || 'mobile') 
      + '&key=' + PAGESPEED_API_KEY;

    const resp = await fetch(apiUrl);
    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
