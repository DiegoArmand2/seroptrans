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
import { rutasService } from '../services/rutas.service'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const TIPOS = [
  { value: 'diurna', label: 'Diurna' },
  { value: 'nocturna', label: 'Nocturna' },
  { value: 'ambas', label: 'Ambas' },
]

const Ruta = () => {
  const { selectedProyectoId } = useProject()
  const [rutas, setRutas] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    proyecto_id: '',
    nombre: '',
    sector: '',
    geocerca: '',
    costo_base: '',
    tipo: 'diurna',
    activo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [rRes, pRes] = await Promise.all([rutasService.list(params), proyectosService.list()])
      setRutas(rRes.data)
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
    setForm({ proyecto_id: selectedProyectoId || '', nombre: '', sector: '', geocerca: '', costo_base: '', tipo: 'diurna', activo: true })
    setModalOpen(true)
  }

  const openEdit = async (r) => {
    setEditing(r)
    setForm({
      proyecto_id: r.proyecto_id,
      nombre: r.nombre,
      sector: r.sector || '',
      geocerca: r.geocerca || '',
      costo_base: r.costo_base ?? '',
      tipo: r.tipo || 'diurna',
      activo: r.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await rutasService.get(r.ruta_id)
      setEditingFull(data)
    } catch {
      setEditingFull(r)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (editing) {
        delete payload.proyecto_id
        await rutasService.update(editing.ruta_id, payload)
      } else {
        await rutasService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta ruta?')) return
    try {
      await rutasService.delete(id)
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
        title="Ruta"
        description="Rutas maestras y sectores"
        children={<Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nueva ruta</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Sector</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Tipo</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Costo</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay rutas en este proyecto' : 'No hay rutas'}
                  </td>
                </tr>
              )}
              {rutas.map((r) => (
                <tr key={r.ruta_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectos.find((p) => p.proyecto_id === r.proyecto_id)?.nombre || '-'}</td>
                  <td className="py-3 px-4">{r.nombre}</td>
                  <td className="py-3 px-4 text-muted">{r.sector || '—'}</td>
                  <td className="py-3 px-4 capitalize">{r.tipo}</td>
                  <td className="py-3 px-4">{r.costo_base != null ? r.costo_base : '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(r)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={() => handleDelete(r.ruta_id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar ruta' : 'Nueva ruta'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={form.proyecto_id || selectedProyectoId}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
            disabled={!!editing || !!selectedProyectoId}
            required
          />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          <Input label="Geocerca (JSON)" value={form.geocerca} onChange={(e) => setForm({ ...form, geocerca: e.target.value })} placeholder="GeoJSON o coordenadas" />
          <Input label="Costo base" type="number" step="0.01" value={form.costo_base} onChange={(e) => setForm({ ...form, costo_base: e.target.value })} />
          <Select label="Tipo" options={TIPOS} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
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

export default Ruta
