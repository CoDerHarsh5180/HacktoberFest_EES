async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
    if (res.status === 429) {
    // Too many login attempts: the server's Retry-After header says how many seconds to wait.
    const minutes = Math.max(1, Math.ceil((Number(res.headers.get('Retry-After')) || 60) / 60));
    throw new Error(`Too many attempts, try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  problems: () => request('/api/problems'),
  problem: (slug) => request(`/api/problems/${slug}`),
  submissions: (slug, username) =>
    request(`/api/submissions?slug=${encodeURIComponent(slug)}&username=${encodeURIComponent(username)}`),
  submit: (body) => request('/api/submissions', { method: 'POST', body: JSON.stringify(body) }),
  leaderboard: () => request('/api/leaderboard'),
  me: () => request('/api/auth/me'),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};
