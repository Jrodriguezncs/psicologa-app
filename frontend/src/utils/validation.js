/**
 * Utilidades de validación para formularios
 */

export const validators = {
  required: (value, message = 'Este campo es requerido') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return message;
    }
    return null;
  },

  minLength: (min, message = `Debe tener al menos ${min} caracteres`) => {
    return (value) => {
      if (value && value.length < min) {
        return message;
      }
      return null;
    };
  },

  maxLength: (max, message = `No debe exceder ${max} caracteres`) => {
    return (value) => {
      if (value && value.length > max) {
        return message;
      }
      return null;
    };
  },

  email: (value, message = 'Email inválido') => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },

  phone: (value, message = 'Teléfono inválido') => {
    if (value && !/^[0-9+\-\s()]+$/.test(value)) {
      return message;
    }
    return null;
  },

  dni: (value, message = 'DNI inválido') => {
    if (value && !/^\d{7,8}$/.test(value.replace(/[^0-9]/g, ''))) {
      return message;
    }
    return null;
  },

  min: (min, message = `El valor mínimo es ${min}`) => {
    return (value) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num < min) {
        return message;
      }
      return null;
    };
  },

  max: (max, message = `El valor máximo es ${max}`) => {
    return (value) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num > max) {
        return message;
      }
      return null;
    };
  },

  date: (value, message = 'Fecha inválida') => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return message;
      }
    }
    return null;
  },

  futureDate: (value, message = 'La fecha debe ser futura') => {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        return message;
      }
    }
    return null;
  },

  pastDate: (value, message = 'La fecha debe ser pasada') => {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      if (date >= now) {
        return message;
      }
    }
    return null;
  }
};

/**
 * Valida un objeto de valores contra un esquema de validación
 * @param {Object} values - Valores a validar
 * @param {Object} schema - Esquema de validación { field: [validators] }
 * @returns {Object} - Errores encontrados { field: 'mensaje' }
 */
export const validate = (values, schema) => {
  const errors = {};

  Object.keys(schema).forEach((field) => {
    const fieldValidators = schema[field];
    const value = values[field];

    for (const validator of fieldValidators) {
      const error = typeof validator === 'function' ? validator(value) : validator(value);
      if (error) {
        errors[field] = error;
        break; // Solo muestra el primer error
      }
    }
  });

  return errors;
};

/**
 * Hook para manejar validación de formularios
 */
import { useState } from 'react';

export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    
    // Limpiar error si el campo fue tocado
    if (touched[field] && errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validar campo al perder foco
    if (validationSchema[field]) {
      const fieldValidators = validationSchema[field];
      for (const validator of fieldValidators) {
        const error = typeof validator === 'function' 
          ? validator(values[field]) 
          : validator(values[field]);
        if (error) {
          setErrors((prev) => ({ ...prev, [field]: error }));
          break;
        }
      }
    }
  };

  const validateAll = () => {
    const newErrors = validate(values, validationSchema);
    setErrors(newErrors);
    setTouched(
      Object.keys(validationSchema).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues
  };
};

