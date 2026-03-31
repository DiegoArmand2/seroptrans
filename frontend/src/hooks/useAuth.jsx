import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
          try {
            const u = JSON.parse(storedUser)
            if (!cancelled) setUser(u)
          } catch {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (!cancelled) setUser(null)
          }
        } else if (token && !storedUser) {
          localStorage.removeItem('token')
          if (!cancelled) setUser(null)
        }

        // Desbloquear la UI de inmediato (login, rutas públicas). La validación con /auth/me va después.
        if (!cancelled) setLoading(false)

        if (!token) return

        try {
          const data = await authService.me()
          if (!cancelled) {
            setUser(data)
            localStorage.setItem('user', JSON.stringify(data))
          }
        } catch (e) {
          if (!cancelled && e.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (login, password) => {
    const data = await authService.login(login, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const data = await authService.me()
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch {
      logout()
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
