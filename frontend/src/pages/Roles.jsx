import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import DataTable, { makeActionsColumn } from '../components/ui/DataTable'
import { rolesService } from '../services/roles.service'
import { getErrorMessage } from '../utils/apiError'

const Roles = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await rolesService.list()
      setRoles(data)
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
    setForm({ nombre: '', descripcion: '' })
    setModalOpen(true)
  }

  const openEdit = async (r) => {
    setEditing(r)
    setForm({ nombre: r.nombre, descripcion: r.descripcion || '' })
    setModalOpen(true)
    try {
      const { data } = await rolesService.get(r.rol_id)
      setEditingFull(data)
    } catch {
      setEditingFull(r)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await rolesService.update(editing.rol_id, form)
      } else {
        await rolesService.create(form)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (r) => {
    if (!confirm('¿Eliminar este rol?')) return
    try {
      await rolesService.delete(r.rol_id)
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
        accessorFn: (r) => r.descripcion || '—',
        header: 'Descripción',
        filterFn: 'includesString',
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
        title="Roles"
        description="Gestión de roles del sistema"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo rol
          </Button>
        }
      />

      <DataTable
        data={roles}
        columns={columns}
        getRowId={(r) => r.rol_id}
        exportFileName="roles"
        exportTitle="Roles"
        emptyMessage="No hay roles"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar rol' : 'Nuevo rol'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
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

export default Roles
