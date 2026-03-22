import { createContext, useContext, useState, useEffect } from 'react'
import { proyectosService } from '../services/proyectos.service'

const ProjectContext = createContext(null)

export const ProjectProvider = ({ children }) => {
  const [proyectos, setProyectos] = useState([])
  const [selectedProyectoId, setSelectedProyectoId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await proyectosService.list()
        setProyectos(data || [])
        setSelectedProyectoId((prev) => {
          if (prev && !data?.some((p) => p.proyecto_id === prev)) return null
          return prev
        })
      } catch {
        setProyectos([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
