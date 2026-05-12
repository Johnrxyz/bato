import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/reports'
import { format } from 'date-fns'
import { Check, BellOff, ExternalLink } from 'lucide-react'
import styles from './NotificationDropdown.module.css'

export default function NotificationDropdown({ onClose }) {
  const queryClient = useQueryClient()
  
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(res => res.data.results || res.data)
  })

  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
    }
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
    }
  })

  if (isLoading) return <div className={styles.dropdown}>Loading...</div>

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notifications</h3>
        {notifications.length > 0 && (
          <button className={styles.markAll} onClick={() => markAllRead.mutate()}>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`${styles.item} ${!notif.is_read ? styles.unread : ''}`}
            onClick={() => !notif.is_read && markRead.mutate(notif.id)}
          >
            <div className={styles.itemHeader}>
              <span className={styles.typeTag}>{notif.type.replace('_', ' ')}</span>
              <span className={styles.date}>{format(new Date(notif.created_at), 'MMM d, h:mm a')}</span>
            </div>
            <div className={styles.itemTitle}>{notif.title}</div>
            <p className={styles.itemBody}>{notif.body}</p>
            {notif.action_url && (
              <a href={notif.action_url} className={styles.actionLink}>
                View Task <ExternalLink size={10} />
              </a>
            )}
            {!notif.is_read && <div className={styles.unreadIndicator} />}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className={styles.empty}>
            <BellOff size={24} />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
