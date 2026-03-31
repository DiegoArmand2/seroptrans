import { useCallback, useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import '@geoman-io/leaflet-geoman-free'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { canonicalGeocercaString, validateGeocercaString } from '../../utils/geocerca'

/** Centro por defecto (Sudamérica); ajustable si el negocio concentra otra región */
const DEFAULT_CENTER = [-9.19, -75.0]
const DEFAULT_ZOOM = 5

const OSM_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

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
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
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

    const emitFromLayer = (layer) => {
      try {
        const gj = layer.toGeoJSON()
        const s = canonicalGeocercaString(JSON.stringify(gj))
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
      emitFromLayer(e.layer)
    }

    const onUpdate = (e) => {
      emitFromLayer(e.layer)
    }

    const onRemove = () => {
      if (programmaticRef.current) return
      lastAppliedRef.current = ''
      onChangeRef.current('')
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
          if (b.isValid()) map.fitBounds(b, { padding: [28, 28], maxZoom: 16 })
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
        Geocerca (polígono en mapa)
      </label>
      <p className="text-xs text-muted -mt-1 mb-2">
        Dibuje un polígono o pegue un GeoJSON Feature (Polygon / MultiPolygon).
      </p>
      <div
        className="rounded-lg border-2 border-primary/20 overflow-hidden z-0"
        style={{ height: 300 }}
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
              placeholder='{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[...]}}'
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
