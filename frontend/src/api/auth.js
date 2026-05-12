import apiClient from './client'

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login/', credentials),
  register: (data) => apiClient.post('/auth/register/', data),
  logout: (refresh) => apiClient.post('/auth/logout/', { refresh }),
  refresh: (refresh) => apiClient.post('/auth/refresh/', { refresh }),
  me: () => apiClient.get('/auth/me/'),
  updateProfile: (data) => apiClient.patch('/auth/me/', data),
  changePassword: (data) => apiClient.post('/auth/change-password/', data),
  listUsers: (params) => apiClient.get('/auth/users/', { params }),
}
