import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://backend-api.plannify.org',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach auth token and user ID
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  }
  return config;
});

// Response interceptor: standardize error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — Clerk will handle re-auth
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
      }
    }
    return Promise.reject(error);
  },
);

// Helper to set auth credentials (called after Clerk auth)
export function setAuthCredentials(token: string, userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', userId);
  }
}

export function clearAuthCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  }
}
