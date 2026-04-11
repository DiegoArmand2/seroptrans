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

const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
