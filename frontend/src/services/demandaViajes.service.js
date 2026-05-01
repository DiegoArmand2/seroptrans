import api from './api'

export const DEMANDA_VIAJES_FETCH_LIMIT = 5000

export const demandaViajesService = {
  list: (params = {}) =>
    api.get('/demanda-viajes', {
      params: { ...params, limit: DEMANDA_VIAJES_FETCH_LIMIT },
    }),
}
