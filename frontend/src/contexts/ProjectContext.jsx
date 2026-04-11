import { createContext, useContext, useState, useEffect } from 'react'
import { proyectosService } from '../services/proyectos.service'
import { useAuth } from '../hooks/useAuth'

const ProjectContext = createContext(null)

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth()
  const [proyectos, setProyectos] = useState([])
  const [selectedProyectoId, setSelectedProyectoId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = user?.usuario_id
    if (!uid) {
      setProyectos([])
      setSelectedProyectoId(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await proyectosService.list()
        if (cancelled) return
        const list = data || []
        setProyectos(list)
        setSelectedProyectoId((prev) => {
          if (prev && !list.some((p) => p.proyecto_id === prev)) return null
          return prev
        })
      } catch {
        if (!cancelled) setProyectos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.usuario_id])

  const value = {
    proyectos,
    selectedProyectoId,
    setSelectedProyectoId,
    loading,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
