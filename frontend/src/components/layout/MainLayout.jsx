import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProjectSelector from './ProjectSelector'
import { ProjectProvider } from '../../contexts/ProjectContext'

const MainLayout = () => {
  return (
    <ProjectProvider>
      <div className="min-h-screen flex bg-bg">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-bg border-b border-primary/10">
            <div className="flex-1" />
            <ProjectSelector />
          </header>
          <main className="flex-1">
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProjectProvider>
  )
}

export default MainLayout
