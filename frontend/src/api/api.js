import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
};

// ── Complaints ────────────────────────────────────────────────────────────────
export const complaintAPI = {
  getAll:       (params) => api.get('/complaints', { params }),
  getById:      (id) => api.get(`/complaints/${id}`),
  create:       (data) => api.post('/complaints', data),
  update:       (id, data) => api.put(`/complaints/${id}`, data),
  delete:       (id) => api.delete(`/complaints/${id}`),
  assign:       (id, agentId) => api.put(`/complaints/${id}/assign`, null, { params: { agentId } }),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  rate:         (id, data) => api.post(`/complaints/${id}/rate`, data),
  uploadFile:   (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/complaints/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getComments:  (id) => api.get(`/complaints/${id}/comments`),
  addComment:   (id, data) => api.post(`/complaints/${id}/comments`, data),
  editComment:  (id, data) => api.put(`/complaints/comments/${id}`, data),
  deleteComment:(id) => api.delete(`/complaints/comments/${id}`),
  getAuditLogs: (id) => api.get(`/complaints/${id}/audit`),
  getAttachments: (id) => api.get(`/complaints/${id}/attachments`),
  downloadAttachment: (id) => api.get(`/complaints/attachments/${id}/download`, { responseType: 'blob' }),
};

// ── Escalations ───────────────────────────────────────────────────────────────
export const escalationAPI = {
  getAll:         () => api.get('/escalations'),
  getForComplaint:(id) => api.get(`/escalations/complaint/${id}`),
  manualEscalate: (id, reason) => api.post(`/escalations/${id}/manual`, null, { params: { reason } }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getMe:    () => api.get('/users/me'),
  getAgents:(department) => api.get('/users/agents', { params: department ? { department } : {} }),
  getAll:   () => api.get('/users'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
