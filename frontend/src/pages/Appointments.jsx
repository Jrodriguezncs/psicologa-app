import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../services/api';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { useToast } from '../components/ToastContainer';
import Loading from '../components/Loading';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week'); // 'day', 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadAppointments();
  }, [view, currentDate, selectedDate]);

  const loadAppointments = async () => {
    try {
      let startDate, endDate;

      if (view === 'day') {
        startDate = selectedDate;
        endDate = selectedDate;
      } else {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      }

      const data = await appointmentsService.getByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error cargando turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentsService.updateStatus(id, newStatus);
      toast.success('Estado del turno actualizado');
      loadAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      RESERVED: 'Reservado',
      CONFIRMED: 'Confirmado',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
      ABSENT: 'Ausente'
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status) => {
    const badges = {
      RESERVED: 'warning',
      CONFIRMED: 'success',
      COMPLETED: 'primary',
      CANCELLED: 'danger',
      ABSENT: 'danger'
    };
    return badges[status] || 'secondary';
  };

  if (loading) {
    return <Loading message="Cargando agenda..." />;
  }

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
  );

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>Agenda</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/appointments/new')}
            aria-label="Crear nuevo turno"
          >
            ➕ Nuevo Turno
          </button>
          <div className="view-controls">
            <button
              className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('day')}
              aria-label="Vista diaria"
            >
              Día
            </button>
            <button
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('week')}
              aria-label="Vista semanal"
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      <div className="date-navigation">
        <button
          className="btn btn-secondary"
          onClick={() => {
            const change = view === 'day' ? 1 : 7;
            setCurrentDate(addDays(currentDate, -change));
            setSelectedDate(addDays(selectedDate, -change));
          }}
        >
          ← Anterior
        </button>
        <span className="current-date">
          {view === 'day'
            ? format(selectedDate, 'dd/MM/yyyy')
            : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd/MM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const change = view === 'day' ? 1 : 7;
            setCurrentDate(addDays(currentDate, change));
            setSelectedDate(addDays(selectedDate, change));
          }}
        >
          Siguiente →
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDate(today);
          }}
        >
          Hoy
        </button>
      </div>

      {view === 'week' ? (
        <div className="week-view">
          {weekDays.map((day) => {
            const dayAppointments = appointments.filter((apt) =>
              isSameDay(new Date(apt.date), day)
            );

            return (
              <div key={day.toISOString()} className="day-column">
                <div className="day-header">
                  <strong>{format(day, 'EEE dd/MM')}</strong>
                  <span className="appointment-count">
                    {dayAppointments.length} turnos
                  </span>
                </div>
                <div className="appointments-list">
                  {dayAppointments
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((apt) => (
                      <div key={apt.id} className="appointment-card">
                        <div className="appointment-time">
                          {format(new Date(apt.date), 'HH:mm')}
                        </div>
                        <div className="appointment-info">
                          <strong>
                            {apt.patient.firstName} {apt.patient.lastName}
                          </strong>
                          <p>{apt.patient.phone}</p>
                        </div>
                        <div className="appointment-actions">
                          <span
                            className={`badge badge-${getStatusBadge(apt.status)}`}
                          >
                            {getStatusLabel(apt.status)}
                          </span>
                          <select
                            className="form-select"
                            value={apt.status}
                            onChange={(e) =>
                              handleStatusChange(apt.id, e.target.value)
                            }
                            style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
                          >
                            <option value="RESERVED">Reservado</option>
                            <option value="CONFIRMED">Confirmado</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="CANCELLED">Cancelado</option>
                            <option value="ABSENT">Ausente</option>
                          </select>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="day-view">
          <div className="card">
            <h2>Turnos del {format(selectedDate, 'dd/MM/yyyy')}</h2>
            {appointments.length === 0 ? (
              <p>No hay turnos para este día</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((apt) => (
                        <tr key={apt.id}>
                          <td>{format(new Date(apt.date), 'HH:mm')}</td>
                          <td>
                            {apt.patient.firstName} {apt.patient.lastName}
                          </td>
                          <td>{apt.patient.phone}</td>
                          <td>
                            <span
                              className={`badge badge-${getStatusBadge(apt.status)}`}
                            >
                              {getStatusLabel(apt.status)}
                            </span>
                          </td>
                          <td>
                            <select
                              className="form-select"
                              value={apt.status}
                              onChange={(e) =>
                                handleStatusChange(apt.id, e.target.value)
                              }
                            >
                              <option value="RESERVED">Reservado</option>
                              <option value="CONFIRMED">Confirmado</option>
                              <option value="COMPLETED">Completado</option>
                              <option value="CANCELLED">Cancelado</option>
                              <option value="ABSENT">Ausente</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;

