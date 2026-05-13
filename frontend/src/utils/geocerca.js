/**
 * Normaliza un GeoJSON Feature (geometrías permitidas) a una cadena estable para comparar
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

const ALLOWED_TYPES = new Set([
  'Polygon',
  'MultiPolygon',
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
])

function isFinitePair(c) {
  return (
    Array.isArray(c) &&
    c.length >= 2 &&
    typeof c[0] === 'number' &&
    typeof c[1] === 'number' &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1])
  )
}

function inWgs84Range(lng, lat) {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

/** @returns {string|null} error or null */
function validatePositionChain(positions, label) {
  if (!Array.isArray(positions) || positions.length < 2) {
    return `Geocerca: ${label} requiere al menos 2 posiciones`
  }
  for (const p of positions) {
    if (!isFinitePair(p)) return `Geocerca: ${label} inválido`
    const [lng, lat] = p
    if (!inWgs84Range(lng, lat)) return 'Geocerca: coordenadas fuera de rango WGS84'
  }
  return null
}

function isValidLineStringCoords(coords) {
  return validatePositionChain(coords, 'LineString') === null
}

/**
 * Convierte la salida típica de Leaflet `layer.toGeoJSON()` en un único GeoJSON Feature
 * (p. ej. FeatureCollection de Points → MultiPoint; varios LineString → MultiLineString).
 * @param {object|null|undefined} geojson
 * @returns {{ type: 'Feature', properties: object, geometry: object }|null}
 */
export function normalizeToGeocercaFeature(geojson) {
  if (!geojson || typeof geojson !== 'object') return null
  if (geojson.type === 'Feature' && geojson.geometry) {
    return {
      type: 'Feature',
      properties:
        geojson.properties && typeof geojson.properties === 'object' && !Array.isArray(geojson.properties)
          ? geojson.properties
          : {},
      geometry: geojson.geometry,
    }
  }
  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    if (geojson.features.length === 0) return null
    if (geojson.features.length === 1) {
      const f = geojson.features[0]
      return normalizeToGeocercaFeature(f)
    }
    const allPoints = geojson.features.every(
      (f) => f && f.type === 'Feature' && f.geometry && f.geometry.type === 'Point' && isFinitePair(f.geometry.coordinates)
    )
    if (allPoints) {
      const coordinates = geojson.features.map((f) => f.geometry.coordinates)
      const props0 = geojson.features[0].properties
      const properties =
        props0 && typeof props0 === 'object' && !Array.isArray(props0) ? props0 : {}
      return {
        type: 'Feature',
        properties,
        geometry: { type: 'MultiPoint', coordinates },
      }
    }
    const allLineStrings = geojson.features.every(
      (f) =>
        f &&
        f.type === 'Feature' &&
        f.geometry &&
        f.geometry.type === 'LineString' &&
        Array.isArray(f.geometry.coordinates) &&
        isValidLineStringCoords(f.geometry.coordinates)
    )
    if (allLineStrings) {
      const coordinates = geojson.features.map((f) => f.geometry.coordinates)
      const props0 = geojson.features[0].properties
      const properties =
        props0 && typeof props0 === 'object' && !Array.isArray(props0) ? props0 : {}
      return {
        type: 'Feature',
        properties,
        geometry: { type: 'MultiLineString', coordinates },
      }
    }
  }
  return null
}

/**
 * Validación del campo geocerca: GeoJSON Feature con geometrías permitidas (WGS84).
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
  if (!ALLOWED_TYPES.has(g.type)) {
    return 'Geocerca: la geometría debe ser Polygon, MultiPolygon, Point, MultiPoint, LineString o MultiLineString'
  }
  if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
    return 'Geocerca: coordenadas vacías'
  }
  if (g.type === 'Point') {
    if (!isFinitePair(g.coordinates)) return 'Geocerca: Point inválido'
    const [lng, lat] = g.coordinates
    if (!inWgs84Range(lng, lat)) return 'Geocerca: coordenadas fuera de rango WGS84'
    return null
  }
  if (g.type === 'MultiPoint') {
    for (const p of g.coordinates) {
      if (!isFinitePair(p)) return 'Geocerca: MultiPoint inválido'
      const [lng, lat] = p
      if (!inWgs84Range(lng, lat)) return 'Geocerca: coordenadas fuera de rango WGS84'
    }
    return null
  }
  if (g.type === 'LineString') {
    return validatePositionChain(g.coordinates, 'LineString')
  }
  if (g.type === 'MultiLineString') {
    for (const line of g.coordinates) {
      const err = validatePositionChain(line, 'MultiLineString')
      if (err) return err
    }
    return null
  }
  if (g.type === 'Polygon') {
    for (const ring of g.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4) {
        return 'Geocerca: anillo de polígono inválido (mínimo 4 puntos, cerrado)'
      }
    }
    return null
  }
  if (g.type === 'MultiPolygon') {
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
