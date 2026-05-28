import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Timer,
  BarChart2, Settings, ChevronLeft, ChevronRight, LogOut,
  LayoutGrid, Plus
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/kanban', icon: LayoutGrid, label: 'Board' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/time', icon: Timer, label: 'Time' },

]

export default function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setProjectModalOpen = useUIStore((s) => s.setProjectModalOpen)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`} aria-label="Main navigation">
      {/* Brand */}
      <div className={styles.brand}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.logo}>
          <rect x="3" y="3" width="8" height="8" rx="1" fill="var(--color-accent)" />
          <rect x="13" y="3" width="8" height="8" rx="1" fill="var(--color-border-strong)" />
          <rect x="3" y="13" width="8" height="8" rx="1" fill="var(--color-border-strong)" />
          <rect x="13" y="13" width="8" height="8" rx="1" fill="var(--color-accent)" opacity="0.4" />
        </svg>
        {!collapsed && <span className={styles.brandName}>TaskFlow</span>}
      </div>

      {/* Quick Action */}
      <div className={styles.quickAction}>
        {!collapsed ? (
          <button className={styles.newBtn} onClick={() => setProjectModalOpen(true)}>
            <Plus size={16} /> New Project
          </button>
        ) : (
          <button className={styles.newBtnCollapsed} title="New Project" onClick={() => setProjectModalOpen(true)}>
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            {!collapsed && <span className={styles.navLabel}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className={styles.bottom}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
          {!collapsed && <span className={styles.navLabel}>Settings</span>}
        </NavLink>

        {/* User */}
        <div className={styles.user}>
          <div className={styles.avatar} aria-hidden="true">
            {user?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.full_name}</span>
              <span className={styles.userRole}>{user?.system_role}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={14} strokeWidth={1.75} />
            : <ChevronLeft size={14} strokeWidth={1.75} />
          }
        </button>
      </div>
    </aside>
  )
}
