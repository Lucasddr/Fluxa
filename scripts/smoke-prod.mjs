#!/usr/bin/env node
/**
 * Smoke test de produção do Opsire.
 *
 * Uso:
 *   node scripts/smoke-prod.mjs
 *   node scripts/smoke-prod.mjs --api https://api.opsire.com.br --front https://www.opsire.com.br
 *
 * Smoke autenticado opcional (nunca imprimido, nunca gravado):
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... node scripts/smoke-prod.mjs
 *
 * Regras de segurança deste script:
 * - nunca imprime corpo de resposta com token, cookie, e-mail ou dado financeiro;
 * - imprime apenas status, booleanos e cabeçalhos de segurança (nomes e presença);
 * - falha (exit 1) em qualquer resposta 5xx, porque 5xx em rota pública é sempre bug.
 */

const args = process.argv.slice(2);

function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1].replace(/\/$/, '') : fallback;
}

const API = arg('api', process.env.API_URL ?? 'https://api.opsire.com.br');
const FRONT = arg('front', process.env.FRONT_URL ?? 'https://www.opsire.com.br');
const APEX = arg('apex', 'https://opsire.com.br');
const ALLOWED_ORIGIN = arg('origin', 'https://opsire.com.br');
const TIMEOUT_MS = 20000;

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const label = ok ? 'PASS' : 'FAIL';
  process.stdout.write(`${label}  ${name}${detail ? `  (${detail})` : ''}\n`);
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, redirect: 'manual', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function check(name, fn) {
  try {
    const { ok, detail } = await fn();
    record(name, ok, detail);
  } catch (error) {
    record(name, false, error.name === 'AbortError' ? 'timeout' : error.message);
  }
}

const is5xx = (status) => status >= 500;

await check('frontend raiz responde 2xx/3xx', async () => {
  const response = await request(`${FRONT}/`);
  return { ok: response.status === 200 || response.status === 308, detail: `HTTP ${response.status}` };
});

await check('frontend /login responde 200', async () => {
  const response = await request(`${FRONT}/login`);
  return { ok: response.status === 200, detail: `HTTP ${response.status}` };
});

await check('apex redireciona ou responde sem erro', async () => {
  const response = await request(`${APEX}/`);
  return { ok: !is5xx(response.status), detail: `HTTP ${response.status}` };
});

await check('headers de segurança no frontend', async () => {
  const response = await request(`${FRONT}/login`);
  const required = ['x-content-type-options', 'x-frame-options', 'referrer-policy'];
  const missing = required.filter((header) => !response.headers.get(header));
  return {
    ok: missing.length === 0,
    detail: missing.length ? `faltando: ${missing.join(', ')}` : required.length + ' headers',
  };
});

await check('API responde sem 5xx', async () => {
  const response = await request(`${API}/`);
  return { ok: !is5xx(response.status), detail: `HTTP ${response.status}` };
});

await check('preflight CORS da origem oficial', async () => {
  const response = await request(`${API}/api/auth/refresh`, {
    method: 'OPTIONS',
    headers: {
      Origin: ALLOWED_ORIGIN,
      'Access-Control-Request-Method': 'POST',
    },
  });
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const credentials = response.headers.get('access-control-allow-credentials');
  return {
    ok: response.status === 200 && allowOrigin === ALLOWED_ORIGIN && credentials === 'true',
    detail: `HTTP ${response.status}, origin=${allowOrigin === ALLOWED_ORIGIN}, credentials=${credentials === 'true'}`,
  };
});

await check('origem não autorizada é barrada', async () => {
  const response = await request(`${API}/api/auth/refresh`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://example.com',
      'Access-Control-Request-Method': 'POST',
    },
  });
  const allowOrigin = response.headers.get('access-control-allow-origin');
  return {
    ok: allowOrigin !== 'https://example.com',
    detail: `HTTP ${response.status}, allow-origin=${allowOrigin ?? 'ausente'}`,
  };
});

await check('rota protegida exige autenticação', async () => {
  const response = await request(`${API}/api/transactions`);
  return { ok: response.status === 401, detail: `HTTP ${response.status}` };
});

await check('login com credencial inválida não vira 5xx', async () => {
  const response = await request(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke-check@example.invalid', password: 'senha-invalida-123' }),
  });
  return {
    ok: !is5xx(response.status),
    detail: `HTTP ${response.status}${is5xx(response.status) ? ' (handler genérico mascarando erro)' : ''}`,
  };
});

await check('JSON malformado não vira 5xx', async () => {
  const response = await request(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-json',
  });
  return {
    ok: !is5xx(response.status),
    detail: `HTTP ${response.status}${is5xx(response.status) ? ' (mapeamento 4xx de input ausente)' : ''}`,
  };
});

await check('refresh sem cookie é 401 (não 5xx)', async () => {
  const response = await request(`${API}/api/auth/refresh`, { method: 'POST' });
  return { ok: response.status === 401, detail: `HTTP ${response.status}` };
});

if (process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD) {
  await check('fluxo autenticado completo (login, dashboard, bancos, logout)', async () => {
    const login = await request(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SMOKE_EMAIL,
        password: process.env.SMOKE_PASSWORD,
      }),
    });

    if (login.status !== 200) {
      return { ok: false, detail: `login HTTP ${login.status}` };
    }

    const cookies = (login.headers.getSetCookie?.() ?? [])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
    const secure = (login.headers.getSetCookie?.() ?? []).every((cookie) =>
      /httponly/i.test(cookie),
    );

    const authed = (url) =>
      request(url, { headers: { Cookie: cookies } });

    const dashboard = await authed(`${API}/api/dashboard/buildDashboard`);
    const bankAccounts = await authed(`${API}/api/bank-accounts`);
    const logout = await request(`${API}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookies },
    });

    return {
      ok: dashboard.status === 200 && bankAccounts.status === 200 && logout.status === 200 && secure,
      detail: `dashboard=${dashboard.status}, bancos=${bankAccounts.status}, logout=${logout.status}, cookies-httponly=${secure}`,
    };
  });
} else {
  process.stdout.write('SKIP  smoke autenticado (defina SMOKE_EMAIL e SMOKE_PASSWORD)\n');
}

const failed = results.filter((result) => !result.ok);
process.stdout.write(`\n${results.length - failed.length}/${results.length} verificações passaram\n`);
if (failed.length > 0) {
  process.stdout.write(`Falhas: ${failed.map((result) => result.name).join('; ')}\n`);
  process.exit(1);
}
