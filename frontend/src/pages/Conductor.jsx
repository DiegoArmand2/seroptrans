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
import { conductoresService } from '../services/conductores.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const Conductor = () => {
  const { selectedProyectoId, proyectos } = useProject()
  const [conductores, setConductores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    disponible: true,
    activo: true,
    proyecto_id: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const { data } = await conductoresService.list(params)
      setConductores(data || [])
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
    setForm({ nombre: '', disponible: true, activo: true, proyecto_id: selectedProyectoId || '' })
    setModalOpen(true)
  }

  const openEdit = async (c) => {
    setEditing(c)
    const proyectoId = c.proyecto_ids?.[0] || selectedProyectoId || ''
    setForm({
      nombre: c.nombre,
      disponible: c.disponible ?? true,
      activo: c.activo ?? true,
      proyecto_id: proyectoId,
    })
    setModalOpen(true)
    try {
      const { data } = await conductoresService.get(c.conductor_id)
      setEditingFull(data)
    } catch {
      setEditingFull(c)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const proyectoId = form.proyecto_id || selectedProyectoId
    try {
      if (editing) {
        await conductoresService.update(editing.conductor_id, { nombre: form.nombre, disponible: form.disponible, activo: form.activo })
        if (proyectoId && !editing.proyecto_ids?.includes(proyectoId)) {
          await conductoresService.assignProyecto(editing.conductor_id, proyectoId)
        }
      } else {
        const { data } = await conductoresService.create({ nombre: form.nombre, disponible: form.disponible, activo: form.activo })
        if (proyectoId && data?.conductor_id) {
          await conductoresService.assignProyecto(data.conductor_id, proyectoId)
        }
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este conductor?')) return
    try {
      await conductoresService.delete(id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

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
        title="Conductor"
        description="Gestión de conductores (choferes)"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo conductor
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Estado</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conductores.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay conductores en este proyecto' : 'No hay conductores'}
                  </td>
                </tr>
              )}
              {conductores.map((c) => (
                <tr key={c.conductor_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4 text-muted">{c.proyecto_nombres?.length ? c.proyecto_nombres.join(', ') : '—'}</td>
                  <td className="py-3 px-4">{c.nombre}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        c.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'
                      }`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {c.disponible && ' • Disponible'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={() => openEdit(c)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleDelete(c.conductor_id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar conductor' : 'Nuevo conductor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectoOptions}
            value={form.proyecto_id || selectedProyectoId}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
            placeholder="Seleccionar proyecto"
            disabled={!!editing || !!selectedProyectoId}
            required={!editing}
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="disponible"
              checked={form.disponible}
              onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="disponible" className="text-sm font-medium text-primary">
              Disponible
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={form.activo}
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

export default Conductor
