import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, appointmentsData, transactionsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getUpcomingAppointments(5),
        dashboardService.getPendingTransactions(5)
      ]);

      setStats(statsData.stats);
      setAppointments(appointmentsData.appointments || []);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalPatients}</h3>
              <p>Pacientes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.appointmentsToday}</h3>
              <p>Turnos Hoy</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.confirmedToday}</h3>
              <p>Confirmados</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>${stats.weekIncome?.toLocaleString() || 0}</h3>
              <p>Ingresos Semana</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pendingTransactions}</h3>
              <p>Pendientes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <h3>${stats.pendingBalance?.toLocaleString() || 0}</h3>
              <p>Saldo Pendiente</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Próximos Turnos</h2>
            <Link to="/appointments" className="btn btn-secondary btn-sm">
              Ver Todos
            </Link>
          </div>
          {appointments.length === 0 ? (
            <p>No hay turnos próximos</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((apt) => (
                <div key={apt.id} className="appointment-item">
                  <div>
                    <strong>
                      {apt.patient.firstName} {apt.patient.lastName}
                    </strong>
                    <p className="appointment-date">
                      {format(new Date(apt.date), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <span className={`badge badge-${apt.status === 'CONFIRMED' ? 'success' : 'warning'}`}>
                    {apt.status === 'CONFIRMED' ? 'Confirmado' : 'Reservado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Transacciones Pendientes</h2>
            <Link to="/billing" className="btn btn-secondary btn-sm">
              Ver Todas
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p>No hay transacciones pendientes</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div>
                    <strong>
                      {tx.patient.firstName} {tx.patient.lastName}
                    </strong>
                    <p className="transaction-amount">
                      ${tx.amount.toLocaleString()}
                    </p>
                  </div>
                  <span className="badge badge-warning">Pendiente</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

