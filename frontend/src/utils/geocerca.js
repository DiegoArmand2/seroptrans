/**
 * Normaliza un GeoJSON Feature (Polygon/MultiPolygon) a una cadena estable para comparar
 * y evitar bucles mapa → estado cuando solo cambia el orden de claves o presence de properties.
 */
export function canonicalGeocercaString(raw) {
  const t = (raw ?? '').trim()
  if (!t) return ''
  let parsed
  try {
    parsed = JSON.parse(t)
  } catch {
    return ''
  }
  if (!parsed || parsed.type !== 'Feature' || !parsed.geometry) {
    return ''
  }
  const stable = {
    type: 'Feature',
    properties:
      parsed.properties && typeof parsed.properties === 'object' && !Array.isArray(parsed.properties)
        ? parsed.properties
        : {},
    geometry: parsed.geometry,
  }
  return JSON.stringify(stable)
}

/**
 * Validación del campo geocerca: GeoJSON Feature con Polygon o MultiPolygon (WGS84).
 * @param {string|null|undefined} raw
 * @returns {string|null} mensaje de error, o null si es válido o está vacío
 */
export function validateGeocercaString(raw) {
  const t = (raw ?? '').trim()
  if (!t) return null
  let parsed
  try {
    parsed = JSON.parse(t)
  } catch {
    return 'Geocerca: JSON inválido'
  }
  if (parsed.type !== 'Feature' || !parsed.geometry) {
    return 'Geocerca: debe ser un GeoJSON Feature con geometría'
  }
  const g = parsed.geometry
  if (g.type !== 'Polygon' && g.type !== 'MultiPolygon') {
    return 'Geocerca: la geometría debe ser Polygon o MultiPolygon'
  }
  if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
    return 'Geocerca: coordenadas vacías'
  }
  if (g.type === 'Polygon') {
    for (const ring of g.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4) {
        return 'Geocerca: anillo de polígono inválido (mínimo 4 puntos, cerrado)'
      }
    }
  } else {
    for (const poly of g.coordinates) {
      if (!Array.isArray(poly)) return 'Geocerca: MultiPolygon inválido'
      for (const ring of poly) {
        if (!Array.isArray(ring) || ring.length < 4) {
          return 'Geocerca: anillo de polígono inválido'
        }
      }
    }
  }
  return null
}
