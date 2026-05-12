import apiClient from './client'

export const notificationsApi = {
  list: (params) => apiClient.get('/notifications/', { params }),
  unreadCount: () => apiClient.get('/notifications/unread-count/'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read/`),
  markAllRead: () => apiClient.post('/notifications/read-all/'),
}

export const timelogsApi = {
  list: (params) => apiClient.get('/timelogs/', { params }),
  create: (data) => apiClient.post('/timelogs/', data),
  update: (id, data) => apiClient.patch(`/timelogs/${id}/`, data),
  delete: (id) => apiClient.delete(`/timelogs/${id}/`),
}

export const reportsApi = {
  dashboard: () => apiClient.get('/reports/dashboard/'),
  productivity: (params) => apiClient.get('/reports/productivity/', { params }),
  workload: (params) => apiClient.get('/reports/workload/', { params }),
  overdue: () => apiClient.get('/reports/overdue/'),
  velocity: (projectId, params) =>
    apiClient.get(`/reports/project/${projectId}/velocity/`, { params }),
}
