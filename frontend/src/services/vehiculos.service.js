import api from './api'

export const vehiculosService = {
  list: (params) => api.get('/vehiculos', { params }),
  get: (id) => api.get(`/vehiculos/${id}`),
  create: (data) => api.post('/vehiculos', data),
  update: (id, data) => api.put(`/vehiculos/${id}`, data),
  delete: (id) => api.delete(`/vehiculos/${id}`),
}
