import { create } from 'zustand';

export const getAuthToken = () => {
  return localStorage.getItem('chat_token') || localStorage.getItem('pulsechat_token') || '';
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const useAuthStore = create((set, get) => ({
  authUser: JSON.parse(localStorage.getItem('chat_user') || localStorage.getItem('pulsechat_user') || 'null'),
  token: localStorage.getItem('chat_token') || localStorage.getItem('pulsechat_token') || '',
  isCheckingAuth: false,
  isLoggingIn: false,
  isSigningUp: false,
  theme: localStorage.getItem('chat_theme') || localStorage.getItem('pulsechat_theme') || 'dark',

  setTheme: (theme) => {
    localStorage.setItem('chat_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ authUser: null });
      return;
    }

    try {
      set({ isCheckingAuth: true });
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (data) {
          set({ authUser: data });
          localStorage.setItem('chat_user', JSON.stringify(data));
        }
      } else {
        get().logout();
      }
    } catch (error) {
      console.warn('Check auth error:', error.message);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (username, password) => {
    set({ isLoggingIn: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error('Unable to connect to server. Please ensure the backend is running on port 5000.');
      }

      if (!res.ok) {
        throw new Error(data.error || `Login failed (${res.status})`);
      }

      set({ authUser: data.user, token: data.token });
      localStorage.setItem('chat_user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('chat_token', data.token);

      return { success: true };
    } catch (error) {
      const msg = error.message.includes('Failed to fetch') || error.message.includes('NetworkError')
        ? 'Cannot connect to backend server. Please make sure backend is running on port 5000.'
        : error.message;
      return { success: false, error: msg };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (userData) => {
    set({ isSigningUp: true });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error('Unable to connect to server. Please ensure the backend is running on port 5000.');
      }

      if (!res.ok) {
        throw new Error(data.error || `Signup failed (${res.status})`);
      }

      set({ authUser: data.user, token: data.token });
      localStorage.setItem('chat_user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('chat_token', data.token);

      return { success: true };
    } catch (error) {
      const msg = error.message.includes('Failed to fetch') || error.message.includes('NetworkError')
        ? 'Cannot connect to backend server. Please make sure backend is running on port 5000.'
        : error.message;
      return { success: false, error: msg };
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('chat_user');
    localStorage.removeItem('chat_token');
    localStorage.removeItem('pulsechat_user');
    localStorage.removeItem('pulsechat_token');
    set({ authUser: null, token: '' });
  },
}));
