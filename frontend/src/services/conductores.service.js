import { CRUD_LIST_FETCH_LIMIT } from '../constants/apiListLimits'
import api from './api'

export const conductoresService = {
  list: (params = {}) =>
    api.get('/conductores', { params: { ...params, limit: params.limit ?? CRUD_LIST_FETCH_LIMIT } }),
  get: (id) => api.get(`/conductores/${id}`),
  create: (data) => api.post('/conductores', data),
  update: (id, data) => api.put(`/conductores/${id}`, data),
  delete: (id) => api.delete(`/conductores/${id}`),
  assignProyecto: (conductorId, proyectoId) =>
    api.post(`/conductores/${conductorId}/proyectos/${proyectoId}`),
  removeProyecto: (conductorId, proyectoId) =>
    api.delete(`/conductores/${conductorId}/proyectos/${proyectoId}`),
}
