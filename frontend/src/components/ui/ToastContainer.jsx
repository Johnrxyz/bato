import { useUIStore } from '@/store/uiStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import styles from './ToastContainer.module.css'

const ICONS = {
  success: <CheckCircle size={14} strokeWidth={2} />,
  error: <AlertCircle size={14} strokeWidth={2} />,
  info: <Info size={14} strokeWidth={2} />,
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  if (!toasts.length) return null

  return (
    <div className={styles.container} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]} animate-fade-in`}>
          <span className={styles.icon}>{ICONS[toast.type] ?? ICONS.info}</span>
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.close}
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  )
}
