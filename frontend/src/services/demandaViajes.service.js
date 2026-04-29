import api from './api'

export const demandaViajesService = {
  list: (params) => api.get('/demanda-viajes', { params }),
}
