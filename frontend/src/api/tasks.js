import apiClient from './client'

export const tasksApi = {
  list: (params) => apiClient.get('/tasks/', { params }),
  create: (data) => apiClient.post('/tasks/', data),
  get: (id) => apiClient.get(`/tasks/${id}/`),
  update: (id, data) => apiClient.patch(`/tasks/${id}/`, data),
  delete: (id) => apiClient.delete(`/tasks/${id}/`),
  reorder: (id, data) => apiClient.patch(`/tasks/${id}/reorder/`, data),

  // Comments
  listComments: (id) => apiClient.get(`/tasks/${id}/comments/`),
  addComment: (id, data) => apiClient.post(`/tasks/${id}/comments/`, data),
  updateComment: (taskId, commentId, data) =>
    apiClient.patch(`/tasks/${taskId}/comments/${commentId}/`, data),
  deleteComment: (taskId, commentId) =>
    apiClient.delete(`/tasks/${taskId}/comments/${commentId}/`),

  // Attachments
  listAttachments: (id) => apiClient.get(`/tasks/${id}/attachments/`),
  uploadAttachment: (id, formData) =>
    apiClient.post(`/tasks/${id}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAttachment: (taskId, attachmentId) =>
    apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}/`),

  // Activity
  getActivity: (id) => apiClient.get(`/tasks/${id}/activity/`),

  // Timer
  toggleTimer: (id) => apiClient.post(`/tasks/${id}/toggle-timer/`),
}
