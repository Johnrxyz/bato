import apiClient from './client'

export const projectsApi = {
  list: (params) => apiClient.get('/projects/', { params }),
  create: (data) => apiClient.post('/projects/', data),
  get: (id) => apiClient.get(`/projects/${id}/`),
  update: (id, data) => apiClient.patch(`/projects/${id}/`, data),
  delete: (id) => apiClient.delete(`/projects/${id}/`),

  // Members
  listMembers: (id) => apiClient.get(`/projects/${id}/members/`),
  addMember: (id, data) => apiClient.post(`/projects/${id}/members/add/`, data),
  removeMember: (id, userId) => apiClient.delete(`/projects/${id}/members/${userId}/`),
  updateMemberRole: (id, userId, role) =>
    apiClient.patch(`/projects/${id}/members/${userId}/role/`, { role }),
}
