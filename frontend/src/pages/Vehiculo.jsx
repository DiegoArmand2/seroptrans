import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { vehiculosService } from '../services/vehiculos.service'
import { conductoresService } from '../services/conductores.service'
import { rutasService } from '../services/rutas.service'
import { tiposVehiculoService } from '../services/tiposVehiculo.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const Vehiculo = () => {
  const { selectedProyectoId, proyectos } = useProject()
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [rutas, setRutas] = useState([])
  const [tiposVehiculo, setTiposVehiculo] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    placa: '',
    capacidad: 16,
    conductor_id: '',
    ruta_id: '',
    tipo_vehiculo_id: '',
    proyecto_id: '',
    activo: true,
  })

  const loadVehiculos = async () => {
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const { data } = await vehiculosService.list(params)
      setVehiculos(data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadAux = async (proyectoId) => {
    if (!proyectoId) return
    try {
      const [cRes, rRes, tvRes] = await Promise.all([
        conductoresService.list({ proyecto_id: proyectoId }),
        rutasService.list({ proyecto_id: proyectoId }),
        tiposVehiculoService.list({ proyecto_id: proyectoId }),
      ])
      setConductores(cRes.data || [])
      setRutas(rRes.data || [])
      setTiposVehiculo(tvRes.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadVehiculos(), selectedProyectoId ? loadAux(selectedProyectoId) : Promise.resolve()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedProyectoId])

  // Cargar conductores/rutas cuando admin cambia proyecto en el formulario
  useEffect(() => {
    if (modalOpen && form.proyecto_id && !selectedProyectoId) {
      loadAux(form.proyecto_id)
    }
  }, [form.proyecto_id, modalOpen, selectedProyectoId])

  const openCreate = () => {
    setEditing(null)
    setEditingFull(null)
    setForm({
      placa: '',
      capacidad: 16,
      conductor_id: '',
      ruta_id: '',
      tipo_vehiculo_id: '',
      proyecto_id: selectedProyectoId || '',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = async (v) => {
    setEditing(v)
    setForm({
      placa: v.placa,
      capacidad: v.capacidad ?? 16,
      conductor_id: v.conductor_id || '',
      ruta_id: v.ruta_id || '',
      tipo_vehiculo_id: v.tipo_vehiculo_id || '',
      proyecto_id: v.proyecto_id || selectedProyectoId || '',
      activo: v.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await vehiculosService.get(v.vehiculo_id)
      setEditingFull(data)
    } catch {
      setEditingFull(v)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const proyectoId = form.proyecto_id || selectedProyectoId
    if (!proyectoId) {
      alert('Seleccione un proyecto')
      return
    }
    try {
      const payload = {
        placa: form.placa,
        capacidad: form.capacidad,
        conductor_id: form.conductor_id || null,
        ruta_id: form.ruta_id || null,
        tipo_vehiculo_id: form.tipo_vehiculo_id || null,
        proyecto_id: proyectoId,
        activo: form.activo ?? true,
      }
      if (editing) {
        await vehiculosService.update(editing.vehiculo_id, payload)
      } else {
        await vehiculosService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este vehículo?')) return
    try {
      await vehiculosService.delete(id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const conductorOptions = conductores.map((c) => ({ value: c.conductor_id, label: c.nombre }))
  const rutaOptions = rutas.map((r) => ({ value: r.ruta_id, label: r.nombre }))
  const tipoVehiculoOptions = tiposVehiculo.map((tv) => ({
    value: tv.tipo_vehiculo_id,
    label: `${tv.identificador} — ${tv.nombre}`,
  }))
  const proyectoOptions = proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Vehículo"
        description={
          selectedProyectoId
            ? 'Gestión de vehículos con placa, capacidad, tipo, conductor y ruta'
            : 'Mostrando todos los vehículos. Al crear, seleccione el proyecto en el formulario.'
        }
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo vehículo
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Placa</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Capacidad</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Conductor</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Ruta</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Tipo de vehículo</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Estado</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay vehículos en este proyecto' : 'No hay vehículos. Haga clic en Nuevo vehículo para crear uno.'}
                  </td>
                </tr>
              )}
              {vehiculos.map((v) => (
                <tr key={v.vehiculo_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectos.find((p) => p.proyecto_id === v.proyecto_id)?.nombre || '—'}</td>
                  <td className="py-3 px-4 font-mono">{v.placa}</td>
                  <td className="py-3 px-4">{v.capacidad}</td>
                  <td className="py-3 px-4">{v.conductor_nombre || '—'}</td>
                  <td className="py-3 px-4">{v.ruta_nombre || '—'}</td>
                  <td className="py-3 px-4 text-muted">{v.tipo_vehiculo_nombre || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        v.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'
                      }`}
                    >
                      {v.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={() => openEdit(v)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleDelete(v.vehiculo_id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar vehículo' : 'Nuevo vehículo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectoOptions}
            value={form.proyecto_id || selectedProyectoId}
            onChange={(e) =>
              setForm({ ...form, proyecto_id: e.target.value, ruta_id: '', conductor_id: '', tipo_vehiculo_id: '' })
            }
            placeholder="Seleccionar proyecto"
            disabled={!!editing || !!selectedProyectoId}
            required
          />
          <Input
            label="Placa"
            value={form.placa}
            onChange={(e) => setForm({ ...form, placa: e.target.value })}
            required
          />
          <Input
            label="Capacidad"
            type="number"
            min={1}
            value={form.capacidad}
            onChange={(e) => setForm({ ...form, capacidad: parseInt(e.target.value) || 16 })}
          />
          <Select
            label="Conductor"
            options={conductorOptions}
            value={form.conductor_id}
            onChange={(e) => setForm({ ...form, conductor_id: e.target.value })}
            placeholder="Seleccionar conductor"
          />
          <Select
            label="Ruta"
            options={rutaOptions}
            value={form.ruta_id}
            onChange={(e) => setForm({ ...form, ruta_id: e.target.value })}
            placeholder="Seleccionar ruta (opcional)"
          />
          <Select
            label="Tipo de vehículo"
            options={tipoVehiculoOptions}
            value={form.tipo_vehiculo_id}
            onChange={(e) => setForm({ ...form, tipo_vehiculo_id: e.target.value })}
            placeholder="Seleccionar tipo (opcional)"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={form.activo ?? true}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="rounded w-4 h-4 accent-primary"
            />
            <label htmlFor="activo" className="text-sm font-medium text-primary">
              Activo
            </label>
          </div>
          <AuditoriaSection data={editingFull} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent">
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default Vehiculo
