import api from './api'

export const rolesService = {
  list: (params) => api.get('/roles', { params }),
  get: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  getVentanas: (rolId) => api.get(`/roles/${rolId}/ventanas`),
  addVentana: (rolId, ventana) => api.post(`/roles/${rolId}/ventanas`, { ventana }),
  removeVentana: (rolId, rolwinId) => api.delete(`/roles/${rolId}/ventanas/${rolwinId}`),
  getProcesos: (rolId) => api.get(`/roles/${rolId}/procesos`),
  addProceso: (rolId, proceso) => api.post(`/roles/${rolId}/procesos`, { proceso }),
  removeProceso: (rolId, rolproId) => api.delete(`/roles/${rolId}/procesos/${rolproId}`),
  getProyectos: (rolId) => api.get(`/roles/${rolId}/proyectos`),
  addProyecto: (rolId, proyectoId) => api.post(`/roles/${rolId}/proyectos`, { proyecto_id: proyectoId }),
  removeProyecto: (rolId, rolproyId) => api.delete(`/roles/${rolId}/proyectos/${rolproyId}`),
}
