import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Configurar axios con token por defecto
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

// Interceptor para manejar errores de autenticación y refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es un retry, intentar refrescar token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Usar axios directamente para evitar el interceptor
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Si el refresh falla, limpiar y redirigir a login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token, redirigir a login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),
  
  register: (data) =>
    api.post('/auth/register', data).then((res) => res.data),
  
  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((res) => res.data),
  
  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }).then((res) => res.data),
  
  getProfile: () =>
    api.get('/auth/profile').then((res) => res.data)
};

// Servicios de pacientes
export const patientsService = {
  getAll: (params) =>
    api.get('/patients', { params }).then((res) => res.data),
  
  getById: (id) =>
    api.get(`/patients/${id}`).then((res) => res.data),
  
  create: (data) =>
    api.post('/patients', data).then((res) => res.data),
  
  update: (id, data) =>
    api.put(`/patients/${id}`, data).then((res) => res.data),
  
  delete: (id) =>
    api.delete(`/patients/${id}`).then((res) => res.data),
  
  getAppointments: (id) =>
    api.get(`/patients/${id}/appointments`).then((res) => res.data),
  
  getTransactions: (id) =>
    api.get(`/patients/${id}/transactions`).then((res) => res.data)
};

// Servicios de turnos
export const appointmentsService = {
  getAll: (params) =>
    api.get('/appointments', { params }).then((res) => res.data),
  
  getByDateRange: (startDate, endDate) =>
    api.get('/appointments/range', {
      params: { startDate, endDate }
    }).then((res) => res.data),
  
  getById: (id) =>
    api.get(`/appointments/${id}`).then((res) => res.data),
  
  create: (data) =>
    api.post('/appointments', data).then((res) => res.data),
  
  update: (id, data) =>
    api.put(`/appointments/${id}`, data).then((res) => res.data),
  
  updateStatus: (id, status) =>
    api.patch(`/appointments/${id}/status`, { status }).then((res) => res.data),
  
  delete: (id) =>
    api.delete(`/appointments/${id}`).then((res) => res.data)
};

// Servicios de facturación
export const billingService = {
  getAll: (params) =>
    api.get('/billing', { params }).then((res) => res.data),
  
  getById: (id) =>
    api.get(`/billing/${id}`).then((res) => res.data),
  
  create: (data) =>
    api.post('/billing', data).then((res) => res.data),
  
  update: (id, data) =>
    api.put(`/billing/${id}`, data).then((res) => res.data),
  
  delete: (id) =>
    api.delete(`/billing/${id}`).then((res) => res.data),
  
  getPatientBalance: (patientId) =>
    api.get(`/billing/patient/${patientId}/balance`).then((res) => res.data)
};

// Servicios de coberturas
export const coveragesService = {
  getAll: () =>
    api.get('/coverages').then((res) => res.data),
  
  getById: (id) =>
    api.get(`/coverages/${id}`).then((res) => res.data),
  
  create: (data) =>
    api.post('/coverages', data).then((res) => res.data),
  
  update: (id, data) =>
    api.put(`/coverages/${id}`, data).then((res) => res.data),
  
  delete: (id) =>
    api.delete(`/coverages/${id}`).then((res) => res.data)
};

// Servicios de honorarios
export const feesService = {
  getAll: (params) =>
    api.get('/fees', { params }).then((res) => res.data),
  
  getGlobal: () =>
    api.get('/fees/global').then((res) => res.data),
  
  getById: (id) =>
    api.get(`/fees/${id}`).then((res) => res.data),
  
  create: (data) =>
    api.post('/fees', data).then((res) => res.data),
  
  update: (id, data) =>
    api.put(`/fees/${id}`, data).then((res) => res.data),
  
  delete: (id) =>
    api.delete(`/fees/${id}`).then((res) => res.data)
};

// Servicios de notas clínicas
export const clinicalNotesService = {
  getAll: (params) =>
    api.get('/clinical-notes', { params }).then((res) => res.data),
  
  getById: (id) =>
    api.get(`/clinical-notes/${id}`).then((res) => res.data),
  
  getByPatient: (patientId) =>
    api.get(`/clinical-notes/patient/${patientId}`).then((res) => res.data),
  
  create: (data) =>
    api.post('/clinical-notes', data).then((res) => res.data),
  
  update: (id, data) =>
    api.put(`/clinical-notes/${id}`, data).then((res) => res.data),
  
  delete: (id) =>
    api.delete(`/clinical-notes/${id}`).then((res) => res.data)
};

// Servicios de WhatsApp
export const whatsappService = {
  sendMessage: (phoneNumber, message) =>
    api.post('/whatsapp/send', { phoneNumber, message }).then((res) => res.data),
  
  sendReminder: (appointmentId, reminderType, mapsUrl) =>
    api.post(`/whatsapp/reminder/${appointmentId}`, {
      reminderType,
      mapsUrl
    }).then((res) => res.data),
  
  processReminders: (mapsUrl) =>
    api.post('/whatsapp/reminders/process', { mapsUrl }).then((res) => res.data)
};

// Servicios de dashboard
export const dashboardService = {
  getStats: () =>
    api.get('/dashboard/stats').then((res) => res.data),
  
  getUpcomingAppointments: (limit) =>
    api.get('/dashboard/upcoming-appointments', {
      params: { limit }
    }).then((res) => res.data),
  
  getPendingTransactions: (limit) =>
    api.get('/dashboard/pending-transactions', {
      params: { limit }
    }).then((res) => res.data)
};

export default api;

