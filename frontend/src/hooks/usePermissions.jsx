import { useAuth } from './useAuth'

export const usePermissions = () => {
  const { user } = useAuth()

  const norm = (s) => String(s ?? '').toLowerCase().trim()

  const hasVentana = (ventana) => {
    if (!user?.ventanas?.length) return false
    const key = norm(ventana)
    return user.ventanas.some((x) => norm(x) === key)
  }

  const hasProceso = (proceso) => {
    if (!user?.procesos?.length) return false
    const key = norm(proceso)
    return user.procesos.some((x) => norm(x) === key)
  }

  const ventanas = user?.ventanas || []
  const procesos = user?.procesos || []

  return {
    hasVentana,
    hasProceso,
    ventanas,
    procesos,
  }
}
