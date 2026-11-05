import api from './api'

export const asignacionManualRutaService = {
  asignar: (data) => api.post('/asignacion-manual-ruta', data),
}
