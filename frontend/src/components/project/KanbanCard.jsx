import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Paperclip, MessageSquare, GripVertical, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tasksApi } from '@/api/tasks'
import { useUIStore } from '@/store/uiStore'
import styles from './KanbanBoard.module.css'

export default function KanbanCard({ task, isOverlay }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useUIStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const deleteTask = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task')
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const handleCardClick = () => {
    if (task.project?.id) {
      navigate(`/projects/${task.project.id}`)
    }
  }

  const priorityColor = `var(--priority-${task.priority || 'none'})`

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${styles.card} ${isOverlay ? styles.cardOverlay : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.priorityTag} style={{ backgroundColor: priorityColor }} />
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          <button 
            className={styles.cardDeleteBtn}
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm('Delete this task?')) deleteTask.mutate(task.id)
            }}
            title="Delete task"
          >
            <Trash2 size={12} />
          </button>
          <button 
            className={styles.grip} 
            {...attributes} 
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        </div>
      </div>

      <h4 className={styles.cardTitle}>{task.title}</h4>
      
      {task.project && (
        <span className={styles.projectName}>{task.project.title}</span>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          {task.due_date && (
            <div className={`${styles.metaItem} ${task.is_overdue ? styles.overdue : ''}`}>
              <Clock size={12} />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
          {task.attachment_count > 0 && (
            <div className={styles.metaItem}>
              <Paperclip size={12} />
              <span>{task.attachment_count}</span>
            </div>
          )}
          {task.comment_count > 0 && (
            <div className={styles.metaItem}>
              <MessageSquare size={12} />
              <span>{task.comment_count}</span>
            </div>
          )}
        </div>

        <div className={styles.assignees}>
          {task.assignees?.slice(0, 3).map((user, idx) => (
            <div 
              key={user.id} 
              className={styles.avatarMini} 
              style={{ zIndex: 10 - idx, marginLeft: idx > 0 ? -8 : 0 }}
              title={user.full_name}
            >
              {user.full_name[0]}
            </div>
          ))}
        </div>
      </div>
      
      {task.progress > 0 && (
        <div className={styles.cardProgress}>
          <div className={styles.cardProgressFill} style={{ width: `${task.progress}%` }} />
        </div>
      )}
    </div>
  )
}
