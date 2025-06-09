const API_BASE = 'http://localhost:5000/api';



const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }
  return response.json();
};

export const api = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  postDoubt: async (doubtData) => {
    const response = await fetch(`${API_BASE}/doubts`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(doubtData)
    });
    return handleResponse(response);
  },

  getDoubts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/doubts?${query}`, {
      headers: auth.getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMyDoubts: async (userId) => {
    const response = await fetch(`${API_BASE}/my-doubts`, {
      headers: auth.getAuthHeaders()
    });
    return handleResponse(response);
  },

  postResponse: async (responseData) => {
    const response = await fetch(`${API_BASE}/responses`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(responseData)
    });
    return handleResponse(response);
  },

  getResponses: async (doubtId) => {
    const response = await fetch(`${API_BASE}/doubts/${doubtId}/responses`, {
      headers: auth.getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Updated notification methods
  async getNotifications(userId) {
    const response = await fetch(`${API_BASE}/notifications?user_id=${encodeURIComponent(userId)}`, {
      headers: auth.getAuthHeaders()
    });
    return handleResponse(response);
  },

  async markNotificationRead(notifId) {
    await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'POST',
      headers: auth.getAuthHeaders()
    });
  },

  async markAllNotificationsRead(userId) {
    await fetch(`${API_BASE}/notifications/mark-all-read?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: auth.getAuthHeaders()
    });
  },

  // New methods for Forgot Password feature
  postForgotPassword: async (data) => {
    const response = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  postResetPassword: async (data) => {
    const response = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};