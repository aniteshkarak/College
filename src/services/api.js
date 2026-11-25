/**
 * Collage Story API Service
 * Connects React frontend directly to the Collage Story Node.js/Express Backend.
 * Standard Base URL: http://localhost:5000/api/v1
 */

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When running in a browser:
  if (typeof window !== 'undefined' && window.location) {
    // If running on Vite dev/preview server, route through Vite proxy /api/v1
    // This completely eliminates cross-origin port issues, localhost vs 127.0.0.1 mismatch,
    // and works out of the box when accessed from mobile devices on local Wi-Fi!
    const { port, hostname, protocol } = window.location;
    if (port === '3000' || port === '5173' || port === '4173') {
      return '/api/v1';
    }
    if (port === '5000') {
      return '/api/v1';
    }
    if (hostname) {
      return `${protocol}//${hostname}:5000/api/v1`;
    }
  }
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Resolves a photo identifier or relative filename to a full reachable URL.
 * If already a data: or http(s) URL, returns as-is.
 * If a relative filename like 'photo_order1_...webp', routes to '/api/v1/photos/filename'.
 */
export const resolvePhotoUrl = (photoPath) => {
  const fallback = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
  if (!photoPath || typeof photoPath !== 'string') return fallback;
  if (photoPath.startsWith('data:') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  // Strip leading slash
  const clean = photoPath.replace(/^\/+/, '');
  if (clean.startsWith('api/v1/photos/')) {
    return `/${clean}`;
  }
  if (clean.startsWith('photos/')) {
    return `/api/v1/${clean}`;
  }
  return `/api/v1/photos/${clean}`;
};

// Token Management (Student) - Persistent Browser Storage for Login Persistence Across Refreshes
let inMemoryAccessToken = null;

export const getStoredToken = () => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  try {
    const token = localStorage.getItem('college_access_token');
    if (token) {
      inMemoryAccessToken = token;
      return token;
    }
  } catch (e) {}
  return null;
};

export const setStoredToken = (token) => {
  inMemoryAccessToken = token || null;
  try {
    if (token) {
      localStorage.setItem('college_access_token', token);
      localStorage.setItem('college_has_session', 'true');
    } else {
      localStorage.removeItem('college_access_token');
      localStorage.removeItem('college_has_session');
    }
  } catch (e) {}
};

export const clearStoredToken = () => {
  inMemoryAccessToken = null;
  try {
    localStorage.removeItem('college_access_token');
    localStorage.removeItem('college_has_session');
  } catch (e) {}
};

export const hasActiveSessionIndicator = () => {
  try {
    return localStorage.getItem('college_has_session') === 'true' || !!localStorage.getItem('college_access_token');
  } catch (e) {
    return false;
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('college_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('college_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('college_user');
    }
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

  // Inject active session identifier if present
  try {
    const activeSessionId = localStorage.getItem('college_session_id');
    if (activeSessionId && !headers['x-session-id']) {
      headers['x-session-id'] = activeSessionId;
    }
  } catch (_) {}

  // Set Content-Type only if body is NOT FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Apply a 15-second request timeout if signal not provided
  let timeoutId = null;
  let signal = options.signal;
  if (!signal && typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 15000);
    signal = controller.signal;
  }

  const fetchOptions = {
    ...options,
    headers,
    signal,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, fetchOptions);
    if (timeoutId) clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let defaultMsg = `HTTP Error ${response.status}`;
      if (response.status === 500) {
        defaultMsg = 'Internal Server Error (500): The server encountered an issue processing your request. Please try again.';
      } else if (response.status === 502 || response.status === 504) {
        defaultMsg = 'Gateway / Proxy Error: Unable to reach backend service. Please ensure the backend is running.';
      }
      const error = new Error(data?.message || data?.error || defaultMsg);
      error.status = response.status;
      error.code = data?.error || data?.code || 'API_ERROR';
      error.details = data?.details || null;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);

    // Timeout handling
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      const timeoutErr = new Error('Request timed out. Please check your network connection.');
      timeoutErr.code = 'REQUEST_TIMEOUT';
      timeoutErr.status = 504;
      throw timeoutErr;
    }

    // Network / offline handling
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr = new Error('Connection could not be established. Please check if the server is running.');
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

  // Health and Diagnostic checks
  health: () => request('/health'),
  liveness: () => request('/health/live'),
  readiness: () => request('/health/ready'),
  dbHealth: () => request('/health/db'),
  redisHealth: () => request('/health/redis'),

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
      }),

    getColleges: (query = '') => {
      const q = query ? `?q=${encodeURIComponent(query)}` : '';
      return request(`/registration/colleges${q}`);
    },

    requestCollege: (collegeData) =>
      request('/registration/colleges/request', {
        method: 'POST',
        body: JSON.stringify(collegeData)
      })
  },

  // Authentication
  auth: {
    login: async (identifier, password) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
      if (res?.success && res?.data) {
        const token = res.data.token || res.data.accessToken;
        if (token) setStoredToken(token);
        if (res.data.user) setStoredUser(res.data.user);
        if (res.data.sessionId) {
          try {
            localStorage.setItem('college_session_id', res.data.sessionId);
          } catch (_) {}
        }
      }
      return res;
    },

    logout: () => {
      clearStoredToken();
      setStoredUser(null);
      try {
        localStorage.removeItem('college_session_id');
      } catch (_) {}
      return request('/auth/logout', { method: 'POST' }).catch(() => ({ success: true }));
    },

    getMe: async () => {
      const res = await request('/auth/me');
      if (res?.success && res?.data?.user) {
        setStoredUser(res.data.user);
      }
      return res;
    },

    refresh: async () => {
      const res = await request('/auth/refresh', {
        method: 'POST',
      });
      if (res?.success && res?.data) {
        const token = res.data.token || res.data.accessToken;
        if (token) setStoredToken(token);
      }
      return res;
    },

    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    resetPassword: ({ token, newPassword }) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      }),

    changePassword: (currentPassword, newPassword) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      }),

    getSessions: () => request('/auth/sessions'),

    revokeSession: (sessionId) =>
      request(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      }),

    revokeOtherSessions: () =>
      request('/auth/sessions/others', {
        method: 'DELETE',
      }),

    refreshToken: (refreshToken) =>
      request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
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

    getReports: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.status) sp.set('status', params.status);
      const q = sp.toString();
      return request(`/admin/reports${q ? `?${q}` : ''}`);
    },

    resolveReport: (id, resolutionNotes) =>
      request(`/admin/reports/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes }),
      }),

    dismissReport: (id, dismissReason) =>
      request(`/admin/reports/${encodeURIComponent(id)}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ dismissReason }),
      }),

    suspendUser: (id, reason) =>
      request(`/admin/users/${encodeURIComponent(id)}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    activateUser: (id, reason) =>
      request(`/admin/users/${encodeURIComponent(id)}/activate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    getUsers: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.search) sp.set('search', params.search);
      if (params.status) sp.set('status', params.status);
      if (params.page) sp.set('page', params.page);
      if (params.limit) sp.set('limit', params.limit);
      const q = sp.toString();
      return request(`/admin/users${q ? `?${q}` : ''}`);
    },

    getAuditLogs: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.limit) sp.set('limit', params.limit);
      const q = sp.toString();
      return request(`/admin/audit-logs${q ? `?${q}` : ''}`);
    },

    moderateAnnouncement: (id, action = 'DELETE', reason = '') =>
      request(`/admin/announcements/${encodeURIComponent(id)}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      }),

    // Product Analytics & Metrics
    getAnalyticsOverview: () => request('/admin/analytics/overview'),
    getAnalyticsTrends: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.range) sp.set('range', params.range);
      if (params.startDate) sp.set('startDate', params.startDate);
      if (params.endDate) sp.set('endDate', params.endDate);
      const q = sp.toString();
      return request(`/admin/analytics/trends${q ? `?${q}` : ''}`);
    },

    // System Monitoring & SRE Health
    getSystemHealth: () => request('/admin/monitoring/health'),
    getAlerts: () => request('/admin/monitoring/alerts'),
    getErrorLogs: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.limit) sp.set('limit', params.limit);
      if (params.severity) sp.set('severity', params.severity);
      if (params.category) sp.set('category', params.category);
      const q = sp.toString();
      return request(`/admin/monitoring/errors${q ? `?${q}` : ''}`);
    },

    // Incident Management
    getIncidents: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.status) sp.set('status', params.status);
      if (params.severity) sp.set('severity', params.severity);
      const q = sp.toString();
      return request(`/admin/incidents${q ? `?${q}` : ''}`);
    },
    getIncidentDetails: (id) => request(`/admin/incidents/${encodeURIComponent(id)}`),
    updateIncidentStatus: (id, status, notes = '') =>
      request(`/admin/incidents/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    resolveIncident: (id, resolutionNotes) =>
      request(`/admin/incidents/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes }),
      }),
  },

  // Discovery
  discovery: {
    getProfiles: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.minAge) searchParams.set('minAge', params.minAge);
      if (params.maxAge) searchParams.set('maxAge', params.maxAge);
      if (params.gender && params.gender !== 'All') searchParams.set('gender', params.gender);
      if (params.preferredGender && params.preferredGender !== 'All') searchParams.set('preferredGender', params.preferredGender);
      if (params.city && params.city !== 'All') searchParams.set('city', params.city);
      if (params.page) searchParams.set('page', params.page);
      if (params.limit) searchParams.set('limit', params.limit);
      if (params.sameCollegeOnly !== undefined) searchParams.set('sameCollegeOnly', params.sameCollegeOnly);
      if (params.intention && params.intention !== 'All') searchParams.set('intention', params.intention);
      const q = searchParams.toString();
      return request(`/discovery${q ? `?${q}` : ''}`);
    },
    getPreferences: () => request('/discovery/preferences'),
    updatePreferences: (preferences) =>
      request('/discovery/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }),
    pass: (targetUserId) =>
      request('/discovery/pass', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      }),
    resetCycle: () =>
      request('/discovery/cycle/reset', {
        method: 'POST',
      }),
  },

  // Matching & Likes
  matching: {
    getIncoming: () => request('/matching/incoming'),
    getSent: () => request('/matching/sent'),
    getMatches: () => request('/matching/matches'),
    sendRequest: (receiverId) =>
      request('/matching/send-request', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
      }),
    acceptRequest: (requestId) =>
      request(`/matching/requests/${encodeURIComponent(requestId)}/accept`, {
        method: 'POST',
      }),
    rejectRequest: (requestId) =>
      request(`/matching/requests/${encodeURIComponent(requestId)}/reject`, {
        method: 'POST',
      }),
    cancelRequest: (requestId) =>
      request(`/matching/requests/${encodeURIComponent(requestId)}/cancel`, {
        method: 'POST',
      }),
    unmatch: (matchId) =>
      request(`/matching/matches/${encodeURIComponent(matchId)}/unmatch`, {
        method: 'POST',
      }),
    blockUser: (blockedId, reason) =>
      request('/matching/block', {
        method: 'POST',
        body: JSON.stringify({ blockedId, reason }),
      }),
    unblock: (unblockId) =>
      request('/matching/unblock', {
        method: 'POST',
        body: JSON.stringify({ unblockId }),
      }),
    getBlocked: () => request('/matching/blocked'),
    sendGoRequest: (matchId, targetStage) =>
      request(`/matching/${encodeURIComponent(matchId)}/go`, {
        method: 'POST',
        body: JSON.stringify({ targetStage }),
      }),
    acceptGoRequest: (matchId) =>
      request(`/matching/${encodeURIComponent(matchId)}/go/accept`, {
        method: 'POST',
      }),
    refuseGoRequest: (matchId, explanation) =>
      request(`/matching/${encodeURIComponent(matchId)}/go/refuse`, {
        method: 'POST',
        body: JSON.stringify({ explanation }),
      }),
  },

  // Real-time Chat & Voice Messaging
  chat: {
    getConversations: () => request('/chat/conversations'),
    getMessages: (conversationId, params = {}) => {
      const sp = new URLSearchParams();
      if (params.limit) sp.set('limit', params.limit);
      if (params.before) sp.set('before', params.before);
      if (params.after) sp.set('after', params.after);
      if (params.since) sp.set('since', params.since);
      const q = sp.toString();
      return request(`/chat/conversations/${encodeURIComponent(conversationId)}/messages${q ? `?${q}` : ''}`);
    },
    sync: (since) => {
      const q = since ? `?since=${encodeURIComponent(since)}` : '';
      return request(`/chat/sync${q}`);
    },
    sendMessage: (conversationId, content, messageType = 'TEXT', idempotencyKey = null) =>
      request(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, messageType, idempotencyKey }),
      }),
    sendVoiceMessage: (conversationId, audioBlob, duration = 0, idempotencyKey = null) => {
      const formData = new FormData();
      const ext = audioBlob?.type?.includes('mp4') ? 'voice.mp4' : (audioBlob?.type?.includes('ogg') ? 'voice.ogg' : 'voice.webm');
      formData.append('audio', audioBlob, ext);
      formData.append('duration', duration);
      if (idempotencyKey) formData.append('idempotencyKey', idempotencyKey);
      return request(`/chat/conversations/${encodeURIComponent(conversationId)}/voice`, {
        method: 'POST',
        body: formData,
      });
    },
    getAudioUrl: (conversationId, messageId) =>
      `${API_BASE_URL}/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/audio`,
    fetchAudioBlob: async (url) => {
      const token = getStoredToken();
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to load voice audio (${res.status})`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    markRead: (conversationId) =>
      request(`/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: 'POST',
      }),
  },

  // Notifications
  notifications: {
    getAll: (params) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request(`/notifications${q}`);
    },
    getUnreadCount: () => request('/notifications/unread-count'),
    markRead: (id) =>
      request(`/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
      }),
    markAllRead: () =>
      request('/notifications/read-all', {
        method: 'PATCH',
      }),
    delete: (id) =>
      request(`/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // Safety & Moderation Reports
  reports: {
    submit: ({ reportedUserId, category, reason }) =>
      request('/reports', {
        method: 'POST',
        body: JSON.stringify({ reportedUserId, category, reason }),
      }),
  },

  // Campus Board (College-Exclusive Community Platform)
  campus: {
    getBoard: () => request('/campus/board'),
    getAnnouncements: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', params.page);
      if (params.limit) sp.set('limit', params.limit);
      if (params.category && params.category !== 'All') sp.set('category', params.category);
      if (params.postType && params.postType !== 'ALL') sp.set('postType', params.postType);
      if (params.search) sp.set('search', params.search);
      const q = sp.toString();
      return request(`/campus/announcements${q ? `?${q}` : ''}`);
    },
    getPost: (id) => request(`/campus/posts/${encodeURIComponent(id)}`),
    createAnnouncement: (formDataOrJson) => {
      let body;
      let headers = {};
      if (formDataOrJson instanceof FormData) {
        body = formDataOrJson;
      } else {
        body = JSON.stringify(formDataOrJson);
      }
      return request('/campus/announcements', {
        method: 'POST',
        headers,
        body,
      });
    },
    updateAnnouncement: (id, data) =>
      request(`/campus/announcements/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteAnnouncement: (id) =>
      request(`/campus/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    getUsage: () => request('/campus/usage'),
    upvote: (id) =>
      request(`/campus/announcements/${encodeURIComponent(id)}/like`, {
        method: 'POST',
      }),
    likePost: (id) =>
      request(`/campus/posts/${encodeURIComponent(id)}/like`, {
        method: 'POST',
      }),
    getComments: (id, params = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', params.page);
      if (params.limit) sp.set('limit', params.limit);
      const q = sp.toString();
      return request(`/campus/posts/${encodeURIComponent(id)}/comments${q ? `?${q}` : ''}`);
    },
    createComment: (id, content) =>
      request(`/campus/posts/${encodeURIComponent(id)}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    updateComment: (commentId, content) =>
      request(`/campus/comments/${encodeURIComponent(commentId)}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    deleteComment: (commentId) =>
      request(`/campus/comments/${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
      }),
    toggleSavePost: (id) =>
      request(`/campus/posts/${encodeURIComponent(id)}/save`, {
        method: 'POST',
      }),
    getSavedPosts: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', params.page);
      const q = sp.toString();
      return request(`/campus/saved-posts${q ? `?${q}` : ''}`);
    },
    getEvents: (params = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', params.page);
      if (params.limit) sp.set('limit', params.limit);
      if (params.category && params.category !== 'All') sp.set('category', params.category);
      if (params.search) sp.set('search', params.search);
      const q = sp.toString();
      return request(`/campus/events${q ? `?${q}` : ''}`);
    },
    createEvent: (formDataOrJson) => {
      let body;
      let headers = {};
      if (formDataOrJson instanceof FormData) {
        body = formDataOrJson;
      } else {
        body = JSON.stringify(formDataOrJson);
      }
      return request('/campus/events', {
        method: 'POST',
        headers,
        body,
      });
    },
    deleteEvent: (id) =>
      request(`/campus/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    reportPost: (id, data) =>
      request(`/campus/posts/${encodeURIComponent(id)}/report`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reportComment: (id, data) =>
      request(`/campus/comments/${encodeURIComponent(id)}/report`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Profile Management
  profile: {
    getMe: () => request('/profiles/me'),
    update: (data) =>
      request('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    uploadPhoto: (photoPayload) => {
      // Supports base64 data URL object: { photo, photoOrder, isMain, replacePhotoId }
      return request('/profiles/photos', {
        method: 'POST',
        body: JSON.stringify(photoPayload),
      });
    },
    deletePhoto: (photoId) =>
      request(`/profiles/photos/${encodeURIComponent(photoId)}`, {
        method: 'DELETE',
      }),
    setMainPhoto: (photoId) =>
      request(`/profiles/photos/${encodeURIComponent(photoId)}/main`, {
        method: 'PATCH',
      }),
    updateMood: (mood) =>
      request('/users/profile/mood', {
        method: 'PATCH',
        body: JSON.stringify({ mood }),
      }),
    getUser: (id) => request(`/users/${encodeURIComponent(id)}`),
  },

  // User Endpoints
  users: {
    updateMood: (mood) =>
      request('/users/profile/mood', {
        method: 'PATCH',
        body: JSON.stringify({ mood }),
      }),
    getUser: (id) => request(`/users/${encodeURIComponent(id)}`),
  },
};

export default api;
