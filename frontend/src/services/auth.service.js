import api from './api'

export const authService = {
  login: async (login, password) => {
    const { data } = await api.post('/auth/login', { login, password })
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
}
