import { CRUD_LIST_FETCH_LIMIT } from '../constants/apiListLimits'
import api from './api'

export const usuariosService = {
  list: (params = {}) =>
    api.get('/usuarios', { params: { ...params, limit: params.limit ?? CRUD_LIST_FETCH_LIMIT } }),
  get: (id) => api.get(`/usuarios/${id}`),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
  assignRol: (usuarioId, rolId) => api.post(`/usuarios/${usuarioId}/roles/${rolId}`),
  removeRol: (usuarioId, rolId) => api.delete(`/usuarios/${usuarioId}/roles/${rolId}`),
  syncRoles: (usuarioId, rolIds) => api.put(`/usuarios/${usuarioId}/roles`, { rol_ids: rolIds }),
}
