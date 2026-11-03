async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
  return data;
}
export const api = {
  session: () => request('/api/auth/session'),
  signup: (values) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(values) }),
  signin: (values) => request('/api/auth/signin', { method: 'POST', body: JSON.stringify(values) }),
  signout: () => request('/api/auth/signout', { method: 'POST' }),
  posts: async () => (await request('/api/blogs')).posts,
  createPost: (values) => request('/api/blogs', { method: 'POST', body: JSON.stringify(values) }),
  updatePost: (id, values) => request(`/api/blogs/${id}`, { method: 'PUT', body: JSON.stringify(values) }),
  deletePost: (id) => request(`/api/blogs/${id}`, { method: 'DELETE' })
};
