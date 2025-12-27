import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsService, appointmentsService, billingService } from '../services/api';
import { format } from 'date-fns';
import PatientForm from '../components/PatientForm';
import './PatientDetail.css';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id === 'new') {
      // Mostrar formulario para nuevo paciente
      setLoading(false);
    } else {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      const [patientData, appointmentsData, transactionsData, balanceData] =
        await Promise.all([
          patientsService.getById(id),
          patientsService.getAppointments(id),
          patientsService.getTransactions(id),
          billingService.getPatientBalance(id)
        ]);

      setPatient(patientData.patient);
      setAppointments(appointmentsData.appointments || []);
      setTransactions(transactionsData.transactions || []);
      setBalance(balanceData);
    } catch (error) {
      console.error('Error cargando paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (id === 'new') {
    return (
      <div className="patient-detail">
        <div className="page-header">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/patients')}
          >
            ← Volver
          </button>
          <h1>Nuevo Paciente</h1>
        </div>
        <div className="card">
          <PatientForm
            patientId="new"
            onSuccess={() => navigate('/patients')}
          />
        </div>
      </div>
    );
  }

  if (!patient) {
    return <div>Paciente no encontrado</div>;
  }

  return (
    <div className="patient-detail">
      <div className="page-header">
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/patients')}
          >
            ← Volver
          </button>
        </div>
        <h1>
          {patient.firstName} {patient.lastName}
        </h1>
      </div>

      <div className="patient-actions-header">
        <button
          className="btn btn-primary"
          onClick={() => setActiveTab('edit')}
        >
          ✏️ Editar Paciente
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div className="card">
          <PatientForm
            patientId={id}
            initialData={patient}
            onSuccess={() => {
              setActiveTab('info');
              loadPatientData();
            }}
          />
        </div>
      ) : (
        <>
      <div className="patient-info-card card">
        <h2>Información Personal</h2>
        <div className="info-grid">
          <div>
            <strong>DNI:</strong> {patient.dni || '-'}
          </div>
          <div>
            <strong>Teléfono:</strong> {patient.phone}
          </div>
          <div>
            <strong>Email:</strong> {patient.email || '-'}
          </div>
          <div>
            <strong>Cobertura:</strong> {patient.coverage?.name || 'Particular'}
          </div>
          {patient.birthDate && (
            <div>
              <strong>Fecha de Nacimiento:</strong>{' '}
              {format(new Date(patient.birthDate), 'dd/MM/yyyy')}
            </div>
          )}
          {balance && (
            <div>
              <strong>Saldo:</strong>{' '}
              <span className={balance.currentBalance > 0 ? 'balance-negative' : 'balance-positive'}>
                ${Math.abs(balance.currentBalance).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Información
        </button>
        <button
          className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Turnos ({appointments.length})
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transacciones ({transactions.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="card">
            <h3>Datos Adicionales</h3>
            <div className="info-grid">
              {patient.address && (
                <div>
                  <strong>Dirección:</strong> {patient.address}
                </div>
              )}
              {patient.emergencyContact && (
                <div>
                  <strong>Contacto de Emergencia:</strong> {patient.emergencyContact}
                </div>
              )}
              {patient.emergencyPhone && (
                <div>
                  <strong>Teléfono de Emergencia:</strong> {patient.emergencyPhone}
                </div>
              )}
              {patient.notes && (
                <div>
                  <strong>Notas:</strong> {patient.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="card">
            <div className="card-header">
              <h3>Historial de Turnos</h3>
            </div>
            {appointments.length === 0 ? (
              <p>No hay turnos registrados</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id}>
                        <td>
                          {format(new Date(apt.date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td>
                          <span className={`badge badge-${getStatusBadge(apt.status)}`}>
                            {getStatusLabel(apt.status)}
                          </span>
                        </td>
                        <td>{apt.duration} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card">
            <div className="card-header">
              <h3>Historial de Transacciones</h3>
            </div>
            {transactions.length === 0 ? (
              <p>No hay transacciones registradas</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          {format(new Date(tx.date), 'dd/MM/yyyy')}
                        </td>
                        <td>{getTransactionTypeLabel(tx.type)}</td>
                        <td>${tx.amount.toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${tx.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                            {tx.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
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

const getTransactionTypeLabel = (type) => {
  const labels = {
    PAYMENT: 'Pago',
    INVOICE: 'Factura',
    ADJUSTMENT: 'Ajuste'
  };
  return labels[type] || type;
};

export default PatientDetail;

