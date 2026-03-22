import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const Proyecto = () => {
  const { selectedProyectoId } = useProject()
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    parametros_operativos: '',
    activo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await proyectosService.list()
      setProyectos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setEditingFull(null)
    setForm({ nombre: '', descripcion: '', parametros_operativos: '', activo: true })
    setModalOpen(true)
  }

  const openEdit = async (p) => {
    setEditing(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      parametros_operativos: p.parametros_operativos || '',
      activo: p.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await proyectosService.get(p.proyecto_id)
      setEditingFull(data)
    } catch {
      setEditingFull(p)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (editing) {
        await proyectosService.update(editing.proyecto_id, payload)
      } else {
        await proyectosService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    try {
      await proyectosService.delete(id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const proyectosFiltrados = selectedProyectoId
    ? proyectos.filter((p) => p.proyecto_id === selectedProyectoId)
    : proyectos

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
        title="Proyecto"
        description={
          selectedProyectoId
            ? 'Proyecto seleccionado'
            : 'Gestión de proyectos de transporte'
        }
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo proyecto
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectosFiltrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted">
            {selectedProyectoId
              ? 'No hay proyectos que coincidan con el filtro'
              : 'No hay proyectos'}
          </div>
        )}
        {proyectosFiltrados.map((p) => (
          <Card key={p.proyecto_id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold text-primary text-lg">{p.nombre}</h3>
                <p className="text-sm text-muted mt-1">{p.descripcion || '—'}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${p.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'}`}>
                  {p.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(p)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={() => handleDelete(p.proyecto_id)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <Input label="Parámetros operativos (JSON)" value={form.parametros_operativos} onChange={(e) => setForm({ ...form, parametros_operativos: e.target.value })} placeholder='{"ocupacion_maxima": 13}' />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="rounded w-4 h-4 accent-primary" />
            <label htmlFor="activo" className="text-sm font-medium text-primary">Activo</label>
          </div>
          <AuditoriaSection data={editingFull} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="accent">{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default Proyecto
