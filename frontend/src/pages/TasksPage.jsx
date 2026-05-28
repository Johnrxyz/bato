import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { projectsApi } from '@/api/projects'
import { StatusBadge, PriorityBadge, STATUS_MAP, PRIORITY_MAP } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { Plus, Folder, Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import styles from './TasksPage.module.css'

export default function TasksPage() {
  const queryClient = useQueryClient()
  const { toast, setProjectModalOpen } = useUIStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [newTaskProjectId, setNewTaskProjectId] = useState('')

  useEffect(() => {
    if (selectedProjectId !== 'all') {
      setNewTaskProjectId(selectedProjectId)
    } else {
      setNewTaskProjectId('')
    }
  }, [selectedProjectId])

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
      project: newTaskProjectId || null
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

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => toast.error('Failed to update task'),
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      createTask.mutate(newTaskTitle.trim())
    }
  }

  const filteredTasks = (data ?? []).filter(task => {
    if (selectedProjectId === 'all') return true
    if (selectedProjectId === '') return !task.project
    return task.project?.id === selectedProjectId
  })

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
            value={newTaskProjectId}
            onChange={e => setNewTaskProjectId(e.target.value)}
            className={styles.projectSelect}
          >
            <option value="">Personal</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button 
            type="button" 
            className={styles.newProjectBtn}
            onClick={() => setProjectModalOpen(true)}
            title="Create new project"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => newTaskTitle.trim() && createTask.mutate(newTaskTitle.trim())}
          disabled={!newTaskTitle.trim() || createTask.isPending}
        >
          {createTask.isPending ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      <div className={styles.tableToolbar}>
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Filter by:</span>
          <div className={styles.projectSelectWrap}>
            <Folder size={14} className={styles.meta} />
            <select 
              value={selectedProjectId} 
              onChange={e => setSelectedProjectId(e.target.value)}
              className={styles.projectSelect}
            >
              <option value="all">All Projects</option>
              <option value="">Personal</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <button 
              type="button" 
              className={styles.newProjectBtn}
              onClick={() => setProjectModalOpen(true)}
              title="Create new project"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
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
          {filteredTasks.map((task) => (
            <tr key={task.id} className={task.is_overdue ? styles.overdue : ''}>
              <td className={styles.taskTitle}>
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
              </td>
              <td className={styles.meta}>
                {task.project ? (
                  <Link to={`/projects/${task.project.id}`} className={styles.projectLink}>
                    {task.project.title}
                  </Link>
                ) : (
                  'Personal'
                )}
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
                  onClick={(e) => {
                    try { e.target.showPicker() } catch (err) {}
                  }}
                  onChange={(e) => updateTask.mutate({ id: task.id, due_date: e.target.value })}
                />
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
          {!isLoading && !filteredTasks.length && (
            <tr><td colSpan={5} className={styles.empty}>No tasks yet. Add one above!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
