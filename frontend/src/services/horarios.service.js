import { CRUD_LIST_FETCH_LIMIT } from '../constants/apiListLimits'
import api from './api'

export const horariosService = {
  /** Body al API: proyecto_id, anio, numero_semana (ISO), url. n8n solo recibe { id_proyecto, url } (ampliar en backend si aplica). */
  importar: (data) => api.post('/horarios/importar', data),
  /** params opcional: { proyecto_id } para filtrar; sin proyecto_id lista según permisos (como rutas). */
  listImportaciones: (params = {}) =>
    api.get('/horarios/importaciones', {
      params: { ...params, limit: params.limit ?? CRUD_LIST_FETCH_LIMIT },
    }),
  getImportacion: (id) => api.get(`/horarios/importaciones/${id}`),
  updateImportacion: (id, data) => api.put(`/horarios/importaciones/${id}`, data),
  deleteImportacion: (id) => api.delete(`/horarios/importaciones/${id}`),
  confirmarImportacion: (id) => api.post(`/horarios/importaciones/${id}/confirmar`),
  procesarImportacion: (id) => api.post(`/horarios/importaciones/${id}/procesar`),
  /** Sube .xls/.xlsx y devuelve { url } para rellenar el campo URL (accesible por n8n si PUBLIC_BASE_URL es alcanzable). */
  subirArchivo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/horarios/subir-archivo', formData)
  },
}
