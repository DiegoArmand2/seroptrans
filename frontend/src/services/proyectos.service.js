import { CRUD_LIST_FETCH_LIMIT } from '../constants/apiListLimits'
import api from './api'

export const proyectosService = {
  list: (params = {}) =>
    api.get('/proyectos', { params: { ...params, limit: params.limit ?? CRUD_LIST_FETCH_LIMIT } }),
  get: (id) => api.get(`/proyectos/${id}`),
  create: (data) => api.post('/proyectos', data),
  update: (id, data) => api.put(`/proyectos/${id}`, data),
  delete: (id) => api.delete(`/proyectos/${id}`),
}
