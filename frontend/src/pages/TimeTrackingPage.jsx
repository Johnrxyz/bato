import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timelogsApi } from '@/api/reports'
import { tasksApi } from '@/api/tasks'
import { Clock, Play, Square, Plus, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import styles from './TimeTrackingPage.module.css'

export default function TimeTrackingPage() {
  const queryClient = useQueryClient()
  
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['timelogs'],
    queryFn: () => timelogsApi.list().then(res => res.data.results || res.data)
  })

  // Find active timer (one without ended_at)
  const activeLog = logs.find(log => !log.ended_at)

  const deleteLog = useMutation({
    mutationFn: (id) => timelogsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['timelogs'])
  })

  const stopTimer = useMutation({
    mutationFn: (taskId) => tasksApi.toggleTimer(taskId),
    onSuccess: () => queryClient.invalidateQueries(['timelogs'])
  })

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (isLoading) return <div className={styles.loading}>Loading Time Logs...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Time Tracking</h1>
          <p>Monitor your productivity and billable hours</p>
        </div>
        <button className={styles.primaryBtn}><Plus size={14} /> Manual Log</button>
      </header>

      <div className={styles.content}>
        {activeLog && (
          <section className={`${styles.activeTimerCard} animate-scale-in`}>
            <div className={styles.activeTimerInfo}>
              <div className={styles.activeTimerLabel}>CURRENTLY WORKING ON</div>
              <h2 className={styles.activeTaskTitle}>{activeLog.task?.title || 'Active Task'}</h2>
              <div className={styles.activeProjectName}>{activeLog.task?.project?.title}</div>
            </div>
            
            <div className={styles.activeTimerRight}>
              <div className={styles.timerDisplay}>
                <Clock size={24} className={styles.pulse} />
                <span>{formatDuration(activeLog.duration || 0)}</span>
              </div>
              <button 
                className={styles.stopBtn}
                onClick={() => stopTimer.mutate(activeLog.task.id)}
              >
                <Square size={20} fill="currentColor" /> Stop Timer
              </button>
            </div>
          </section>
        )}

        <section className={styles.logsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Recent Activity</h3>
            <div className={styles.dateFilter}><Calendar size={14} /> This Week</div>
          </div>

          <div className={styles.logsList}>
            {logs.filter(log => log.ended_at).map(log => (
              <div key={log.id} className={styles.logRow}>
                <div className={styles.logInfo}>
                  <div className={styles.logTask}>{log.task?.title}</div>
                  <div className={styles.logMeta}>
                    {log.is_manual ? 'Manual Entry' : 'Timer'} • {format(new Date(log.started_at), 'MMM d, h:mm a')}
                  </div>
                </div>
                <div className={styles.logRight}>
                  <div className={styles.logDuration}>{log.duration_display}</div>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => deleteLog.mutate(log.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className={styles.empty}>No time logs found. Start a timer from the task board!</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
