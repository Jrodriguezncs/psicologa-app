import './FormField.css';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  disabled = false,
  autoComplete,
  options = null, // Para select
  rows = null, // Para textarea
  helperText,
  ...props
}) => {
  const inputId = `field-${name}`;
  const errorId = `error-${name}`;
  const helperId = `helper-${name}`;

  const inputProps = {
    id: inputId,
    name,
    type,
    value: value || '',
    onChange,
    onBlur,
    disabled,
    required,
    placeholder,
    autoComplete,
    'aria-describedby': error ? errorId : helperText ? helperId : undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required ? 'true' : 'false',
    ...props
  };

  return (
    <div className={`form-field ${error ? 'form-field-error' : ''} ${disabled ? 'form-field-disabled' : ''}`}>
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="required-asterisk" aria-label="campo requerido">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          {...inputProps}
          rows={rows || 4}
          className="form-input form-textarea"
        />
      ) : type === 'select' ? (
        <select
          {...inputProps}
          className="form-input form-select"
        >
          <option value="">Seleccionar...</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...inputProps}
          className="form-input"
        />
      )}

      {helperText && !error && (
        <p id={helperId} className="form-helper-text">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="form-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;

