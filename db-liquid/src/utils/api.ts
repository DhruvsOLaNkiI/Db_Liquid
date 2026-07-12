/** Shared fetch defaults — sends httpOnly auth cookie + CSRF header on mutations. */

const CSRF_COOKIE = 'db_liquid_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let csrfBootstrap: Promise<void> | null = null;

function readCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

async function ensureCsrfToken(): Promise<string> {
  const existing = readCsrfToken();
  if (existing) return existing;

  if (!csrfBootstrap) {
    csrfBootstrap = fetch('/api/auth/csrf', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch CSRF token');
      })
      .finally(() => {
        csrfBootstrap = null;
      });
  }

  await csrfBootstrap;
  return readCsrfToken();
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers ?? {});

  if (!SAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}
