import { useSearchParams, useNavigate } from 'react-router-dom';
import AppointmentForm from '../components/AppointmentForm';
import './AppointmentNew.css';

const AppointmentNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('patientId');

  return (
    <div className="appointment-new-page">
      <div className="page-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/appointments')}
        >
          ← Volver a Agenda
        </button>
        <h1>Nuevo Turno</h1>
      </div>
      <div className="card">
        <AppointmentForm
          patientId={patientId}
          onSuccess={() => navigate('/appointments')}
        />
      </div>
    </div>
  );
};

export default AppointmentNew;

