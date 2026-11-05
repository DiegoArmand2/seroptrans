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

  const handleDelete = async (t) => {
    if (!confirm('¿Eliminar este tipo de vehículo?')) return
    try {
      await tiposVehiculoService.delete(t.tipo_vehiculo_id)
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
        accessorKey: 'identificador',
        header: 'Identificador',
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
        title="Tipo de vehículo"
        description="Catálogo de tipos de vehículo por proyecto"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo tipo
          </Button>
        }
      />

      <DataTable
        data={tipos}
        columns={columns}
        getRowId={(r) => r.tipo_vehiculo_id}
        exportFileName="tipos-vehiculo"
        exportTitle="Tipos de vehículo"
        emptyMessage={selectedProyectoId ? 'No hay tipos en este proyecto' : 'No hay tipos de vehículo'}
      />

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
