import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/api/reports'
import NotificationDropdown from './NotificationDropdown'
import styles from './Topbar.module.css'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/kanban': 'Board',
  '/tasks': 'My Tasks',
  '/time': 'Time Tracking',

  '/settings': 'Settings',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'TaskFlow'

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data),
    refetchInterval: 30_000,
  })

  const unreadCount = unreadData?.unread_count ?? 0

  return (
    <header className={styles.topbar} role="banner">
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.actions}>
        <button
          className={`${styles.notifBtn} ${showNotifications ? styles.notifBtnActive : ''}`}
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell size={16} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <NotificationDropdown onClose={() => setShowNotifications(false)} />
        )}
      </div>
    </header>
  )
}
