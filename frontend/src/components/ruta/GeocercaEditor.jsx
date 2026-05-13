import { useCallback, useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import '@geoman-io/leaflet-geoman-free'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  canonicalGeocercaString,
  normalizeToGeocercaFeature,
  validateGeocercaString,
} from '../../utils/geocerca'

// Vite no resuelve las URLs por defecto de Leaflet; sin esto el marcador de dibujo se ve roto.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

/** Centro por defecto (Sudamérica); ajustable si el negocio concentra otra región */
const DEFAULT_CENTER = [-9.19, -75.0]
const DEFAULT_ZOOM = 5

const OSM_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/** Primer vértice de la geometría GeoJSON como Leaflet [lat, lng] (fallback de vista). */
function firstLeafletLatLngFromGeometry(g) {
  if (!g || !Array.isArray(g.coordinates)) return null
  if (g.type === 'Point' && g.coordinates.length >= 2) {
    return [g.coordinates[1], g.coordinates[0]]
  }
  if (
    g.type === 'MultiPoint' &&
    g.coordinates.length > 0 &&
    Array.isArray(g.coordinates[0]) &&
    g.coordinates[0].length >= 2
  ) {
    const c = g.coordinates[0]
    return [c[1], c[0]]
  }
  if (g.type === 'LineString' && g.coordinates.length > 0) {
    const c = g.coordinates[0]
    if (Array.isArray(c) && c.length >= 2) return [c[1], c[0]]
  }
  if (
    g.type === 'MultiLineString' &&
    g.coordinates.length > 0 &&
    Array.isArray(g.coordinates[0]) &&
    g.coordinates[0].length > 0
  ) {
    const c = g.coordinates[0][0]
    if (Array.isArray(c) && c.length >= 2) return [c[1], c[0]]
  }
  return null
}

function GeomanInner({ value, onChange }) {
  const map = useMap()
  const fgRef = useRef(null)
  const lastAppliedRef = useRef('')
  const programmaticRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  onChangeRef.current = onChange
  valueRef.current = value

  const syncFromRaw = useCallback((raw) => {
    const fg = fgRef.current
    if (!fg) return

    const t = (raw ?? '').trim()
    const normalized = t ? canonicalGeocercaString(t) : ''
    if (normalized === lastAppliedRef.current) {
      if (normalized !== '' || fg.getLayers().length === 0) return
    }

    lastAppliedRef.current = normalized
    programmaticRef.current = true
    fg.clearLayers()

    if (!normalized) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      programmaticRef.current = false
      return
    }

    try {
      map.invalidateSize()
      const obj = JSON.parse(normalized)
      const gj = L.geoJSON(obj, {
        onEachFeature: (_feature, layer) => {
          if (layer.pm) layer.pm.enable()
        },
      })
      fg.addLayer(gj)
      const b = gj.getBounds()
      if (b.isValid()) {
        map.fitBounds(b, { padding: [28, 28], maxZoom: 16 })
      } else {
        const latLng = firstLeafletLatLngFromGeometry(obj?.geometry)
        if (latLng) map.setView(latLng, 14)
      }
    } catch {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    }
    programmaticRef.current = false
  }, [map])

  useEffect(() => {
    const fg = L.featureGroup().addTo(map)
    fgRef.current = fg

    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: true,
      drawRectangle: false,
      drawText: false,
      rotateMode: false,
      drawPolygon: true,
      editMode: true,
      dragMode: true,
      removalMode: true,
      cutPolygon: false,
      oneBlock: false,
    })

    const emitFromFg = () => {
      try {
        const fgInner = fgRef.current
        if (!fgInner || fgInner.getLayers().length === 0) {
          lastAppliedRef.current = ''
          if ((valueRef.current || '').trim() !== '') {
            onChangeRef.current('')
          }
          return
        }
        const layer = fgInner.getLayers()[0]
        const raw = layer.toGeoJSON()
        const feature = normalizeToGeocercaFeature(raw)
        if (!feature) {
          lastAppliedRef.current = ''
          if ((valueRef.current || '').trim() !== '') {
            onChangeRef.current('')
          }
          return
        }
        const str = JSON.stringify(feature)
        const err = validateGeocercaString(str)
        if (err) {
          lastAppliedRef.current = ''
          if ((valueRef.current || '').trim() !== '') {
            onChangeRef.current('')
          }
          return
        }
        const s = canonicalGeocercaString(str)
        if (!s) return
        lastAppliedRef.current = s
        const cur = canonicalGeocercaString(valueRef.current || '')
        if (s !== cur) {
          onChangeRef.current(s)
        }
      } catch {
        lastAppliedRef.current = ''
        if ((valueRef.current || '').trim() !== '') {
          onChangeRef.current('')
        }
      }
    }

    const onCreate = (e) => {
      programmaticRef.current = true
      fg.clearLayers()
      fg.addLayer(e.layer)
      if (e.layer.pm) e.layer.pm.enable()
      programmaticRef.current = false
      emitFromFg()
    }

    const onUpdate = () => {
      emitFromFg()
    }

    const onRemove = () => {
      if (programmaticRef.current) return
      const fgInner = fgRef.current
      if (!fgInner || fgInner.getLayers().length === 0) {
        lastAppliedRef.current = ''
        onChangeRef.current('')
        return
      }
      emitFromFg()
    }

    map.on('pm:create', onCreate)
    map.on('pm:update', onUpdate)
    map.on('pm:remove', onRemove)

    map.whenReady(() => {
      map.invalidateSize()
    })

    return () => {
      map.off('pm:create', onCreate)
      map.off('pm:update', onUpdate)
      map.off('pm:remove', onRemove)
      try {
        map.pm.removeControls()
      } catch {
        /* noop */
      }
      fg.clearLayers()
      map.removeLayer(fg)
      fgRef.current = null
    }
  }, [map])

  useEffect(() => {
    syncFromRaw(value)
    const t = window.setTimeout(() => {
      map.invalidateSize()
      const fg = fgRef.current
      if (fg && fg.getLayers().length > 0) {
        try {
          const b = fg.getBounds()
          if (b.isValid()) {
            map.fitBounds(b, { padding: [28, 28], maxZoom: 16 })
          } else {
            const n = (value || '').trim() ? canonicalGeocercaString(value) : ''
            if (n) {
              try {
                const o = JSON.parse(n)
                const latLng = firstLeafletLatLngFromGeometry(o?.geometry)
                if (latLng) map.setView(latLng, 14)
              } catch {
                /* noop */
              }
            }
          }
        } catch {
          /* noop */
        }
      } else {
        syncFromRaw(value)
      }
    }, 320)
    return () => window.clearTimeout(t)
  }, [map, value, syncFromRaw])

  return null
}

function GeocercaEditor({ value, onChange, instanceKey = 'default' }) {
  const [jsonOpen, setJsonOpen] = useState(false)
  const [jsonDraft, setJsonDraft] = useState(() => (value || '').trim())
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    setJsonDraft((value || '').trim())
    setJsonError('')
  }, [value, instanceKey])

  const handleJsonBlur = () => {
    const t = jsonDraft.trim()
    if (!t) {
      setJsonError('')
      onChange('')
      return
    }
    const err = validateGeocercaString(t)
    if (err) {
      setJsonError(err)
      return
    }
    setJsonError('')
    onChange(canonicalGeocercaString(t))
  }

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-primary mb-1.5">
        Geocerca (mapa)
      </label>
      <p className="text-xs text-muted -mt-1 mb-2">
        Dibuje polígono, polilínea o marcador, o pegue un GeoJSON Feature: Polygon, MultiPolygon, Point,
        MultiPoint, LineString o MultiLineString.
      </p>
      <div
        className="rounded-lg border-2 border-primary/20 overflow-hidden z-0 min-h-[420px] h-[min(58vh,640px)]"
      >
        <MapContainer
          key={instanceKey}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer attribution={OSM_ATTRIB} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeomanInner value={value} onChange={onChange} />
        </MapContainer>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setJsonOpen((o) => !o)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          {jsonOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Editar JSON
        </button>
        {jsonOpen && (
          <>
            <textarea
              className={`mt-2 w-full min-h-[120px] px-4 py-2.5 rounded-lg border-2 bg-white text-dark text-sm font-mono
                focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all
                ${jsonError ? 'border-red-500' : 'border-primary/20'}`}
              value={jsonDraft}
              onChange={(e) => {
                setJsonDraft(e.target.value)
                if (jsonError) setJsonError('')
              }}
              onBlur={handleJsonBlur}
              placeholder='{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[-75,-9.2],[-74.5,-9.1]]}}'
              spellCheck={false}
            />
            {jsonError ? <p className="mt-1 text-sm text-red-600">{jsonError}</p> : null}
          </>
        )}
      </div>
    </div>
  )
}

export default GeocercaEditor
