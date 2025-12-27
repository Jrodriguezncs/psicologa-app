import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsService, patientsService } from '../services/api';
import { useFormValidation, validators } from '../utils/validation';
import { useToast } from './ToastContainer';
import FormField from './FormField';
import Loading from './Loading';
import './AppointmentForm.css';

const AppointmentForm = ({ appointmentId, initialData = null, patientId: initialPatientId = null, onSuccess }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const getInitialDate = () => {
    if (initialData?.date) {
      const date = new Date(initialData.date);
      return {
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5)
      };
    }
    // Por defecto, hoy a las 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      date: tomorrow.toISOString().split('T')[0],
      time: '10:00'
    };
  };

  const initialDate = getInitialDate();

  const initialValues = {
    patientId: initialData?.patientId || initialPatientId || '',
    date: initialDate.date,
    time: initialDate.time,
    duration: initialData?.duration || 50,
    notes: initialData?.notes || '',
    status: initialData?.status || 'RESERVED'
  };

  const validationSchema = {
    patientId: [
      validators.required('Debes seleccionar un paciente')
    ],
    date: [
      validators.required('La fecha es requerida'),
      validators.futureDate('La fecha del turno debe ser futura')
    ],
    time: [
      validators.required('La hora es requerida')
    ],
    duration: [
      validators.required('La duración es requerida'),
      validators.min(15, 'La duración mínima es 15 minutos'),
      validators.max(180, 'La duración máxima es 180 minutos')
    ]
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues
  } = useFormValidation(initialValues, validationSchema);

  useEffect(() => {
    loadPatients();
    if (initialPatientId) {
      handlePatientSelect(initialPatientId);
    }
  }, []);

  useEffect(() => {
    if (values.patientId) {
      handlePatientSelect(values.patientId);
    }
  }, [values.patientId]);

  const loadPatients = async () => {
    try {
      const data = await patientsService.getAll({ limit: 200 });
      setPatients(data.patients || []);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient);
  };

  const handleDateChange = (field, value) => {
    handleChange(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.warning('Por favor, corrige los errores en el formulario');
      const firstErrorField = document.querySelector('.form-field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Combinar fecha y hora
    const dateTime = new Date(`${values.date}T${values.time}`);
    
    // Validar que la fecha/hora sea futura
    if (dateTime <= new Date()) {
      toast.error('El turno debe ser en el futuro');
      return;
    }

    setLoading(true);

    try {
      const appointmentData = {
        patientId: values.patientId,
        date: dateTime.toISOString(),
        duration: parseInt(values.duration),
        notes: values.notes.trim() || null,
        status: values.status
      };

      if (appointmentId) {
        await appointmentsService.update(appointmentId, appointmentData);
        toast.success('Turno actualizado exitosamente');
      } else {
        await appointmentsService.create(appointmentData);
        toast.success('Turno creado exitosamente');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/appointments');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al guardar el turno';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatients) {
    return <Loading message="Cargando formulario..." />;
  }

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}${p.phone ? ` - ${p.phone}` : ''}`
  }));

  return (
    <form onSubmit={handleSubmit} className="appointment-form" noValidate>
      <div className="form-section">
        <h2 className="form-section-title">Información del Turno</h2>
        
        <FormField
          label="Paciente"
          name="patientId"
          type="select"
          value={values.patientId}
          onChange={(e) => {
            handleChange('patientId', e.target.value);
            handlePatientSelect(e.target.value);
          }}
          onBlur={() => handleBlur('patientId')}
          error={touched.patientId && errors.patientId}
          required
          options={[
            { value: '', label: 'Seleccionar paciente...' },
            ...patientOptions
          ]}
        />

        {selectedPatient && (
          <div className="patient-info-card">
            <div className="patient-info-header">
              <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
              {selectedPatient.coverage && (
                <span className="badge badge-secondary">
                  {selectedPatient.coverage.name}
                </span>
              )}
            </div>
            <div className="patient-info-details">
              {selectedPatient.phone && <span>📞 {selectedPatient.phone}</span>}
              {selectedPatient.email && <span>✉️ {selectedPatient.email}</span>}
            </div>
          </div>
        )}

        <div className="form-row">
          <FormField
            label="Fecha"
            name="date"
            type="date"
            value={values.date}
            onChange={(e) => handleDateChange('date', e.target.value)}
            onBlur={() => handleBlur('date')}
            error={touched.date && errors.date}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          
          <FormField
            label="Hora"
            name="time"
            type="time"
            value={values.time}
            onChange={(e) => handleDateChange('time', e.target.value)}
            onBlur={() => handleBlur('time')}
            error={touched.time && errors.time}
            required
          />
          
          <FormField
            label="Duración (minutos)"
            name="duration"
            type="number"
            value={values.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            onBlur={() => handleBlur('duration')}
            error={touched.duration && errors.duration}
            required
            min="15"
            max="180"
            step="5"
            helperText="Duración estándar: 50 minutos"
          />
        </div>

        <FormField
          label="Estado"
          name="status"
          type="select"
          value={values.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={[
            { value: 'RESERVED', label: 'Reservado' },
            { value: 'CONFIRMED', label: 'Confirmado' },
            { value: 'COMPLETED', label: 'Completado' },
            { value: 'CANCELLED', label: 'Cancelado' },
            { value: 'ABSENT', label: 'Ausente' }
          ]}
          helperText="Estado inicial del turno"
        />

        <FormField
          label="Notas"
          name="notes"
          type="textarea"
          rows={3}
          value={values.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Notas sobre el turno..."
        />
      </div>

      {selectedPatient && values.date && values.time && (
        <div className="form-section appointment-preview">
          <h3 className="preview-title">📅 Resumen del Turno</h3>
          <div className="preview-content">
            <p>
              <strong>Paciente:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
            </p>
            <p>
              <strong>Fecha y Hora:</strong>{' '}
              {new Date(`${values.date}T${values.time}`).toLocaleString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p>
              <strong>Duración:</strong> {values.duration} minutos
            </p>
            {selectedPatient.coverage && (
              <p>
                <strong>Cobertura:</strong> {selectedPatient.coverage.name}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/appointments')}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-small" aria-hidden="true"></span>
              Guardando...
            </>
          ) : (
            appointmentId ? 'Actualizar Turno' : 'Crear Turno'
          )}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;

