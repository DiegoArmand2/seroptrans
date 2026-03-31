import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Roles from './pages/Roles'
import Permisos from './pages/Permisos'
import Proyecto from './pages/Proyecto'
import Turno from './pages/Turno'
import Pasajero from './pages/Pasajero'
import Conductor from './pages/Conductor'
import Vehiculo from './pages/Vehiculo'
import Horarios from './pages/Horarios'
import Spinner from './components/ui/Spinner'

const Ruta = lazy(() => import('./pages/Ruta'))

const rutaFallback = (
  <div className="min-h-[50vh] flex items-center justify-center bg-bg">
    <Spinner size="lg" />
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="roles" element={<Roles />} />
            <Route path="permisos" element={<Permisos />} />
            <Route path="proyecto" element={<Proyecto />} />
            <Route path="turno" element={<Turno />} />
            <Route path="pasajero" element={<Pasajero />} />
            <Route path="conductor" element={<Conductor />} />
            <Route path="vehiculo" element={<Vehiculo />} />
            <Route path="horarios" element={<Horarios />} />
            <Route
              path="ruta"
              element={
                <Suspense fallback={rutaFallback}>
                  <Ruta />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
