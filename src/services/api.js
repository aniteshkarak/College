/**
 * Collégé API Service
 * Connects React frontend directly to the Collégé Node.js/Express Backend.
 * Standard Base URL: http://localhost:5000/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Token Management (Student)
export const getStoredToken = () => {
  try {
    return localStorage.getItem('college_access_token');
  } catch (e) {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('college_access_token', token);
    } else {
      localStorage.removeItem('college_access_token');
    }
  } catch (e) {}
};

export const clearStoredToken = () => {
  try {
    localStorage.removeItem('college_access_token');
  } catch (e) {}
};

// Token & Session Management (Administrator)
export const getStoredAdminToken = () => {
  try {
    return localStorage.getItem('college_admin_token');
  } catch (e) {
    return null;
  }
};

export const setStoredAdminToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('college_admin_token', token);
    } else {
      localStorage.removeItem('college_admin_token');
    }
  } catch (e) {}
};

export const clearStoredAdminToken = () => {
  try {
    localStorage.removeItem('college_admin_token');
    localStorage.removeItem('college_admin_user');
  } catch (e) {}
};

export const getStoredAdminUser = () => {
  try {
    const raw = localStorage.getItem('college_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredAdminUser = (admin) => {
  try {
    if (admin) {
      localStorage.setItem('college_admin_user', JSON.stringify(admin));
    } else {
      localStorage.removeItem('college_admin_user');
    }
  } catch (e) {}
};

/**
 * Standard fetch wrapper with automatic token injection and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = options.headers ? { ...options.headers } : {};

  // Inject Authorization Bearer token (separating student vs admin tokens)
  if (!headers['Authorization']) {
    const isAdminEndpoint = endpoint.startsWith('/admin');
    const token = isAdminEndpoint ? getStoredAdminToken() : getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Set Content-Type only if body is NOT FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'omit'
  };

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || `HTTP Error ${response.status}`);
      error.status = response.status;
      error.code = data?.error || 'API_ERROR';
      error.details = data?.details || null;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If backend is not running or unreachable, preserve a distinguishable network error
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr = new Error('Backend server is currently offline or unreachable at ' + API_BASE_URL);
      networkErr.code = 'SERVER_OFFLINE';
      networkErr.status = 503;
      throw networkErr;
    }
    throw err;
  }
}

export const api = {
  // Base URL
  baseUrl: API_BASE_URL,

  // Health check
  health: () => request('/health'),

  // Registration & Manual Verification
  registration: {
    submit: (formDataOrJson) => {
      let body;
      let headers = {};

      if (formDataOrJson instanceof FormData) {
        body = formDataOrJson;
      } else if (typeof formDataOrJson === 'object') {
        body = JSON.stringify(formDataOrJson);
      }

      return request('/registration/submit', {
        method: 'POST',
        headers,
        body
      });
    },

    getStatus: (applicationId) =>
      request(`/registration/status/${encodeURIComponent(applicationId)}`),

    getApplication: (applicationId) =>
      request(`/registration/application/${encodeURIComponent(applicationId)}`),

    update: (applicationId, data) =>
      request(`/registration/update/${encodeURIComponent(applicationId)}`, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data)
      }),

    resubmit: (applicationId, data) =>
      request(`/registration/resubmit/${encodeURIComponent(applicationId)}`, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data)
      })
  },

  // Authentication
  auth: {
    login: (identifier, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      }),

    logout: () => {
      clearStoredToken();
      return request('/auth/logout', { method: 'POST' }).catch(() => ({ success: true }));
    },

    getMe: () => request('/auth/me'),

    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    resetPassword: ({ token, newPassword }) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      })
  },

  // Admin Verification & Audit Operations
  admin: {
    login: async (email, password) => {
      const res = await request('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res?.success && res?.data?.token) {
        setStoredAdminToken(res.data.token);
        if (res.data.admin) setStoredAdminUser(res.data.admin);
      }
      return res;
    },

    logout: () => {
      clearStoredAdminToken();
      return Promise.resolve({ success: true });
    },

    getMe: () => {
      return getStoredAdminUser();
    },

    getMetrics: () => request('/admin/metrics'),

    listApplications: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', params.status);
      if (params.college) searchParams.set('college', params.college);
      if (params.search) searchParams.set('search', params.search);
      if (params.overdue) searchParams.set('overdue', params.overdue);
      if (params.page) searchParams.set('page', params.page);
      if (params.limit) searchParams.set('limit', params.limit);
      const query = searchParams.toString();
      return request(`/admin/applications${query ? `?${query}` : ''}`);
    },

    getApplication: (id) => request(`/admin/applications/${encodeURIComponent(id)}`),

    assign: (id) =>
      request(`/admin/applications/${encodeURIComponent(id)}/assign`, {
        method: 'POST',
      }),

    claim: (id) =>
      request(`/admin/applications/${encodeURIComponent(id)}/start-review`, {
        method: 'POST',
      }),

    startReview: (id) =>
      request(`/admin/applications/${encodeURIComponent(id)}/start-review`, {
        method: 'POST',
      }),

    approve: (id) =>
      request(`/admin/applications/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
      }),

    reject: (id, reason) =>
      request(`/admin/applications/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    requestCorrection: (id, fields, message) =>
      request(`/admin/applications/${encodeURIComponent(id)}/request-correction`, {
        method: 'POST',
        body: JSON.stringify({ fields, message }),
      }),

    getHistory: (id) =>
      request(`/admin/applications/${encodeURIComponent(id)}/history`),

    getDocumentUrl: (applicationId, documentId) =>
      `${API_BASE_URL}/admin/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`,

    getPhotoUrl: (applicationId, photoId) =>
      `${API_BASE_URL}/admin/applications/${encodeURIComponent(applicationId)}/photos/${encodeURIComponent(photoId)}`,

    fetchPrivateAssetBlob: async (url) => {
      const token = getStoredAdminToken();
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to load asset (${res.status})`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
  }
};

export default api;
