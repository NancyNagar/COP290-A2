const BASE_URL = '/api';
 
async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}
 
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  };
 
  let res = await fetch(url, config);
 
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await fetch(url, config);
    } else {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
 
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
 
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
 