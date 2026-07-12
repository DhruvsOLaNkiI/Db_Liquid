/** Shared cookie + CSRF helpers for SEC test scripts. */

export function createApiClient(apiBase) {
  let cookieJar = '';

  function storeCookies(res) {
    const setCookies =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : [res.headers.get('set-cookie')].filter(Boolean);

    for (const raw of setCookies) {
      if (typeof raw !== 'string') continue;
      const pair = raw.split(';')[0];
      const name = pair.split('=')[0];
      const parts = cookieJar
        .split('; ')
        .filter(Boolean)
        .filter((entry) => !entry.startsWith(`${name}=`));
      parts.push(pair);
      cookieJar = parts.join('; ');
    }
  }

  function getCookie(name) {
    const match = cookieJar.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  }

  async function ensureCsrf() {
    if (getCookie('db_liquid_csrf')) return getCookie('db_liquid_csrf');
    const res = await fetch(`${apiBase}/api/auth/csrf`, {
      headers: cookieJar ? { Cookie: cookieJar } : {},
    });
    storeCookies(res);
    const data = await res.json().catch(() => ({}));
    return getCookie('db_liquid_csrf') || data.csrfToken || '';
  }

  async function api(path, init = {}) {
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = { ...(init.headers ?? {}) };
    if (cookieJar) headers.Cookie = cookieJar;

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const token = await ensureCsrf();
      if (token) headers['X-CSRF-Token'] = token;
      if (cookieJar) headers.Cookie = cookieJar;
    }

    const res = await fetch(`${apiBase}${path}`, { ...init, headers });
    storeCookies(res);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  function clearSession() {
    cookieJar = cookieJar
      .split('; ')
      .filter(Boolean)
      .filter((entry) => !entry.startsWith('db_liquid_session='))
      .join('; ');
  }

  function clearAll() {
    cookieJar = '';
  }

  return { api, ensureCsrf, getCookie, clearSession, clearAll, storeCookies };
}
