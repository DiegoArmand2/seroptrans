/**
 * Extrae mensaje legible de errores de la API (Axios)
 * FastAPI puede devolver detail como string o como array de validación;
 * el proxy o un fallo intermedio puede devolver HTML o cuerpo vacío.
 */
export function getErrorMessage(err) {
  const data = err?.response?.data

  if (typeof data === 'string' && data.trim()) {
    const t = data.trim()
    if (t.startsWith('<')) {
      return 'Respuesta inválida del servidor (HTML). ¿Está la API FastAPI en marcha en el puerto 8000?'
    }
    return t.length <= 400 ? t : `${t.slice(0, 200)}…`
  }

  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === 'object' ? d.msg || JSON.stringify(d) : String(d)))
      .join('. ')
  }
  if (detail && typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail)
  }

  const status = err?.response?.status
  if (status === 401) return 'Login o contraseña incorrectos'
  if (status === 404) {
    return 'API no encontrada (404). Revise la URL: el frontend debe llamar a /api/auth/... (VITE_API_URL=/api o base con /api).'
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'El servidor no está disponible. Arranque uvicorn en el puerto 8000 (backend). Si usa Vite en Docker, el proxy debe alcanzar host.docker.internal:8000.'
  }

  if (err?.code === 'ECONNABORTED') return 'La petición tardó demasiado (timeout).'
  if (err?.code === 'ERR_CANCELED') {
    return 'Petición cancelada (p. ej. navegación o cierre de sesión). Intente de nuevo.'
  }
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'No se pudo conectar con el servidor. ¿Está la API en el puerto 8000? Si el frontend corre en Docker, ¿uvicorn escucha en 0.0.0.0:8000?'
  }

  return err?.message || 'Error desconocido'
}
