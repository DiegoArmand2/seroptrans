import api from './api'

export const horariosService = {
  /** Body al API: proyecto_id, fecha, url. El backend llama a n8n con { id_proyecto, url }. */
  importar: (data) => api.post('/horarios/importar', data),
  /** params opcional: { proyecto_id } para filtrar; sin proyecto_id lista según permisos (como rutas). */
  listImportaciones: (params = {}) => api.get('/horarios/importaciones', { params }),
  /** Sube .xls/.xlsx y devuelve { url } para rellenar el campo URL (accesible por n8n si PUBLIC_BASE_URL es alcanzable). */
  subirArchivo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/horarios/subir-archivo', formData)
  },
}
