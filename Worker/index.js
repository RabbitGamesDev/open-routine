/* OpenRutine Coach Worker — proxy seguro hacia OpenRouter.
   Secretos (nunca en el repo):
     wrangler secret put OPENROUTER_API_KEY
   Variables: MODEL (opcional), ALLOWED_ORIGINS (separadas por coma). */
const RATE_WINDOW = 60000, RATE_MAX = 20;
const hits = new Map();
const MAX_BODY = 32 * 1024;
const DEFAULT_MODEL = 'mistralai/mistral-7b-instruct:free';

function allowed(origin, env) {
  if (!origin) return false;
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(origin);
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type' } });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS')
      return allowed(origin, env) ? json(null, 204, origin) : json({ error: 'Origen no permitido' }, 403, '');
    if (!allowed(origin, env)) return json({ error: 'Origen no permitido' }, 403, '');

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const rec = hits.get(ip) || { n: 0, t: now };
    if (now - rec.t > RATE_WINDOW) { rec.n = 0; rec.t = now; }
    if (++rec.n > RATE_MAX) return json({ error: 'Demasiadas solicitudes. Espera un minuto.' }, 429, origin);
    hits.set(ip, rec);
    if (hits.size > 5000) hits.clear();

    const url = new URL(request.url);
    if (url.pathname === '/api/health') return json({ ok: true, model: env.MODEL || DEFAULT_MODEL }, 200, origin);
    if (url.pathname !== '/api/chat') return json({ error: 'Ruta no encontrada' }, 404, origin);

    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY) return json({ error: 'Solicitud demasiado grande' }, 413, origin);
      body = JSON.parse(text);
    } catch (e) { return json({ error: 'JSON invalido' }, 400, origin); }

    const message = String(body.message || '').slice(0, 2000).trim();
    if (!message) return json({ error: 'message requerido' }, 400, origin);
    const ctx = body.context && typeof body.context === 'object' ? body.context : {};

    const sys = `Eres el Coach de OpenRutine, app de organizacion personal de un joven desarrollador indie mexicano.
Contexto permitido por el usuario (solo estas areas: ${(ctx.areas || []).join(', ')}):
Tareas abiertas: ${JSON.stringify(ctx.pendientes || [])}
Completadas hoy: ${ctx.completadasHoy ?? 0} · Modo: ${ctx.modo} · Casa: ${ctx.casa}.
Reglas: responde en espanol, breve y accionable (max ~180 palabras); nunca diagnostiques salud;
si propones cambios en la app, anade al final un bloque JSON asi:
` + '```json\n{"actions":[{"type":"create-task","title":"...","area":"rgs","priority":"alta"}]}\n```' + `
Tipos validos: create-task, set-mode (normal|high|min), postpone-task (id), complete-task (id). Maximo 3 acciones.`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    let upstream;
    try {
      upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json', 'HTTP-Referer': 'https://openrutine.local', 'X-Title': 'OpenRutine' },
        body: JSON.stringify({
          model: env.MODEL || DEFAULT_MODEL,
          max_tokens: 700,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: message }],
        }),
      });
    } catch (e) {
      clearTimeout(timer);
      return json({ error: 'Proveedor de IA no disponible. Intenta mas tarde.' }, 502, origin);
    }
    clearTimeout(timer);
    if (!upstream.ok) return json({ error: 'Error del proveedor (' + upstream.status + ')' }, 502, origin);
    const data = await upstream.json();
    return json({ reply: data.choices?.[0]?.message?.content || 'Sin respuesta.' }, 200, origin);
  },
};
