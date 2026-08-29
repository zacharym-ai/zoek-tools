// Netlify function — fetches a webpage and extracts basic SEO signals
// No external API needed — just parses the HTML directly

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

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { url } = body;
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing url' }) };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZoekBot/1.0)' },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);

    const html = await resp.text();
    const finalUrl = resp.url || url;

    // Extract SEO signals from HTML
    const titleMatch    = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch     = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
                       || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const h1Match       = html.match(/<h1[^>]*>/gi);
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
    const canonicalMatch= html.match(/<link[^>]*rel=["']canonical["']/i);

    const result = {
      titleLength:  titleMatch  ? titleMatch[1].trim().length : 0,
      descLength:   descMatch   ? descMatch[1].trim().length  : 0,
      h1Count:      h1Match     ? h1Match.length              : 0,
      hasViewport:  !!viewportMatch,
      hasCanonical: !!canonicalMatch,
      httpsRedirect: finalUrl.startsWith('https'),
      pageSize:     html.length,
      statusCode:   resp.status,
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch(e) {
    if (e.name === 'AbortError') {
      return { statusCode: 504, headers, body: JSON.stringify({ error: 'Page fetch timed out' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
