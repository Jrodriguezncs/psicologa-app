import axios from 'axios';

const API_URL = 'https://psicologa-backend-3a3n.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then(r => r.data),
  getProfile: () => api.get('/auth/profile').then(r => r.data)
};

export const patientsService = {
  getAll: (params) => api.get('/patients', { params }).then(r => r.data),
  getById: (id) => api.get(`/patients/${id}`).then(r => r.data),
  create: (data) => api.post('/patients', data).then(r => r.data),
  update: (id, data) => api.put(`/patients/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/patients/${id}`).then(r => r.data),
  getAppointments: (id) => api.get(`/patients/${id}/appointments`).then(r => r.data),
  getTransactions: (id) => api.get(`/patients/${id}/transactions`).then(r => r.data)
};

export const appointmentsService = {
  getAll: (params) => api.get('/appointments', { params }).then(r => r.data),
  getById: (id) => api.get(`/appointments/${id}`).then(r => r.data),
  getByDateRange: (startDate, endDate) => api.get('/appointments/date-range', { params: { startDate, endDate } }).then(r => r.data),
  create: (data) => api.post('/appointments', data).then(r => r.data),
  update: (id, data) => api.put(`/appointments/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }).then(r => r.data),
  delete: (id) => api.delete(`/appointments/${id}`).then(r => r.data)
};

export const coveragesService = {
  getAll: () => api.get('/coverages').then(r => r.data),
  getById: (id) => api.get(`/coverages/${id}`).then(r => r.data),
  create: (data) => api.post('/coverages', data).then(r => r.data),
  update: (id, data) => api.put(`/coverages/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/coverages/${id}`).then(r => r.data)
};

export const feesService = {
  getAll: (params) => api.get('/fees', { params }).then(r => r.data),
  getGlobal: () => api.get('/fees/global').then(r => r.data),
  getById: (id) => api.get(`/fees/${id}`).then(r => r.data),
  create: (data) => api.post('/fees', data).then(r => r.data),
  update: (id, data) => api.put(`/fees/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/fees/${id}`).then(r => r.data)
};

export const billingService = {
  getAll: (params) => api.get('/billing', { params }).then(r => r.data),
  getById: (id) => api.get(`/billing/${id}`).then(r => r.data),
  create: (data) => api.post('/billing', data).then(r => r.data),
  update: (id, data) => api.put(`/billing/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/billing/${id}`).then(r => r.data),
  getPatientBalance: (patientId) => api.get(`/billing/patient/${patientId}/balance`).then(r => r.data),
  getPendingTransactions: (limit) => api.get('/billing', { params: { status: 'PENDING', limit } }).then(r => r.data)
};

export const clinicalNotesService = {
  getAll: (params) => api.get('/clinical-notes', { params }).then(r => r.data),
  getById: (id) => api.get(`/clinical-notes/${id}`).then(r => r.data),
  getByPatient: (patientId) => api.get(`/clinical-notes/patient/${patientId}`).then(r => r.data),
  create: (data) => api.post('/clinical-notes', data).then(r => r.data),
  update: (id, data) => api.put(`/clinical-notes/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/clinical-notes/${id}`).then(r => r.data)
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data),
  getUpcomingAppointments: (limit) => api.get('/dashboard/upcoming-appointments', { params: { limit } }).then(r => r.data),
  getPendingTransactions: (limit) => api.get('/billing', { params: { status: 'PENDING', limit } }).then(r => r.data)
};

export default api;
