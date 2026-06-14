const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const apiClient = {
  getHeaders: () => {
    const token = localStorage.getItem('netguard_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  // Auth
  login: (email, password) => fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse),
  
  logout: () => fetch(`${BASE_URL}/auth/logout`, { method: 'POST' }).then(handleResponse),
  
  getCurrentUser: (token) => fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(handleResponse),

  // Users
  getUsers: () => fetch(`${BASE_URL}/users`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  createUser: (data) => fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: apiClient.getHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateUser: (id, data) => fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: apiClient.getHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteUser: (id) => fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  updateUserRole: (id, role, roleApproved) => fetch(`${BASE_URL}/users/${id}/role`, {
    method: 'PUT',
    headers: apiClient.getHeaders(),
    body: JSON.stringify({ role, roleApproved })
  }).then(handleResponse),

  // Devices
  getDevices: () => fetch(`${BASE_URL}/devices`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  createDevice: (data) => fetch(`${BASE_URL}/devices`, {
    method: 'POST',
    headers: apiClient.getHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Traffic
  getTraffic: () => fetch(`${BASE_URL}/traffic`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  createTraffic: (data) => fetch(`${BASE_URL}/traffic`, {
    method: 'POST',
    headers: apiClient.getHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Packets
  getPackets: () => fetch(`${BASE_URL}/packets`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  createPacket: (data) => fetch(`${BASE_URL}/packets`, {
    method: 'POST',
    headers: apiClient.getHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Alerts
  getAlerts: () => fetch(`${BASE_URL}/alerts`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  createAlert: (data) => fetch(`${BASE_URL}/alerts`, {
    method: 'POST',
    headers: apiClient.getHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateAlertStatus: (id, status) => fetch(`${BASE_URL}/alerts/${id}`, {
    method: 'PATCH',
    headers: apiClient.getHeaders(),
    body: JSON.stringify({ status })
  }).then(handleResponse),

  // Stats
  getStats: () => fetch(`${BASE_URL}/stats`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  // Print
  getPrinters: () => fetch(`${BASE_URL}/print/printers`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  getPrintQueue: () => fetch(`${BASE_URL}/print/queue`, {
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  cancelPrintJob: (id) => fetch(`${BASE_URL}/print/jobs/${id}/cancel`, {
    method: 'POST',
    headers: apiClient.getHeaders()
  }).then(handleResponse),

  retryPrintJob: (id) => fetch(`${BASE_URL}/print/jobs/${id}/retry`, {
    method: 'POST',
    headers: apiClient.getHeaders()
  }).then(handleResponse),
};
