import { forwardRef } from 'react'
import styles from './Input.module.css'

const Input = forwardRef(function Input(
  { label, error, hint, className = '', ...props },
  ref
) {
  const id = props.id ?? props.name
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {props.required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">{error}</p>
      )}
    </div>
  )
})

export default Input
