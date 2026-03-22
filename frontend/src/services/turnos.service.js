import api from './api'

export const turnosService = {
  list: (params) => api.get('/turnos', { params }),
  get: (id) => api.get(`/turnos/${id}`),
  create: (data) => api.post('/turnos', data),
  update: (id, data) => api.put(`/turnos/${id}`, data),
  delete: (id) => api.delete(`/turnos/${id}`),
}
