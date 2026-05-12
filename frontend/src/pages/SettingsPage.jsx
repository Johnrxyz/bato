import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { User, Bell, Shield, Palette, Save } from 'lucide-react'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme, density, setDensity } = useUIStore()
  const [activeTab, setActiveTab] = useState('profile')

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </aside>

        <main className={styles.content}>
          {activeTab === 'profile' && (
            <section className="animate-fade-in">
              <h2 className={styles.sectionTitle}>Profile Settings</h2>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input type="text" defaultValue={user?.full_name} placeholder="Your name" />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input type="email" defaultValue={user?.email} disabled />
                <p className={styles.helpText}>Email cannot be changed directly.</p>
              </div>
              <div className={styles.formGroup}>
                <label>Job Title</label>
                <input type="text" placeholder="e.g. Senior Project Manager" />
              </div>
              <button className={styles.saveBtn}><Save size={14} /> Save Changes</button>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="animate-fade-in">
              <h2 className={styles.sectionTitle}>Notification Preferences</h2>
              <div className={styles.toggleGroup}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>Email Notifications</div>
                  <div className={styles.toggleDesc}>Receive daily digests and urgent alerts via email.</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className={styles.toggleGroup}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>Browser Notifications</div>
                  <div className={styles.toggleDesc}>Real-time alerts for task assignments and mentions.</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </section>
          )}

          {activeTab === 'appearance' && (
            <section className="animate-fade-in">
              <h2 className={styles.sectionTitle}>Appearance</h2>
              <div className={styles.formGroup}>
                <label>Theme</label>
                <select value={theme} onChange={e => setTheme(e.target.value)}>
                  <option value="light">Light (System Default)</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Density</label>
                <select value={density} onChange={e => setDensity(e.target.value)}>
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="animate-fade-in">
              <h2 className={styles.sectionTitle}>Security</h2>
              <div className={styles.formGroup}>
                <label>Current Password</label>
                <input type="password" />
              </div>
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input type="password" />
              </div>
              <button className={styles.saveBtn}>Update Password</button>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
