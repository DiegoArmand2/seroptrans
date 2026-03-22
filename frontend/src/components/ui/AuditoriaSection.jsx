import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const AuditoriaSection = ({ data, showWhenEmpty = true, className = '' }) => {
  const [expanded, setExpanded] = useState(true)
  const hasData =
    data?.fecha_creacion ||
    data?.creado_por_nombre ||
    data?.fecha_actualizacion ||
    data?.actualizado_por_nombre

  if (!data) return null
  if (!showWhenEmpty && !hasData) return null

  return (
    <div className={`border-t border-primary/20 pt-4 mt-4 ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left text-primary font-medium hover:opacity-80 transition-opacity"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-accent" />
        ) : (
          <ChevronRight className="w-4 h-4 text-accent" />
        )}
        Auditoría
      </button>
      {expanded && (
        <>
          <div className="mt-2 h-px bg-primary/20" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted mb-0.5">Fecha creación</p>
              <p className="text-sm font-medium text-dark">
                {formatDate(data.fecha_creacion)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Creado por</p>
              <p className="text-sm font-medium text-dark">
                {data.creado_por_nombre || data.creado_por || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Actualizado</p>
              <p className="text-sm font-medium text-dark">
                {formatDate(data.fecha_actualizacion)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Actualizado por</p>
              <p className="text-sm font-medium text-dark">
                {data.actualizado_por_nombre || data.actualizado_por || '—'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AuditoriaSection
