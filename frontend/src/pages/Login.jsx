import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { getErrorMessage } from '../utils/apiError'

const Login = () => {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [authLoading, isAuthenticated, from, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authLogin(login, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary">
            SeropTrans
          </h1>
          <p className="mt-2 text-muted font-accent text-lg">
            Gestión de Transporte Inteligente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Usuario"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Ingrese su usuario"
            required
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese su contraseña"
            required
            autoComplete="current-password"
          />
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            variant="accent"
            size="lg"
            loading={loading}
          >
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Plataforma de gestión de transporte para Aerosan
        </p>
      </div>
    </div>
  )
}

export default Login
