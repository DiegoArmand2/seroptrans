import { CRUD_LIST_FETCH_LIMIT } from '../constants/apiListLimits'
import api from './api'

export const rutasService = {
  list: (params = {}) =>
    api.get('/rutas', { params: { ...params, limit: params.limit ?? CRUD_LIST_FETCH_LIMIT } }),
  get: (id) => api.get(`/rutas/${id}`),
  create: (data) => api.post('/rutas', data),
  update: (id, data) => api.put(`/rutas/${id}`, data),
  delete: (id) => api.delete(`/rutas/${id}`),
}
