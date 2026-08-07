const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  if (request.method === 'GET') {
    return json({ ok: true, service: 'generate-passage', message: 'API 已上线。请从网站点击生成按钮发送 POST 请求。' });
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

  let upstream;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
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
  } catch (error) {
    return json({ error: `Unable to reach AI provider: ${error.message}` }, 502);
  }

  const responseText = await upstream.text();
  return new Response(responseText, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}
