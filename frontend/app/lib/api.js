const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthHeaders() {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.token) {
        return { Authorization: `Bearer ${user.token}` };
      }
    }
  } catch {}
  return {};
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  // Handle CSV responses
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.text();
  }

  return res.json();
}

export const portfolioAPI = {
  getAssets: () => request('/api/portfolio/assets'),

  searchTicker: (query) => request(`/api/portfolio/search-ticker?q=${encodeURIComponent(query)}`),

  validateTickers: (tickers, years, dateRange) =>
    request('/api/portfolio/validate', {
      method: 'POST',
      body: JSON.stringify({ tickers, years, dateRange }),
    }),

  analyzePortfolio: (data) =>
    request('/api/portfolio/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGenerations: () => request('/api/portfolio/generations'),

  getGeneration: (id) => request(`/api/portfolio/generations/${id}`),

  updateGeneration: (id, data) =>
    request(`/api/portfolio/generations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGeneration: (id) =>
    request(`/api/portfolio/generations/${id}`, { method: 'DELETE' }),

  exportCSV: (id) =>
    request(`/api/portfolio/generations/${id}/export-csv`),
};

export const userAPI = {
  login: (email, password) =>
    request('/api/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password) =>
    request('/api/user/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getProfile: () => request('/api/user/profile'),

  subscribe: () =>
    request('/api/user/subscribe', { method: 'POST' }),

  passwordReset: (email, password) =>
    request('/api/user/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
