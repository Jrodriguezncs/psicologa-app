import axios from 'axios';

const API_URL = 'https://psicologa-backend-3a3n.onrender.com/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar refresh token
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

/* =========================
   AUTH
========================= */
export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then(res => res.data),

  register: (data) =>
    api.post('/auth/register', data).then(res => res.data),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }).then(res => res.data),

  getProfile: () =>
    api.get('/auth/profile').then(res => res.data)
};

/* =========================
   PATIENTS
========================= */
export const patientsService = {
  getAll: (params) =>
    api.get('/patients', { params }).then(res => res.data),

  getById: (id) =>
    api.get(`/patients/${id}`).then(res => res.data),

  create: (data) =>
    api.post('/patients', data).then(res => res.data),

  update: (id, data) =>
    api.put(`/patients/${id}`, data).then(res => res.data),

  delete: (id) =>
    api.delete(`/patients/${id}`).then(res => res.data),

  getAppointments: (id) =>
    api.get(`/patients/${id}/appointments`).then(res => res.data),

  getTransactions: (id) =>
    api.get(`/patients/${id}/transactions`).then(res => res.data)
};

/* =========================
   APPOINTMENTS
========================= */
export const appointmentsService = {
  getAll: (params) =>
    api.get('/appointments', { params }).then(res => res.data),

  getById: (id) =>
    api.get(`/appointments/${id}`).then(res => res.data),

  create: (data) =>
    api.post('/appointments', data).then(res => res.data),

  update: (id, data) =>
    api.put(`/appointments/${id}`, data).then(res => res.data),

  updateStatus: (id, status) =>
    api.patch(`/appointments/${id}/status`, { status }).then(res => res.data),

  delete: (id) =>
    api.delete(`/appointments/${id}`).then(res => res.data)
};

/* =========================
   COVERAGES
========================= */
export const coveragesService = {
  getAll: () =>
    api.get('/coverages').then(res => res.data),

  getById: (id) =>
    api.get(`/coverages/${id}`).then(res => res.data),

  create: (data) =>
    api.post('/coverages', data).then(res => res.data),

  update: (id, data) =>
    api.put(`/coverages/${id}`, data).then(res => res.data),

  delete: (id) =>
    api.delete(`/coverages/${id}`).then(res => res.data)
};

/* =========================
   FEES
========================= */
export const feesService = {
  getAll: (params) =>
    api.get('/fees', { params }).then(res => res.data),

  getGlobal: () =>
    api.get('/fees/global').then(res => res.data),

  getById: (id) =>
    api.get(`/fees/${id}`).then(res => res.data),

  create: (data) =>
    api.post('/fees', data).then(res => res.data),

  update: (id, data) =>
    api.put(`/fees/${id}`, data).then(res => res.data),

  delete: (id) =>
    api.delete(`/fees/${id}`).then(res => res.data)
};

/* =========================
   BILLING
========================= */
export const billingService = {
  getAll: (params) =>
    api.get('/billing', { params }).then(res => res.data),

  getById: (id) =>
    api.get(`/billing/${id}`).then(res => res.data),

  create: (data) =>
    api.post('/billing', data).then(res => res.data),

  update: (id, data) =>
    api.put(`/billing/${id}`, data).then(res => res.data),

  delete: (id) =>
    api.delete(`/billing/${id}`).then(res => res.data),

  getPatientBalance: (patientId) =>
    api.get(`/billing/patient/${patientId}/balance`).then(res => res.data)
};

/* =========================
   CLINICAL NOTES
========================= */
export const clinicalNotesService = {
  getAll: (params) =>
    api.get('/clinical-notes', { params }).then(res => res.data),

  getById: (id) =>
    api.get(`/clinical-notes/${id}`).then(res => res.data),

  getByPatient: (patientId) =>
    api.get(`/clinical-notes/patient/${patientId}`).then(res => res.data),

  create: (data) =>
    api.post('/clinical-notes', data).then(res => res.data),

  update: (id, data) =>
    api.put(`/clinical-notes/${id}`, data).then(res => res.data),

  delete: (id) =>
    api.delete(`/clinical-notes/${id}`).then(res => res.data)
};

/* =========================
   DASHBOARD
========================= */
export const dashboardService = {
  getStats: () =>
    api.get('/dashboard/stats').then(res => res.data),

  getUpcomingAppointments: (limit) =>
    api.get('/dashboard/upcoming-appointments', {
      params: { limit }
    }).then(res => res.data)
};

export default api;
