import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import Modal from '@/components/ui/Modal'
import styles from './CreateProjectModal.module.css'

export default function CreateProjectModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: '',
    identifier: '',
    description: '',
    due_date: '',
  })

  const createProject = useMutation({
    mutationFn: (data) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      onClose()
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createProject.mutate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label>Project Title</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. Website Redesign"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className={styles.group}>
          <label>Identifier</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. WEB-01"
            value={formData.identifier}
            onChange={e => setFormData({ ...formData, identifier: e.target.value.toUpperCase() })}
          />
        </div>
        <div className={styles.group}>
          <label>Description</label>
          <textarea 
            placeholder="What is this project about?"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className={styles.group}>
          <label>Due Date</label>
          <input 
            type="date" 
            value={formData.due_date}
            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.submit} disabled={createProject.isPending}>
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
