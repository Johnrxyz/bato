import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { StatusBadge, PriorityBadge, STATUS_MAP, PRIORITY_MAP } from '@/components/ui/Badge'
import { Play, Square, Plus, MoreHorizontal, Trash2, Paperclip, Maximize2, MessageSquare } from 'lucide-react'
import { format, differenceInSeconds } from 'date-fns'
import { useUIStore } from '@/store/uiStore'
import styles from './TaskBoard.module.css'

function LiveTimer({ totalSeconds, startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime) return
    
    const interval = setInterval(() => {
      const now = new Date()
      const start = new Date(startTime)
      setElapsed(differenceInSeconds(now, start))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const seconds = totalSeconds + elapsed
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return (
    <span className={styles.liveTimer}>
      {h}h {m}m <span className={styles.seconds}>{s}s</span>
    </span>
  )
}

export default function TaskBoard({ tasks = [], projectId }) {
  const queryClient = useQueryClient()
  const { toast, openTaskPanel } = useUIStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const createTask = useMutation({
    mutationFn: (title) => tasksApi.create({ title, project: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', projectId])
      setNewTaskTitle('')
    },
  })

  const uploadFile = useMutation({
    mutationFn: ({ id, file }) => {
      const formData = new FormData()
      formData.append('file', file)
      return tasksApi.uploadAttachment(id, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('File uploaded')
    },
    onError: () => toast.error('Failed to upload file'),
  })

  const deleteTask = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted successfully')
    },
    onError: () => toast.error('Failed to delete task')
  })

  const toggleTimer = useMutation({
    mutationFn: (taskId) => tasksApi.toggleTimer(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => toast.error('Failed to update task'),
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      createTask.mutate(newTaskTitle.trim())
    }
  }

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.sticky}>Task Name</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Timeline</th>
            <th>Files</th>
            <th>Comments</th>
            <th>Logged</th>
            <th>Timer</th>
            <th>Owner</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={styles.row}>
              <td className={styles.sticky}>
                <div className={styles.titleCell}>
                  {task.is_working && <div className={styles.workingIndicator} />}
                  <input
                    type="text"
                    className={styles.titleInput}
                    defaultValue={task.title}
                    onBlur={(e) => {
                      if (e.target.value !== task.title) {
                        updateTask.mutate({ id: task.id, title: e.target.value })
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur()
                      }
                    }}
                  />
                  <button 
                    className={styles.openTaskBtn}
                    onClick={() => openTaskPanel(task.id)}
                    title="Open details"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </td>
              <td className={styles.statusCell}>
                <select 
                  className={`${styles.badgeSelect} ${styles[STATUS_MAP[task.status]?.variant || 'neutral']}`}
                  defaultValue={task.status}
                  onChange={(e) => updateTask.mutate({ id: task.id, status: e.target.value })}
                >
                  {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </td>
              <td className={styles.priorityCell}>
                <select 
                  className={`${styles.badgeSelect} ${styles[PRIORITY_MAP[task.priority]?.variant || 'neutral']}`}
                  defaultValue={task.priority}
                  onChange={(e) => updateTask.mutate({ id: task.id, priority: e.target.value })}
                >
                  {Object.entries(PRIORITY_MAP).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </td>
              <td>
                <input 
                  type="date"
                  className={styles.dateInput}
                  defaultValue={task.due_date ? task.due_date.split('T')[0] : ''}
                  onChange={(e) => updateTask.mutate({ id: task.id, due_date: e.target.value })}
                />
              </td>
              <td className={styles.filesCell}>
                <div className={styles.filesWrap}>
                  {task.attachment_count > 0 && (
                    <span className={styles.fileCount}>
                      <Paperclip size={12} />
                      {task.attachment_count}
                    </span>
                  )}
                  <label className={styles.fileUploadBtn}>
                    <Plus size={12} />
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadFile.mutate({ id: task.id, file })
                      }}
                    />
                  </label>
                </div>
              </td>
              <td className={styles.commentsCell}>
                <button 
                  className={styles.commentsBtn} 
                  onClick={() => openTaskPanel(task.id)}
                >
                  <MessageSquare size={14} />
                  {task.comment_count > 0 && <span>{task.comment_count}</span>}
                </button>
              </td>
              <td className={styles.timeCell}>
                {task.is_working ? (
                  <LiveTimer 
                    totalSeconds={task.total_logged_seconds || 0} 
                    startTime={task.active_timer_start} 
                  />
                ) : (
                  formatDuration(task.total_logged_seconds || 0)
                )}
              </td>
              <td>
                <button 
                  className={`${styles.timerBtn} ${task.is_working ? styles.timerBtnActive : ''}`}
                  onClick={() => toggleTimer.mutate(task.id)}
                  title={task.is_working ? "Stop timer" : "Start timer"}
                >
                  {task.is_working ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
              </td>
              <td className={styles.creatorCell}>
                {task.creator?.avatar ? (
                  <img src={task.creator.avatar} className={styles.avatar} alt="" />
                ) : (
                  <div className={styles.avatar} />
                )}
                <span>{task.creator?.full_name?.split(' ')[0]}</span>
              </td>
              <td>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => window.confirm('Delete this task?') && deleteTask.mutate(task.id)}
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          <tr className={styles.inlineCreator}>
            <td colSpan={9}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1rem' }}>
                <Plus size={14} className={styles.meta} />
                <input
                  type="text"
                  className={styles.inlineInput}
                  placeholder="Add a new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button 
                  className={styles.inlineAddBtn}
                  onClick={() => newTaskTitle.trim() && createTask.mutate(newTaskTitle.trim())}
                  disabled={!newTaskTitle.trim() || createTask.isLoading}
                >
                  {createTask.isLoading ? '...' : 'Add'}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
