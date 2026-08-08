const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}

function normalizeBaseUrl(value) {
  const base = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
  if (base.endsWith('/chat/completions')) return base.slice(0, -'/chat/completions'.length);
  return base;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method === 'GET') {
    return json({
      ok: true,
      service: 'generate-passage',
      providerBaseUrl: normalizeBaseUrl(env.OPENAI_BASE_URL || DEFAULT_BASE_URL),
      model: env.OPENAI_MODEL || DEFAULT_MODEL,
      message: 'API 已上线。请从网站点击生成按钮发送 POST 请求。',
    });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 500);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400);
  }

  const { model = DEFAULT_MODEL, messages, temperature, presence_penalty, frequency_penalty, response_format } = payload || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages is required' }, 400);
  }

  const baseUrl = normalizeBaseUrl(env.OPENAI_BASE_URL || DEFAULT_BASE_URL);
  const upstreamUrl = `${baseUrl}/chat/completions`;
  const upstreamModel = env.OPENAI_MODEL || model;

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${String(env.OPENAI_API_KEY).trim()}`,
      },
      body: JSON.stringify({
        model: upstreamModel,
        messages,
        temperature,
        presence_penalty,
        frequency_penalty,
        response_format,
      }),
    });
  } catch (error) {
    return json({ error: `Unable to reach AI provider: ${error.message}`, upstreamUrl }, 502);
  }

  const responseText = await upstream.text();
  return new Response(responseText, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}
