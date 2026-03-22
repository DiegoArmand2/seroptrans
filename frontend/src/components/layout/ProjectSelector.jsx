import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2 } from 'lucide-react'
import { useProject } from '../../contexts/ProjectContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'

const ProjectSelector = () => {
  const { user } = useAuth()
  const { proyectos, selectedProyectoId, setSelectedProyectoId, loading } = useProject()
  const { hasVentana } = usePermissions()

  const isAdmin =
    user?.proyectos === null || (Array.isArray(user?.roles) && user.roles.includes('Administrador'))
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const hasDatosMaestros =
    hasVentana('proyecto') ||
    hasVentana('turno') ||
    hasVentana('ruta') ||
    hasVentana('conductor') ||
    hasVentana('vehiculo') ||
    hasVentana('pasajero')

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (loading || isAdmin) return
    if (proyectos.length >= 1 && !selectedProyectoId) {
      setSelectedProyectoId(proyectos[0].proyecto_id)
    }
  }, [loading, isAdmin, proyectos, selectedProyectoId, setSelectedProyectoId])

  if (!hasDatosMaestros || loading) return null

  const selectedProyecto = proyectos.find((p) => p.proyecto_id === selectedProyectoId)
  const label = selectedProyecto
    ? selectedProyecto.nombre
    : isAdmin
      ? 'Todos los proyectos'
      : proyectos.length > 0
        ? 'Seleccione un proyecto'
        : 'Sin proyectos'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary/20 bg-white hover:border-accent/50 transition-colors text-primary font-medium"
      >
        <Building2 className="w-5 h-5 text-accent" />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 py-2 rounded-lg border-2 border-primary/20 bg-white shadow-lg z-50">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setSelectedProyectoId(null)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left hover:bg-primary/5 ${
                !selectedProyectoId ? 'bg-accent/10 text-accent font-medium' : ''
              }`}
            >
              Todos los proyectos
            </button>
          )}
          {proyectos.map((p) => (
            <button
              key={p.proyecto_id}
              type="button"
              onClick={() => {
                setSelectedProyectoId(p.proyecto_id)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left hover:bg-primary/5 truncate ${
                selectedProyectoId === p.proyecto_id ? 'bg-accent/10 text-accent font-medium' : ''
              }`}
            >
              {p.nombre}
            </button>
          ))}
          {proyectos.length === 0 && (
            <p className="px-4 py-2 text-sm text-muted">Sin proyectos</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectSelector
