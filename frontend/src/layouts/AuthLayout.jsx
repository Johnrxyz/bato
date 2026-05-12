import { Outlet } from 'react-router-dom'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.brand}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1" fill="var(--color-accent)" />
          <rect x="13" y="3" width="8" height="8" rx="1" fill="var(--color-border-strong)" />
          <rect x="3" y="13" width="8" height="8" rx="1" fill="var(--color-border-strong)" />
          <rect x="13" y="13" width="8" height="8" rx="1" fill="var(--color-accent)" opacity="0.4" />
        </svg>
        <span className={styles.brandName}>TaskFlow</span>
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span>PELEC305 · Group 3 · {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
