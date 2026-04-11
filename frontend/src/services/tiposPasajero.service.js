import api from './api'

export const tiposPasajeroService = {
  list: (params) => api.get('/tipos-pasajero', { params }),
  get: (id) => api.get(`/tipos-pasajero/${id}`),
  create: (data) => api.post('/tipos-pasajero', data),
  update: (id, data) => api.put(`/tipos-pasajero/${id}`, data),
  delete: (id) => api.delete(`/tipos-pasajero/${id}`),
}
