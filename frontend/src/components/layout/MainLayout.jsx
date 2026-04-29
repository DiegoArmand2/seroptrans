import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import ProjectSelector from './ProjectSelector'
import { ProjectProvider } from '../../contexts/ProjectContext'

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'

const MainLayout = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isWideGridPage =
    location.pathname.startsWith('/horarios') ||
    location.pathname.startsWith('/turnos-personal') ||
    location.pathname.startsWith('/demanda-viajes')

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      setSidebarCollapsed(v === '1')
    } catch {
      setSidebarCollapsed(false)
    }
  }, [])

  const handleToggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen flex bg-bg">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={handleToggleSidebarCollapsed} />
        <div className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-bg border-b border-primary/10">
            <div className="flex-1" />
            <ProjectSelector />
          </header>
          <main className="flex-1">
            <div
              className={
                isWideGridPage
                  ? 'max-w-none w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8'
                  : 'max-w-7xl mx-auto p-6 lg:p-8'
              }
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProjectProvider>
  )
}

export default MainLayout
