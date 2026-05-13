import axios from 'axios'

function resolveBaseURL() {
  const raw = import.meta.env.VITE_API_URL || '/api'

  // If someone passed a docker-style placeholder (e.g. "http://${HOST}/api") it won't be expanded
  // in a static Vite build, and will crash URL parsing downstream.
  if (typeof raw === 'string' && raw.includes('${')) return '/api'

  // Accept absolute URLs (http/https) and relative base paths (/api).
  if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/'))) {
    return raw
  }

  return '/api'
}

const API_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Con FormData, el Content-Type por defecto (application/json) hace que axios
  // convierta el cuerpo a JSON; el servidor espera multipart y falla con "Field required".
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = error.config?.url || ''
      const isLogin = path.includes('/auth/login')
      const isSessionBootstrap = path.includes('/auth/me')
      if (!isLogin && !isSessionBootstrap) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
