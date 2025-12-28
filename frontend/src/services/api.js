import axios from 'axios';

// ⚠️ OBLIGAR a que exista la variable de entorno
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined');
}

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

