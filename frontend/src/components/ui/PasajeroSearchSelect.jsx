import { useEffect, useRef, useState } from 'react'
import Spinner from './Spinner'
import { pasajerosService } from '../../services/pasajeros.service'

const DEFAULT_LIMIT = 25

const inputClassName = `
  w-full px-4 py-2.5 rounded-lg border-2 border-primary/20
  bg-white text-dark placeholder-muted
  focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none
  transition-all duration-200 ease-smooth
  disabled:opacity-50 disabled:cursor-not-allowed
`

function formatLabel(p) {
  if (!p) return ''
  const ced = p.cedula ? String(p.cedula) : '—'
  const nom = p.nombre ? String(p.nombre) : '—'
  return `${nom} (${ced})`
}

export default function PasajeroSearchSelect({
  label = 'Pasajero',
  proyectoId,
  value,
  onChange,
  disabled = false,
  placeholder = 'Buscar por nombre o cédula…',
  limit = DEFAULT_LIMIT,
  required = false,
}) {
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const effectiveProyectoId = (proyectoId || '').trim()
  const effectiveValue = (value || '').trim()
  const effectiveDisabled = disabled || !effectiveProyectoId

  useEffect(() => {
    const handleDown = (e) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadSelected() {
      setSelected(null)
      if (!effectiveProyectoId || !effectiveValue) {
        if (!cancelled) setText('')
        return
      }
      try {
        const { data } = await pasajerosService.get(effectiveValue)
        if (!cancelled && data) {
          setSelected(data)
          setText(formatLabel(data))
        }
      } catch {
        if (!cancelled) {
          setSelected(null)
          setText('')
        }
      }
    }
    loadSelected()
    return () => {
      cancelled = true
    }
  }, [effectiveProyectoId, effectiveValue])

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function run() {
      if (!open || effectiveDisabled) {
        if (!open) return
        setItems([])
        setError('')
        return
      }
      setLoading(true)
      setError('')
      try {
        const { data } = await pasajerosService.paged({
          proyecto_id: effectiveProyectoId,
          q: text.trim() || undefined,
          skip: 0,
          limit,
        })
        if (cancelled) return
        setItems(Array.isArray(data?.items) ? data.items : [])
      } catch {
        if (cancelled) return
        setItems([])
        setError('No se pudo cargar la lista de pasajeros.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    timer = setTimeout(run, 250)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [open, effectiveProyectoId, effectiveDisabled, text, limit])

  const handlePick = (p) => {
    setSelected(p)
    setText(formatLabel(p))
    setOpen(false)
    onChange?.(p)
    inputRef.current?.blur()
  }

  const handleInputChange = (e) => {
    const v = e.target.value
    setText(v)
    if (!open) setOpen(true)
    if (selected && v !== formatLabel(selected)) {
      setSelected(null)
      onChange?.(null)
    }
    if (!v.trim()) {
      setSelected(null)
      onChange?.(null)
    }
  }

  const handleFocus = () => {
    if (effectiveDisabled) return
    setOpen(true)
  }

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-primary mb-1.5" htmlFor={`pasajero-combo-${label}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={`pasajero-combo-${label}`}
          type="text"
          autoComplete="off"
          className={inputClassName}
          value={text}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={effectiveDisabled}
          placeholder={effectiveDisabled ? 'Seleccione proyecto primero' : placeholder}
          aria-expanded={open}
          aria-controls={`pasajero-listbox-${label}`}
          aria-autocomplete="list"
          aria-required={required}
          role="combobox"
        />

        {open && !effectiveDisabled && (
          <div
            id={`pasajero-listbox-${label}`}
            className="absolute z-50 mt-1 w-full rounded-lg border border-primary/15 bg-white shadow-card-hover"
            role="listbox"
          >
            <div className="px-3 py-2 border-b border-primary/10 text-[11px] text-muted">
              Escriba para buscar por <span className="font-medium">nombre</span> o <span className="font-medium">cédula</span>.
            </div>
            {loading && (
              <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted">
                <Spinner size="sm" />
                <span>Cargando…</span>
              </div>
            )}
            {!loading && error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
            <ul className="max-h-72 overflow-auto py-1">
              {!loading && !error && items.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">Sin resultados</li>
              )}
              {!loading &&
                items.map((p) => {
                  const isActive = selected?.pasajero_id === p.pasajero_id
                  return (
                    <li key={p.pasajero_id}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2 hover:bg-primary/5 ${isActive ? 'bg-primary/10' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePick(p)}
                        role="option"
                        aria-selected={isActive}
                        title={formatLabel(p)}
                      >
                        <div className="text-sm text-dark truncate">{p.nombre}</div>
                        <div className="text-xs text-muted font-mono truncate">{p.cedula || '—'}</div>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
