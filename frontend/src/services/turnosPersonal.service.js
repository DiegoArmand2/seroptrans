import api from './api'

export const turnosPersonalService = {
  list: (params) => api.get('/turnos-personal', { params }),
  get: (id) => api.get(`/turnos-personal/${id}`),
  create: (data) => api.post('/turnos-personal', data),
  update: (id, data) => api.put(`/turnos-personal/${id}`, data),
  delete: (id) => api.delete(`/turnos-personal/${id}`),
}

