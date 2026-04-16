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
import { turnosService } from '../services/turnos.service'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const TIPO_TURNO_OPTIONS = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'nocturno', label: 'Nocturno' },
]

const TIPO_HORARIO_OPTIONS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
]

const defaultForm = (proyectoId = '') => ({
  proyecto_id: proyectoId,
  nombre: '',
  descripcion: '',
  activo: true,
  hora_entrada: '',
  hora_salida: '',
  tipo_turno: 'matutino',
  tipo_horario: 'entrada',
  cambio_dia: false,
})

function timeApiToInput(v) {
  if (v == null || v === '') return ''
  const s = typeof v === 'string' ? v : String(v)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function timeInputToPayload(v) {
  if (v == null || v === '') return null
  return v
}

function turnoToForm(t, proyectoFallback = '') {
  return {
    proyecto_id: t.proyecto_id || proyectoFallback,
    nombre: t.nombre ?? '',
    descripcion: t.descripcion || '',
    activo: t.activo ?? true,
    hora_entrada: timeApiToInput(t.hora_entrada),
    hora_salida: timeApiToInput(t.hora_salida),
    tipo_turno: t.tipo_turno || 'matutino',
    tipo_horario: t.tipo_horario || 'entrada',
    cambio_dia: !!t.cambio_dia,
  }
}

function formatHoraCell(v) {
  if (v == null || v === '') return '—'
  const s = typeof v === 'string' ? v : String(v)
  return s.length >= 5 ? s.slice(0, 5) : s
}

const Turno = () => {
  const { selectedProyectoId } = useProject()
  const [turnos, setTurnos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState(() => defaultForm())

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [tRes, pRes] = await Promise.all([turnosService.list(params), proyectosService.list()])
      setTurnos(tRes.data)
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
    setForm(defaultForm(selectedProyectoId || ''))
    setModalOpen(true)
  }

  const openEdit = async (t) => {
    setEditing(t)
    setEditingFull(null)
    setForm(turnoToForm(t, selectedProyectoId || ''))
    setModalOpen(true)
    try {
      const { data } = await turnosService.get(t.turno_id)
      setEditingFull(data)
      setForm(turnoToForm(data, selectedProyectoId || ''))
    } catch {
      setEditingFull(t)
    }
  }

  const buildPayload = () => ({
    proyecto_id: form.proyecto_id,
    nombre: form.nombre,
    descripcion: form.descripcion || null,
    activo: form.activo,
    hora_entrada: timeInputToPayload(form.hora_entrada),
    hora_salida: timeInputToPayload(form.hora_salida),
    tipo_turno: form.tipo_turno,
    tipo_horario: form.tipo_horario,
    cambio_dia: form.cambio_dia,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = buildPayload()
      if (editing) {
        await turnosService.update(editing.turno_id, {
          nombre: payload.nombre,
          descripcion: payload.descripcion,
          activo: payload.activo,
          hora_entrada: payload.hora_entrada,
          hora_salida: payload.hora_salida,
          tipo_turno: payload.tipo_turno,
          tipo_horario: payload.tipo_horario,
          cambio_dia: payload.cambio_dia,
        })
      } else {
        await turnosService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este turno?')) return
    try {
      await turnosService.delete(id)
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

  const tipoTurnoLabel = (v) => TIPO_TURNO_OPTIONS.find((o) => o.value === v)?.label || v || '—'

  return (
    <>
      <PageHeader
        title="Turno"
        description="Gestión de turnos por proyecto"
        children={<Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nuevo turno</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Entrada</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Salida</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Tipo turno</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Descripción</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Estado</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay turnos en este proyecto' : 'No hay turnos'}
                  </td>
                </tr>
              )}
              {turnos.map((t) => (
                <tr key={t.turno_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectos.find((p) => p.proyecto_id === t.proyecto_id)?.nombre || '-'}</td>
                  <td className="py-3 px-4">{t.nombre}</td>
                  <td className="py-3 px-4 text-muted">{formatHoraCell(t.hora_entrada)}</td>
                  <td className="py-3 px-4 text-muted">{formatHoraCell(t.hora_salida)}</td>
                  <td className="py-3 px-4 text-muted">{tipoTurnoLabel(t.tipo_turno)}</td>
                  <td className="py-3 px-4 text-muted">{t.descripcion || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${t.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(t)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={() => handleDelete(t.turno_id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar turno' : 'Nuevo turno'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={form.proyecto_id || selectedProyectoId}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
            disabled={!!editing || !!selectedProyectoId}
            required
          />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="mañana, noche" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hora entrada"
              type="time"
              value={form.hora_entrada}
              onChange={(e) => setForm({ ...form, hora_entrada: e.target.value })}
            />
            <Input
              label="Hora salida"
              type="time"
              value={form.hora_salida}
              onChange={(e) => setForm({ ...form, hora_salida: e.target.value })}
            />
          </div>
          <Select
            label="Tipo turno"
            options={TIPO_TURNO_OPTIONS}
            value={form.tipo_turno}
            onChange={(e) => setForm({ ...form, tipo_turno: e.target.value })}
            required
          />
          <Select
            label="Tipo horario"
            options={TIPO_HORARIO_OPTIONS}
            value={form.tipo_horario}
            onChange={(e) => setForm({ ...form, tipo_horario: e.target.value })}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cambio_dia"
              checked={form.cambio_dia}
              onChange={(e) => setForm({ ...form, cambio_dia: e.target.checked })}
              className="rounded w-4 h-4 accent-primary"
            />
            <label htmlFor="cambio_dia" className="text-sm font-medium text-primary">Cambio de día</label>
          </div>
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
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

export default Turno
