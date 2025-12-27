import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientsService } from '../services/api';
import { useToast } from '../components/ToastContainer';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import './Patients.css';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadPatients();
  }, [search]);

  const loadPatients = async () => {
    try {
      const data = await patientsService.getAll({ search, limit: 50 });
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, patientName) => {
    setDeleteConfirm({ id, name: patientName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await patientsService.delete(deleteConfirm.id);
      toast.success('Paciente eliminado exitosamente');
      loadPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar paciente');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return <Loading message="Cargando pacientes..." />;
  }

  return (
    <div className="patients-page">
      <div className="page-header">
        <h1>Pacientes</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/patients/new')}
          aria-label="Crear nuevo paciente"
        >
          ➕ Nuevo Paciente
        </button>
      </div>

      <div className="card">
        <div className="search-box">
          <label htmlFor="patient-search" className="sr-only">
            Buscar pacientes
          </label>
          <input
            id="patient-search"
            type="text"
            className="form-input"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar pacientes"
          />
        </div>

        {patients.length === 0 ? (
          <p>No se encontraron pacientes</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Cobertura</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <Link to={`/patients/${patient.id}`}>
                        {patient.firstName} {patient.lastName}
                      </Link>
                    </td>
                    <td>{patient.dni || '-'}</td>
                    <td>{patient.phone}</td>
                    <td>{patient.coverage?.name || 'Particular'}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Ver
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteClick(patient.id, `${patient.firstName} ${patient.lastName}`)}
                          aria-label={`Eliminar paciente ${patient.firstName} ${patient.lastName}`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de eliminar al paciente "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Patients;

