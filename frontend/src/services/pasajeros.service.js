import api from './api'

export const pasajerosService = {
  list: (params) => api.get('/pasajeros', { params }),
  paged: (params) => api.get('/pasajeros/paged', { params }),
  get: (id) => api.get(`/pasajeros/${id}`),
  create: (data) => api.post('/pasajeros', data),
  update: (id, data) => api.put(`/pasajeros/${id}`, data),
  delete: (id) => api.delete(`/pasajeros/${id}`),
  importar: (proyectoId, file) => {
    const formData = new FormData()
    formData.append('proyecto_id', proyectoId)
    formData.append('file', file)
    // No fijar Content-Type: el navegador debe añadir boundary; forzarlo rompe el multipart y puede afectar Axios.
    return api.post('/pasajeros/importar', formData)
  },
}
