import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { rolesService } from '../services/roles.service'
import { proyectosService } from '../services/proyectos.service'
import { getErrorMessage } from '../utils/apiError'

const Permisos = () => {
  const [roles, setRoles] = useState([])
  const [selectedRol, setSelectedRol] = useState(null)
  const [ventanas, setVentanas] = useState([])
  const [procesos, setProcesos] = useState([])
  const [proyectosPermiso, setProyectosPermiso] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVentana, setModalVentana] = useState(false)
  const [modalProceso, setModalProceso] = useState(false)
  const [modalProyecto, setModalProyecto] = useState(false)
  const [newVentana, setNewVentana] = useState('')
  const [newProceso, setNewProceso] = useState('')
  const [newProyectoId, setNewProyectoId] = useState('')

  const loadRoles = async () => {
    try {
      const { data } = await rolesService.list()
      setRoles(data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadPermisos = async () => {
    if (!selectedRol) return
    setLoading(true)
    try {
      const [vRes, pRes, proyRes, proysListRes] = await Promise.all([
        rolesService.getVentanas(selectedRol.rol_id),
        rolesService.getProcesos(selectedRol.rol_id),
        rolesService.getProyectos(selectedRol.rol_id),
        proyectosService.list(),
      ])
      setVentanas(vRes.data)
      setProcesos(pRes.data)
      setProyectosPermiso(proyRes.data)
      setProyectos(proysListRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  useEffect(() => {
    loadPermisos()
  }, [selectedRol])

  const addVentana = async (e) => {
    e.preventDefault()
    if (!selectedRol || !newVentana.trim()) return
    try {
      await rolesService.addVentana(selectedRol.rol_id, newVentana.trim())
      setNewVentana('')
      setModalVentana(false)
      loadPermisos()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al agregar')
    }
  }

  const addProceso = async (e) => {
    e.preventDefault()
    if (!selectedRol || !newProceso.trim()) return
    try {
      await rolesService.addProceso(selectedRol.rol_id, newProceso.trim())
      setNewProceso('')
      setModalProceso(false)
      loadPermisos()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al agregar')
    }
  }

  const removeVentana = async (rolwinId) => {
    if (!confirm('¿Eliminar este permiso?')) return
    try {
      await rolesService.removeVentana(selectedRol.rol_id, rolwinId)
      loadPermisos()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const removeProceso = async (rolproId) => {
    if (!confirm('¿Eliminar este permiso?')) return
    try {
      await rolesService.removeProceso(selectedRol.rol_id, rolproId)
      loadPermisos()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const addProyecto = async (e) => {
    e.preventDefault()
    if (!selectedRol || !newProyectoId) return
    try {
      await rolesService.addProyecto(selectedRol.rol_id, newProyectoId)
      setNewProyectoId('')
      setModalProyecto(false)
      loadPermisos()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al agregar')
    }
  }

  const removeProyecto = async (rolproyId) => {
    if (!confirm('¿Eliminar este permiso?')) return
    try {
      await rolesService.removeProyecto(selectedRol.rol_id, rolproyId)
      loadPermisos()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const isAdmin = selectedRol?.nombre === 'Administrador'

  return (
    <>
      <PageHeader
        title="Permisos"
        description="Configurar permisos por ventana y proceso para cada rol"
      />

      <div className="mb-6">
        <Card>
          <label className="block text-sm font-medium text-primary mb-2">
            Seleccionar rol
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg border-2 border-primary/20 bg-white text-dark focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
            value={selectedRol?.rol_id || ''}
            onChange={(e) => {
              const r = roles.find((x) => x.rol_id === e.target.value)
              setSelectedRol(r || null)
            }}
          >
            <option value="">Seleccione un rol</option>
            {roles.map((r) => (
              <option key={r.rol_id} value={r.rol_id}>{r.nombre}</option>
            ))}
          </select>
        </Card>
      </div>

      {selectedRol && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-primary">
                Permisos por ventana
              </h3>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setModalVentana(true)}
              >
                Agregar
              </Button>
            </div>
            {loading ? (
              <Spinner />
            ) : (
              <ul className="space-y-2">
                {ventanas.map((v) => (
                  <li
                    key={v.rolwin_id}
                    className="flex items-center justify-between py-2 border-b border-primary/5 last:border-0"
                  >
                    <span className="capitalize">{v.ventana}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-red-600" />}
                      onClick={() => removeVentana(v.rolwin_id)}
                    />
                  </li>
                ))}
                {ventanas.length === 0 && (
                  <p className="text-muted text-sm">Sin permisos de ventana</p>
                )}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-primary">
                Permisos por proceso
              </h3>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setModalProceso(true)}
              >
                Agregar
              </Button>
            </div>
            {loading ? (
              <Spinner />
            ) : (
              <ul className="space-y-2">
                {procesos.map((p) => (
                  <li
                    key={p.rolpro_id}
                    className="flex items-center justify-between py-2 border-b border-primary/5 last:border-0"
                  >
                    <span className="capitalize">{p.proceso}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-red-600" />}
                      onClick={() => removeProceso(p.rolpro_id)}
                    />
                  </li>
                ))}
                {procesos.length === 0 && (
                  <p className="text-muted text-sm">Sin permisos de proceso</p>
                )}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-primary">
                Permisos por proyecto
              </h3>
              {!isAdmin && (
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setModalProyecto(true)}
                >
                  Agregar
                </Button>
              )}
            </div>
            {loading ? (
              <Spinner />
            ) : isAdmin ? (
              <p className="text-muted text-sm py-2">
                Acceso a todos los proyectos
              </p>
            ) : (
              <ul className="space-y-2">
                {proyectosPermiso.map((p) => {
                  const proy = proyectos.find((x) => x.proyecto_id === p.proyecto_id)
                  return (
                    <li
                      key={p.rolproy_id}
                      className="flex items-center justify-between py-2 border-b border-primary/5 last:border-0"
                    >
                      <span>{proy?.nombre || p.proyecto_id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => removeProyecto(p.rolproy_id)}
                      />
                    </li>
                  )
                })}
                {proyectosPermiso.length === 0 && (
                  <p className="text-muted text-sm">Sin permisos de proyecto</p>
                )}
              </ul>
            )}
          </Card>
        </div>
      )}

      <Modal
        isOpen={modalVentana}
        onClose={() => setModalVentana(false)}
        title="Agregar permiso de ventana"
      >
        <form onSubmit={addVentana} className="space-y-4">
          <Input
            label="Ventana"
            value={newVentana}
            onChange={(e) => setNewVentana(e.target.value)}
            placeholder="Ej: dashboard, usuarios"
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalVentana(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent">
              Agregar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalProceso}
        onClose={() => setModalProceso(false)}
        title="Agregar permiso de proceso"
      >
        <form onSubmit={addProceso} className="space-y-4">
          <Input
            label="Proceso"
            value={newProceso}
            onChange={(e) => setNewProceso(e.target.value)}
            placeholder="Ej: crear, editar, eliminar"
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalProceso(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent">
              Agregar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalProyecto}
        onClose={() => setModalProyecto(false)}
        title="Agregar permiso de proyecto"
      >
        <form onSubmit={addProyecto} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectos
              .filter((p) => !proyectosPermiso.some((x) => x.proyecto_id === p.proyecto_id))
              .map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={newProyectoId}
            onChange={(e) => setNewProyectoId(e.target.value)}
            placeholder="Seleccione un proyecto"
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalProyecto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent">
              Agregar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default Permisos
