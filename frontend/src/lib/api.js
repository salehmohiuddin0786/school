const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HTTP-only cookies
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiClient(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiClient(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
