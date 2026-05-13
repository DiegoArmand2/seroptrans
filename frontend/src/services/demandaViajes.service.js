import { CRUD_LIST_FETCH_LIMIT } from '../constants/apiListLimits'
import api from './api'

export const demandaViajesService = {
  list: (params = {}) =>
    api.get('/demanda-viajes', {
      params: { ...params, limit: params.limit ?? CRUD_LIST_FETCH_LIMIT },
    }),
}
