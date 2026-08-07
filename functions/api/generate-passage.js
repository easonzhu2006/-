const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 500);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400);
  }

  const { model = 'gpt-4o-mini', messages, temperature, presence_penalty, frequency_penalty, response_format } = payload || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages is required' }, 400);
  }

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || model,
      messages,
      temperature,
      presence_penalty,
      frequency_penalty,
      response_format,
    }),
  });

  const responseText = await upstream.text();
  return new Response(responseText, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}
