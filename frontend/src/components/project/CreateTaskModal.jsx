import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import Modal from '@/components/ui/Modal'
import styles from './CreateProjectModal.module.css' // Reuse project modal styles for consistency

export default function CreateTaskModal({ isOpen, onClose, projectId }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: '',
    status: 'todo',
    priority: 'medium',
    description: '',
  })

  const createTask = useMutation({
    mutationFn: (data) => tasksApi.create({ ...data, project: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      onClose()
      setFormData({ title: '', status: 'todo', priority: 'medium', description: '' })
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createTask.mutate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label>Task Title</label>
          <input 
            type="text" 
            required 
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className={styles.group}>
          <label>Status</label>
          <select 
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className={styles.group}>
          <label>Priority</label>
          <select 
            value={formData.priority}
            onChange={e => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className={styles.group}>
          <label>Description</label>
          <textarea 
            placeholder="Add some details..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.submit} disabled={createTask.isPending}>
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
