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
    const payload = {
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date || null,
    }
    createProject.mutate(payload)
  }

  const generateIdentifier = (title) => {
    if (!title) return ''
    const words = title.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase()
    }
    return words.map(w => w[0]).join('').substring(0, 4).toUpperCase()
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setFormData(prev => {
      // Only auto-update identifier if the user hasn't manually changed it significantly
      // Actually, to keep it simple, just auto-update it if they are typing the title
      // We will blindly update it. If they want a custom one, they can edit it after.
      return {
        ...prev,
        title: newTitle,
        identifier: generateIdentifier(newTitle)
      }
    })
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
            onChange={handleTitleChange}
          />
        </div>
        <div className={styles.group}>
          <label>Identifier</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. WR"
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
            onClick={(e) => {
              try { e.target.showPicker() } catch (err) {}
            }}
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
