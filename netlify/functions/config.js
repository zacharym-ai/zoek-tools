// netlify/functions/config.js
// Safely exposes public config values to the frontend
// Never expose secret keys here — only keys safe for browser use

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      googleApiKey: process.env.GOOGLE_API_KEY || '',
    }),
  };
};
