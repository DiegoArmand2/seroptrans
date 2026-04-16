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
import { tiposVehiculoService } from '../services/tiposVehiculo.service'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const TipoVehiculo = () => {
  const { selectedProyectoId } = useProject()
  const [tipos, setTipos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    proyecto_id: '',
    identificador: '',
    nombre: '',
    descripcion: '',
    activo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [tRes, pRes] = await Promise.all([tiposVehiculoService.list(params), proyectosService.list()])
      setTipos(tRes.data)
      setProyectos(pRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedProyectoId])

  const openCreate = () => {
    setEditing(null)
    setEditingFull(null)
    setForm({
      proyecto_id: selectedProyectoId || '',
      identificador: '',
      nombre: '',
      descripcion: '',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = async (t) => {
    setEditing(t)
    setForm({
      proyecto_id: t.proyecto_id,
      identificador: t.identificador,
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      activo: t.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await tiposVehiculoService.get(t.tipo_vehiculo_id)
      setEditingFull(data)
    } catch {
      setEditingFull(t)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await tiposVehiculoService.update(editing.tipo_vehiculo_id, {
          identificador: form.identificador,
          nombre: form.nombre,
          descripcion: form.descripcion,
          activo: form.activo,
        })
      } else {
        await tiposVehiculoService.create(form)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este tipo de vehículo?')) return
    try {
      await tiposVehiculoService.delete(id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

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
        title="Tipo de vehículo"
        description="Catálogo de tipos de vehículo por proyecto"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo tipo
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Identificador</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Descripción</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Estado</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay tipos en este proyecto' : 'No hay tipos de vehículo'}
                  </td>
                </tr>
              )}
              {tipos.map((t) => (
                <tr key={t.tipo_vehiculo_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectos.find((p) => p.proyecto_id === t.proyecto_id)?.nombre || '-'}</td>
                  <td className="py-3 px-4 font-mono text-sm">{t.identificador}</td>
                  <td className="py-3 px-4">{t.nombre}</td>
                  <td className="py-3 px-4 text-muted">{t.descripcion || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        t.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'
                      }`}
                    >
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(t)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleDelete(t.tipo_vehiculo_id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar tipo de vehículo' : 'Nuevo tipo de vehículo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={form.proyecto_id || selectedProyectoId}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
            disabled={!!editing || !!selectedProyectoId}
            required
          />
          <Input
            label="Identificador"
            value={form.identificador}
            onChange={(e) => setForm({ ...form, identificador: e.target.value })}
            placeholder="Ej. BUS, VAN"
            required
          />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo-tv"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="rounded w-4 h-4 accent-primary"
            />
            <label htmlFor="activo-tv" className="text-sm font-medium text-primary">
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

export default TipoVehiculo
