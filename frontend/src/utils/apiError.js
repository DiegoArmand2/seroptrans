/**
 * Extrae mensaje legible de errores de la API (Axios)
 * FastAPI puede devolver detail como string o como array de objetos de validación
 */
export function getErrorMessage(err) {
  const detail = err?.response?.data?.detail
  if (!detail) return err?.message || 'Error desconocido'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join('. ')
  }
  return String(detail)
}
