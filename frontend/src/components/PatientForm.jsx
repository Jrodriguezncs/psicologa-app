import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsService, coveragesService } from '../services/api';
import { useFormValidation, validators } from '../utils/validation';
import { useToast } from './ToastContainer';
import FormField from './FormField';
import Loading from './Loading';
import './PatientForm.css';

const PatientForm = ({ patientId, initialData = null, onSuccess }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [coverages, setCoverages] = useState([]);
  const [loadingCoverages, setLoadingCoverages] = useState(true);
  const [showCustomFee, setShowCustomFee] = useState(false);

  const initialValues = {
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dni: initialData?.dni || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    emergencyContact: initialData?.emergencyContact || '',
    emergencyPhone: initialData?.emergencyPhone || '',
    notes: initialData?.notes || '',
    coverageId: initialData?.coverageId || '',
    customFee: {
      amount: initialData?.customFee?.amount || '',
      description: initialData?.customFee?.description || ''
    }
  };

  const validationSchema = {
    firstName: [
      validators.required('El nombre es requerido'),
      validators.minLength(2, 'El nombre debe tener al menos 2 caracteres')
    ],
    lastName: [
      validators.required('El apellido es requerido'),
      validators.minLength(2, 'El apellido debe tener al menos 2 caracteres')
    ],
    dni: [
      validators.dni('El DNI debe tener entre 7 y 8 dígitos')
    ],
    email: [
      validators.email('El email no es válido')
    ],
    phone: [
      validators.required('El teléfono es requerido'),
      validators.phone('El teléfono no es válido'),
      validators.minLength(8, 'El teléfono es demasiado corto')
    ],
    emergencyPhone: [
      validators.phone('El teléfono de emergencia no es válido')
    ],
    birthDate: [
      validators.pastDate('La fecha de nacimiento debe ser en el pasado')
    ],
    'customFee.amount': [
      (value) => {
        if (showCustomFee && (!value || parseFloat(value) <= 0)) {
          return 'El monto del honorario personalizado es requerido y debe ser mayor a 0';
        }
        return null;
      }
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
    loadCoverages();
    if (patientId && patientId !== 'new') {
      setShowCustomFee(!!initialData?.customFee);
    }
  }, []);

  const loadCoverages = async () => {
    try {
      const data = await coveragesService.getAll();
      setCoverages(data.coverages || []);
    } catch (error) {
      toast.error('Error al cargar coberturas');
    } finally {
      setLoadingCoverages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.warning('Por favor, corrige los errores en el formulario');
      // Scroll al primer error
      const firstErrorField = document.querySelector('.form-field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    try {
      const patientData = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        dni: values.dni.trim() || null,
        email: values.email.trim() || null,
        phone: values.phone.trim(),
        address: values.address.trim() || null,
        birthDate: values.birthDate || null,
        emergencyContact: values.emergencyContact.trim() || null,
        emergencyPhone: values.emergencyPhone.trim() || null,
        notes: values.notes.trim() || null,
        coverageId: values.coverageId || null,
        customFee: showCustomFee && values.customFee.amount ? {
          amount: parseFloat(values.customFee.amount),
          description: values.customFee.description.trim() || null
        } : null
      };

      if (patientId && patientId !== 'new') {
        await patientsService.update(patientId, patientData);
        toast.success('Paciente actualizado exitosamente');
      } else {
        await patientsService.create(patientData);
        toast.success('Paciente creado exitosamente');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/patients');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al guardar el paciente';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFeeChange = (field, value) => {
    handleChange('customFee', {
      ...values.customFee,
      [field]: value
    });
  };

  if (loadingCoverages) {
    return <Loading message="Cargando formulario..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="patient-form" noValidate>
      <div className="form-section">
        <h2 className="form-section-title">Información Personal</h2>
        
        <div className="form-row">
          <FormField
            label="Nombre"
            name="firstName"
            value={values.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            error={touched.firstName && errors.firstName}
            required
            autoComplete="given-name"
          />
          
          <FormField
            label="Apellido"
            name="lastName"
            value={values.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            error={touched.lastName && errors.lastName}
            required
            autoComplete="family-name"
          />
        </div>

        <div className="form-row">
          <FormField
            label="DNI"
            name="dni"
            value={values.dni}
            onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('dni')}
            error={touched.dni && errors.dni}
            placeholder="12345678"
            maxLength={8}
            helperText="Solo números, sin puntos ni guiones"
          />
          
          <FormField
            label="Fecha de Nacimiento"
            name="birthDate"
            type="date"
            value={values.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            onBlur={() => handleBlur('birthDate')}
            error={touched.birthDate && errors.birthDate}
          />
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Contacto</h2>
        
        <FormField
          label="Teléfono"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone && errors.phone}
          required
          autoComplete="tel"
          placeholder="+54 9 11 1234-5678"
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched.email && errors.email}
          autoComplete="email"
          placeholder="paciente@example.com"
        />

        <FormField
          label="Dirección"
          name="address"
          value={values.address}
          onChange={(e) => handleChange('address', e.target.value)}
          onBlur={() => handleBlur('address')}
          autoComplete="street-address"
        />
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Contacto de Emergencia</h2>
        
        <div className="form-row">
          <FormField
            label="Nombre del Contacto"
            name="emergencyContact"
            value={values.emergencyContact}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
            autoComplete="name"
          />
          
          <FormField
            label="Teléfono de Emergencia"
            name="emergencyPhone"
            type="tel"
            value={values.emergencyPhone}
            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
            onBlur={() => handleBlur('emergencyPhone')}
            error={touched.emergencyPhone && errors.emergencyPhone}
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Cobertura y Honorarios</h2>
        
        <FormField
          label="Cobertura"
          name="coverageId"
          type="select"
          value={values.coverageId}
          onChange={(e) => handleChange('coverageId', e.target.value)}
          options={[
            { value: '', label: 'Particular (Sin cobertura)' },
            ...coverages.map((c) => ({
              value: c.id,
              label: c.name
            }))
          ]}
          helperText="Selecciona la cobertura médica del paciente"
        />

        <div className="custom-fee-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showCustomFee}
              onChange={(e) => {
                setShowCustomFee(e.target.checked);
                if (!e.target.checked) {
                  handleChange('customFee', { amount: '', description: '' });
                }
              }}
            />
            <span>Honorario personalizado (sobrescribe la cobertura)</span>
          </label>

          {showCustomFee && (
            <div className="custom-fee-fields">
              <div className="form-row">
                <FormField
                  label="Monto"
                  name="customFee.amount"
                  type="number"
                  value={values.customFee.amount}
                  onChange={(e) => handleCustomFeeChange('amount', e.target.value)}
                  onBlur={() => handleBlur('customFee.amount')}
                  error={touched['customFee.amount'] && errors['customFee.amount']}
                  required={showCustomFee}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                
                <FormField
                  label="Descripción"
                  name="customFee.description"
                  value={values.customFee.description}
                  onChange={(e) => handleCustomFeeChange('description', e.target.value)}
                  placeholder="Ej: Honorario especial"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <FormField
          label="Notas"
          name="notes"
          type="textarea"
          rows={4}
          value={values.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Notas adicionales sobre el paciente..."
          helperText="Información adicional que pueda ser útil"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/patients')}
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
            patientId && patientId !== 'new' ? 'Actualizar Paciente' : 'Crear Paciente'
          )}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;

