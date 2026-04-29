import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
  Database,
  Building2,
  Clock,
  UserCircle,
  Tags,
  Car,
  Bus,
  Route,
  FileSpreadsheet,
  ClipboardList,
  Truck,
  MapPinned,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', ventana: 'dashboard' },
  {
    id: 'administracion',
    label: 'Administración',
    icon: Settings,
    children: [
      { path: '/usuarios', icon: Users, label: 'Usuarios', ventana: 'usuarios' },
      { path: '/roles', icon: Shield, label: 'Roles', ventana: 'roles' },
      { path: '/permisos', icon: Key, label: 'Permisos', ventana: 'permisos' },
    ],
  },
  {
    id: 'datos-maestros',
    label: 'Datos Maestros',
    icon: Database,
    children: [
      { path: '/proyecto', icon: Building2, label: 'Proyecto', ventana: 'proyecto' },
      { path: '/turno', icon: Clock, label: 'Turno', ventana: 'turno' },
      { path: '/tipo-pasajero', icon: Tags, label: 'Tipo de pasajero', ventana: 'tipo_pasajero' },
      { path: '/tipo-vehiculo', icon: Tags, label: 'Tipo de vehículo', ventana: 'tipo_vehiculo' },
      { path: '/pasajero', icon: UserCircle, label: 'Pasajero', ventana: 'pasajero' },
      { path: '/conductor', icon: Car, label: 'Conductor', ventana: 'conductor' },
      { path: '/vehiculo', icon: Bus, label: 'Vehículo', ventana: 'vehiculo' },
      { path: '/ruta', icon: Route, label: 'Ruta', ventana: 'ruta' },
      { path: '/horarios', icon: FileSpreadsheet, label: 'Horarios', ventana: 'horarios' },
      { path: '/turnos-personal', icon: ClipboardList, label: 'Turnos Personal', ventana: 'turnos_personal' },
    ],
  },
  {
    id: 'logistica',
    label: 'Logística',
    icon: Truck,
    children: [
      { path: '/demanda-viajes', icon: MapPinned, label: 'Demanda Viajes', ventana: 'demanda_viajes' },
    ],
  },
]

const Sidebar = ({ collapsed = false, onToggleCollapsed }) => {
  const [open, setOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({
    administracion: true,
    'datos-maestros': true,
    logistica: true,
  })
  const { user, logout } = useAuth()
  const { hasVentana } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }))
  }

  const isMenuActive = (children) =>
    children?.some((c) => c.path && location.pathname.startsWith(c.path))

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-dark/50 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full bg-primary text-white
          transform transition-transform duration-200 ease-smooth
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-20 w-64' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h1 className={`text-xl font-heading font-bold ${collapsed ? 'lg:hidden' : ''}`}>SeropTrans</h1>
              <button
                type="button"
                className="hidden lg:inline-flex p-2 rounded-lg hover:bg-white/10"
                onClick={onToggleCollapsed}
                aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-90" />}
              </button>
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm text-white/70 mt-1 ${collapsed ? 'lg:hidden' : ''}`}>Gestión de Transporte</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                if (item.path) {
                  if (!hasVentana(item.ventana)) return null
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setOpen(false)}
                        title={item.label}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                            isActive ? 'bg-accent' : 'hover:bg-white/10'
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </NavLink>
                    </li>
                  )
                }
                if (item.children !== undefined) {
                  const visibleChildren = item.children.filter((c) => {
                    if (!c.ventana) return true
                    return hasVentana(c.ventana)
                  })
                  const expanded =
                    expandedMenus[item.id] ?? isMenuActive(item.children)
                  const hasContent = visibleChildren.length > 0
                  return (
                    <li key={item.id || item.label}>
                      <button
                        type="button"
                        onClick={() => {
                          if (collapsed) {
                            onToggleCollapsed?.()
                            return
                          }
                          toggleMenu(item.id)
                        }}
                        title={item.label}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-white/10 ${
                          isMenuActive(item.children) ? 'bg-white/5' : ''
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                        {!collapsed &&
                          (expanded ? (
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          ) : (
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          ))}
                      </button>
                      {!collapsed && expanded && hasContent && (
                        <ul className="mt-1 ml-4 pl-4 border-l border-white/20 space-y-1">
                          {visibleChildren.map((child) => (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                onClick={() => setOpen(false)}
                                title={child.label}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                                    isActive
                                      ? 'bg-accent text-white'
                                      : 'hover:bg-white/10 text-white/90'
                                  }`
                                }
                              >
                                <child.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                                <span className={collapsed ? 'lg:hidden' : ''}>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                }
                return null
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 mb-2" title={user?.nombre_usuario || ''}>
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-heading font-semibold">
                {user?.nombre_usuario?.charAt(0) || '?'}
              </div>
              <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                <p className="font-medium truncate">{user?.nombre_usuario}</p>
                <p className="text-sm text-white/70 truncate">{user?.login}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-200 hover:text-red-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className={collapsed ? 'lg:hidden' : ''}>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
