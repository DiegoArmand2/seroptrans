import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * MultiSelect - combo desplegable multiselección con chips
 * - Chips para items seleccionados con X para quitar
 * - Campo de búsqueda/filtro
 * - Desplegable con opciones (seleccionadas en negrita)
 */
const MultiSelect = ({
  label,
  options = [],
  value = [],
  onChange,
  getOptionId = (o) => o?.id,
  getOptionLabel = (o) => o?.label ?? o?.nombre ?? String(o),
  placeholder = 'Buscar...',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const valueSet = new Set(value)
  const filtered = search.trim()
    ? options.filter((o) =>
        getOptionLabel(o).toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectOption = (opt) => {
    const id = getOptionId(opt)
    const next = valueSet.has(id)
      ? value.filter((v) => v !== id)
      : [...value, id]
    onChange(next)
  }

  const removeFromValue = (id) => {
    onChange(value.filter((v) => v !== id))
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setHighlightedIndex(-1)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, -1))
      return
    }
    if (e.key === 'Enter' && highlightedIndex >= 0 && filtered[highlightedIndex]) {
      e.preventDefault()
      selectOption(filtered[highlightedIndex])
      return
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedItems = options.filter((o) => valueSet.has(getOptionId(o)))

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-primary mb-2">
          {label}
        </label>
      )}
      <div
        className={`
          w-full min-h-[52px] px-3 py-2 rounded-lg border-2 border-primary/20
          bg-white text-dark
          focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20
          transition-all duration-200 ease-smooth
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Chips de items seleccionados */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedItems.map((o) => {
              const id = getOptionId(o)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-primary text-sm font-medium"
                >
                  {getOptionLabel(o)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromValue(id)
                    }}
                    className="p-0.5 rounded hover:bg-accent/20 text-muted hover:text-primary transition-colors"
                    aria-label="Quitar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
        {/* Campo de búsqueda */}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedItems.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="w-full min-w-[120px] px-0 py-0.5 border-0 bg-transparent text-dark placeholder-muted focus:outline-none focus:ring-0"
        />
      </div>

      {/* Desplegable */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border-2 border-primary/20 bg-white shadow-card py-2"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">Sin resultados</p>
          ) : (
            filtered.map((opt, i) => {
              const id = getOptionId(opt)
              const selected = valueSet.has(id)
              const highlighted = i === highlightedIndex
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectOption(opt)}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm transition-colors
                    ${highlighted ? 'bg-primary/10' : 'hover:bg-primary/5'}
                    ${selected ? 'font-bold text-primary' : 'font-normal text-dark'}
                  `}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  {getOptionLabel(opt)}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default MultiSelect
