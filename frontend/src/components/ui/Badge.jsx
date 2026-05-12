import styles from './Badge.module.css'

export const STATUS_MAP = {
  todo: { label: 'To Do', variant: 'neutral' },
  in_progress: { label: 'In Progress', variant: 'accent' },
  in_review: { label: 'In Review', variant: 'warning' },
  done: { label: 'Done', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
}

export const PRIORITY_MAP = {
  none: { label: 'None', variant: 'muted' },
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'accent' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
}

export function StatusBadge({ status, onClick, interactive }) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'neutral' }
  return (
    <span 
      className={`${styles.badge} ${styles[variant]} ${interactive ? styles.interactive : ''}`}
      onClick={onClick}
    >
      {label}
    </span>
  )
}

export function PriorityBadge({ priority, onClick, interactive }) {
  const { label, variant } = PRIORITY_MAP[priority] ?? { label: priority, variant: 'neutral' }
  return (
    <span 
      className={`${styles.badge} ${styles[variant]} ${interactive ? styles.interactive : ''}`}
      onClick={onClick}
    >
      {label}
    </span>
  )
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
