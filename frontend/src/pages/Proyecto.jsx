import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import DataTable, { StatusBadge, makeActionsColumn } from '../components/ui/DataTable'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

function timeApiToInput(v) {
  if (v == null || v === '') return ''
  const s = typeof v === 'string' ? v : String(v)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function timeInputToPayload(v) {
  if (v == null || v === '') return null
  return v
}

function formatHora(v) {
  if (v == null || v === '') return null
  const s = typeof v === 'string' ? v : String(v)
  return s.length >= 5 ? s.slice(0, 5) : s
}

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
    rango_hora_desde: '',
    rango_hora_hasta: '',
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
    setForm({
      nombre: '',
      descripcion: '',
      parametros_operativos: '',
      rango_hora_desde: '',
      rango_hora_hasta: '',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = async (p) => {
    setEditing(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      parametros_operativos: p.parametros_operativos || '',
      rango_hora_desde: timeApiToInput(p.rango_hora_desde),
      rango_hora_hasta: timeApiToInput(p.rango_hora_hasta),
      activo: p.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await proyectosService.get(p.proyecto_id)
      setEditingFull(data)
      setForm({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        parametros_operativos: data.parametros_operativos || '',
        rango_hora_desde: timeApiToInput(data.rango_hora_desde),
        rango_hora_hasta: timeApiToInput(data.rango_hora_hasta),
        activo: data.activo ?? true,
      })
    } catch {
      setEditingFull(p)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        rango_hora_desde: timeInputToPayload(form.rango_hora_desde),
        rango_hora_hasta: timeInputToPayload(form.rango_hora_hasta),
      }
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

  const handleDelete = async (p) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    try {
      await proyectosService.delete(p.proyecto_id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-fg font-medium">{getValue()}</span>,
      },
      {
        id: 'descripcion',
        accessorFn: (p) => p.descripcion || '—',
        header: 'Descripción',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: 'rango',
        accessorFn: (p) => {
          const desde = formatHora(p.rango_hora_desde)
          const hasta = formatHora(p.rango_hora_hasta)
          if (!desde && !hasta) return '—'
          return `${desde || '—'} – ${hasta || '—'}`
        },
        header: 'Rango',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted text-sm">{getValue()}</span>,
      },
      {
        id: 'estado',
        accessorFn: (p) => (p.activo ? 'Activo' : 'Inactivo'),
        header: 'Estado',
        filterFn: 'includesString',
        cell: ({ row }) => <StatusBadge activo={row.original.activo} />,
      },
      makeActionsColumn({ onEdit: openEdit, onDelete: handleDelete }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

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

      <DataTable
        data={proyectosFiltrados}
        columns={columns}
        getRowId={(p) => p.proyecto_id}
        exportFileName="proyectos"
        exportTitle="Proyectos"
        emptyMessage={
          selectedProyectoId ? 'No hay proyectos que coincidan con el filtro' : 'No hay proyectos'
        }
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <Input label="Parámetros operativos (JSON)" value={form.parametros_operativos} onChange={(e) => setForm({ ...form, parametros_operativos: e.target.value })} placeholder='{"ocupacion_maxima": 13}' />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rango hora desde"
              type="time"
              value={form.rango_hora_desde}
              onChange={(e) => setForm({ ...form, rango_hora_desde: e.target.value })}
            />
            <Input
              label="Rango hora hasta"
              type="time"
              value={form.rango_hora_hasta}
              onChange={(e) => setForm({ ...form, rango_hora_hasta: e.target.value })}
            />
          </div>
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
