import { useId } from 'react';

export default function FormField({ label, error, hint, as = 'input', ...props }) {
  const id = useId();
  const Tag = as;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={!!error} aria-describedby={describedBy} {...props} />
      {hint && !error && (
        <small id={`${id}-hint`} className="field__hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-err`} className="field__error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
