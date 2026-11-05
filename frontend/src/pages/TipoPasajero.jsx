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
import { tiposPasajeroService } from '../services/tiposPasajero.service'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const TipoPasajero = () => {
  const { selectedProyectoId } = useProject()
  const [tipos, setTipos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    proyecto_id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [tRes, pRes] = await Promise.all([tiposPasajeroService.list(params), proyectosService.list()])
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
      codigo: '',
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
      codigo: t.codigo,
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      activo: t.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await tiposPasajeroService.get(t.tipo_pasajero_id)
      setEditingFull(data)
    } catch {
      setEditingFull(t)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await tiposPasajeroService.update(editing.tipo_pasajero_id, {
          codigo: form.codigo,
          nombre: form.nombre,
          descripcion: form.descripcion,
          activo: form.activo,
        })
      } else {
        await tiposPasajeroService.create(form)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (t) => {
    if (!confirm('¿Eliminar este tipo de pasajero?')) return
    try {
      await tiposPasajeroService.delete(t.tipo_pasajero_id)
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
        accessorKey: 'codigo',
        header: 'Código',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="font-mono text-sm">{getValue()}</span>,
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        filterFn: 'includesString',
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
        title="Tipo de pasajero"
        description="Catálogo de tipos de pasajero por proyecto"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo tipo
          </Button>
        }
      />

      <DataTable
        data={tipos}
        columns={columns}
        getRowId={(r) => r.tipo_pasajero_id}
        exportFileName="tipos-pasajero"
        exportTitle="Tipos de pasajero"
        emptyMessage={selectedProyectoId ? 'No hay tipos en este proyecto' : 'No hay tipos de pasajero'}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar tipo de pasajero' : 'Nuevo tipo de pasajero'}>
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
            placeholder="Ej. VIP, EST"
            required
          />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo-tp"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="rounded w-4 h-4 accent-primary"
            />
            <label htmlFor="activo-tp" className="text-sm font-medium text-primary">
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

export default TipoPasajero
