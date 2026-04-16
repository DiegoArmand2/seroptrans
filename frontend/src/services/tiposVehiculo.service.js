import api from './api'

export const tiposVehiculoService = {
  list: (params) => api.get('/tipos-vehiculo', { params }),
  get: (id) => api.get(`/tipos-vehiculo/${id}`),
  create: (data) => api.post('/tipos-vehiculo', data),
  update: (id, data) => api.put(`/tipos-vehiculo/${id}`, data),
  delete: (id) => api.delete(`/tipos-vehiculo/${id}`),
}
