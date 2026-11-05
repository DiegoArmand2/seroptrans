import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import DataTable, { StatusBadge, makeActionsColumn } from '../components/ui/DataTable'
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
    license_number: '',
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
    setForm({ nombre: '', license_number: '', disponible: true, activo: true, proyecto_id: selectedProyectoId || '' })
    setModalOpen(true)
  }

  const openEdit = async (c) => {
    setEditing(c)
    const proyectoId = c.proyecto_ids?.[0] || selectedProyectoId || ''
    setForm({
      nombre: c.nombre,
      license_number: c.license_number ?? '',
      disponible: c.disponible ?? true,
      activo: c.activo ?? true,
      proyecto_id: proyectoId,
    })
    setModalOpen(true)
    try {
      const { data } = await conductoresService.get(c.conductor_id)
      setEditingFull(data)
      setForm({
        nombre: data.nombre,
        license_number: data.license_number ?? '',
        disponible: data.disponible ?? true,
        activo: data.activo ?? true,
        proyecto_id: proyectoId,
      })
    } catch {
      setEditingFull(c)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const proyectoId = form.proyecto_id || selectedProyectoId
    try {
      if (editing) {
        await conductoresService.update(editing.conductor_id, {
          nombre: form.nombre,
          license_number: String(form.license_number || '').trim() || null,
          disponible: form.disponible,
          activo: form.activo,
        })
        if (proyectoId && !editing.proyecto_ids?.includes(proyectoId)) {
          await conductoresService.assignProyecto(editing.conductor_id, proyectoId)
        }
      } else {
        const { data } = await conductoresService.create({
          nombre: form.nombre,
          license_number: String(form.license_number || '').trim() || null,
          disponible: form.disponible,
          activo: form.activo,
        })
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

  const handleDelete = async (c) => {
    const id = typeof c === 'string' ? c : c?.conductor_id
    if (!id || !confirm('¿Eliminar este conductor?')) return
    try {
      await conductoresService.delete(id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const proyectoOptions = proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))

  const columns = useMemo(
    () => [
      {
        id: 'proyecto',
        accessorFn: (c) => (c.proyecto_nombres?.length ? c.proyecto_nombres.join(', ') : '—'),
        header: 'Proyecto',
        filterFn: 'includesString',
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-fg">{getValue()}</span>,
      },
      {
        id: 'license_number',
        accessorFn: (c) => c.license_number || '—',
        header: 'License number',
        filterFn: 'includesString',
      },
      {
        id: 'estado',
        accessorFn: (c) => {
          const parts = [c.activo ? 'Activo' : 'Inactivo']
          if (c.disponible) parts.push('Disponible')
          return parts.join(' • ')
        },
        header: 'Estado',
        filterFn: 'includesString',
        cell: ({ row }) => (
          <>
            <StatusBadge activo={row.original.activo} />
            {row.original.disponible ? ' • Disponible' : ''}
          </>
        ),
      },
      makeActionsColumn({ onEdit: openEdit, onDelete: handleDelete }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
        title="Conductor"
        description="Gestión de conductores (choferes)"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo conductor
          </Button>
        }
      />

      <DataTable
        data={conductores}
        columns={columns}
        getRowId={(c) => c.conductor_id}
        exportFileName="conductores"
        exportTitle="Conductores"
        emptyMessage={
          selectedProyectoId ? 'No hay conductores en este proyecto' : 'No hay conductores'
        }
      />

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
          <Input
            label="License number"
            value={form.license_number}
            onChange={(e) => setForm({ ...form, license_number: e.target.value })}
            maxLength={50}
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
