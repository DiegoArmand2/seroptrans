import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import DataTable, { StatusBadge, makeActionsColumn } from '../components/ui/DataTable'
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
  { value: 'ambos', label: 'Ambos' },
]

const TIPO_HORARIO_OPTIONS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ambos', label: 'Ambos' },
]

function tipoTurnoLabel(v) {
  return TIPO_TURNO_OPTIONS.find((o) => o.value === v)?.label || v || '—'
}

const defaultForm = (proyectoId = '') => ({
  proyecto_id: proyectoId,
  codigo: '',
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
    codigo: t.codigo ?? '',
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
    codigo: form.codigo?.trim() || null,
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
          codigo: payload.codigo,
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

  const handleDelete = async (t) => {
    if (!confirm('¿Eliminar este turno?')) return
    try {
      await turnosService.delete(t.turno_id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'proyecto',
        accessorFn: (r) => proyectos.find((p) => p.proyecto_id === r.proyecto_id)?.nombre || '—',
        header: 'Proyecto',
        filterFn: 'includesString',
      },
      {
        id: 'codigo',
        accessorFn: (r) => r.codigo || '—',
        header: 'Código',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        filterFn: 'includesString',
      },
      {
        id: 'hora_entrada',
        accessorFn: (r) => formatHoraCell(r.hora_entrada),
        header: 'Entrada',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: 'hora_salida',
        accessorFn: (r) => formatHoraCell(r.hora_salida),
        header: 'Salida',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: 'tipo_turno',
        accessorFn: (r) => tipoTurnoLabel(r.tipo_turno),
        header: 'Tipo turno',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: 'descripcion',
        accessorFn: (r) => r.descripcion || '—',
        header: 'Descripción',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: 'estado',
        accessorFn: (r) => (r.activo ? 'Activo' : 'Inactivo'),
        header: 'Estado',
        filterFn: 'includesString',
        cell: ({ row }) => <StatusBadge activo={row.original.activo} />,
      },
      makeActionsColumn({ onEdit: openEdit, onDelete: handleDelete }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [proyectos]
  )

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
        title="Turno"
        description="Gestión de turnos por proyecto"
        children={<Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nuevo turno</Button>}
      />

      <DataTable
        data={turnos}
        columns={columns}
        getRowId={(r) => r.turno_id}
        exportFileName="turnos"
        exportTitle="Turnos"
        emptyMessage={selectedProyectoId ? 'No hay turnos en este proyecto' : 'No hay turnos'}
      />

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
          <Input
            label="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            maxLength={20}
            placeholder="Hasta 20 caracteres"
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
