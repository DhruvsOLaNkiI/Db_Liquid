/** Shared fetch defaults — sends httpOnly auth cookie on every API call. */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers ?? {}),
    },
  });
}
