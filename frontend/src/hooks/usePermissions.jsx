import { useAuth } from './useAuth'

export const usePermissions = () => {
  const { user } = useAuth()

  const hasVentana = (ventana) => {
    if (!user?.ventanas) return false
    return user.ventanas.includes(ventana)
  }

  const hasProceso = (proceso) => {
    if (!user?.procesos) return false
    return user.procesos.includes(proceso)
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
