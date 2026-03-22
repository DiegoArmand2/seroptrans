import api from './api'

export const pasajerosService = {
  list: (params) => api.get('/pasajeros', { params }),
  get: (id) => api.get(`/pasajeros/${id}`),
  create: (data) => api.post('/pasajeros', data),
  update: (id, data) => api.put(`/pasajeros/${id}`, data),
  delete: (id) => api.delete(`/pasajeros/${id}`),
  importar: (proyectoId, file) => {
    const formData = new FormData()
    formData.append('proyecto_id', proyectoId)
    formData.append('file', file)
    return api.post('/pasajeros/importar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
