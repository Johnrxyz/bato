import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { projectsApi } from '@/api/projects'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { Plus, Folder, Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import styles from './TasksPage.module.css'

export default function TasksPage() {
  const queryClient = useQueryClient()
  const { toast } = useUIStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.data.results),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => tasksApi.list({ assignee: 'me' }).then((r) => r.data.results),
  })

  const createTask = useMutation({
    mutationFn: (title) => tasksApi.create({ 
      title, 
      project: selectedProjectId || null 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'mine'])
      setNewTaskTitle('')
    },
  })

  const deleteTask = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Task deleted successfully')
    },
    onError: () => toast.error('Failed to delete task')
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      createTask.mutate(newTaskTitle.trim())
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Tasks</h2>
      </div>

      <div className={styles.quickAdd}>
        <Plus size={18} className={styles.plusIcon} />
        <input
          type="text"
          className={styles.quickInput}
          placeholder="Add an individual task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={createTask.isPending}
        />
        <div className={styles.projectSelectWrap}>
          <Folder size={14} className={styles.meta} />
          <select 
            value={selectedProjectId} 
            onChange={e => setSelectedProjectId(e.target.value)}
            className={styles.projectSelect}
          >
            <option value="">Personal</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => newTaskTitle.trim() && createTask.mutate(newTaskTitle.trim())}
          disabled={!newTaskTitle.trim() || createTask.isPending}
        >
          {createTask.isPending ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Project</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due date</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={5} className={styles.empty}>Loading…</td></tr>
          )}
          {(data ?? []).map((task) => (
            <tr key={task.id} className={task.is_overdue ? styles.overdue : ''}>
              <td className={styles.taskTitle}>{task.title}</td>
              <td className={styles.meta}>{task.project_title || 'Personal'}</td>
              <td><StatusBadge status={task.status} /></td>
              <td><PriorityBadge priority={task.priority} /></td>
              <td className={`${styles.meta} ${task.is_overdue ? styles.overdueDate : ''}`}>
                {task.due_date
                  ? format(new Date(task.due_date), 'MMM d, yyyy')
                  : '—'}
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
          {!isLoading && !data?.length && (
            <tr><td colSpan={5} className={styles.empty}>No tasks yet. Add one above!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
