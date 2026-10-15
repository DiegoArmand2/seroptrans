import { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

// Vite no resuelve las URLs por defecto de Leaflet; sin esto el marcador se ve roto.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [-0.1807, -78.4678]
const DEFAULT_ZOOM = 12
const MARKER_ZOOM = 15
const OSM_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function parseCoord(s) {
  const t = String(s ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/,/g, '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function formatCoord(n) {
  return String(Number(n.toFixed(7)))
}

function useDebouncedPosition(position, delayMs) {
  const [debounced, setDebounced] = useState(position)

  useEffect(() => {
    if (!position) {
      setDebounced(null)
      return undefined
    }
    const t = setTimeout(() => setDebounced(position), delayMs)
    return () => clearTimeout(t)
  }, [position, delayMs])

  return debounced
}

function InvalidateSizeOnMount() {
  const map = useMap()
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 50)
    const t2 = setTimeout(() => map.invalidateSize(), 250)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [map])
  return null
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function SyncView({ position }) {
  const map = useMap()
  const lastKey = useRef('')

  useEffect(() => {
    if (!position) return
    const key = `${position[0]},${position[1]}`
    if (key === lastKey.current) return
    lastKey.current = key
    map.setView(position, Math.max(map.getZoom(), MARKER_ZOOM), { animate: true })
  }, [map, position])

  return null
}

/**
 * Mapa OSM con marcador arrastrable sincronizado con lat/lng (strings del form).
 * Props: lat, lng (string), onChange({ lat, lng })
 */
export default function LatLngMapPicker({ lat, lng, onChange }) {
  const latN = parseCoord(lat)
  const lngN = parseCoord(lng)
  const hasPosition = latN != null && lngN != null
  const position = useMemo(
    () => (hasPosition ? [latN, lngN] : null),
    [hasPosition, latN, lngN]
  )

  const emit = (la, ln) => {
    onChange?.({ lat: formatCoord(la), lng: formatCoord(ln) })
  }

  const debouncedPosition = useDebouncedPosition(position, 300)
  const center = position || DEFAULT_CENTER
  const zoom = position ? MARKER_ZOOM : DEFAULT_ZOOM

  return (
    <div className="w-full space-y-2">
      <p className="text-xs text-muted">
        Clic o arrastre el marcador para fijar la ubicación.
      </p>
      <div className="rounded-lg border-2 border-primary/20 overflow-hidden z-0 h-[260px]">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer attribution={OSM_ATTRIB} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <InvalidateSizeOnMount />
          <MapClickHandler onPick={emit} />
          {debouncedPosition && <SyncView position={debouncedPosition} />}
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat: la, lng: ln } = e.target.getLatLng()
                  emit(la, ln)
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
