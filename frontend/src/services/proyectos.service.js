import api from './api'

export const proyectosService = {
  list: (params) => api.get('/proyectos', { params }),
  get: (id) => api.get(`/proyectos/${id}`),
  create: (data) => api.post('/proyectos', data),
  update: (id, data) => api.put(`/proyectos/${id}`, data),
  delete: (id) => api.delete(`/proyectos/${id}`),
}
