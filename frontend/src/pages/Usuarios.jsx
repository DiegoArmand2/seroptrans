import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import DataTable, { makeActionsColumn } from '../components/ui/DataTable'
import Input from '../components/ui/Input'
import MultiSelect from '../components/ui/MultiSelect'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { usuariosService } from '../services/usuarios.service'
import { rolesService } from '../services/roles.service'
import { getErrorMessage } from '../utils/apiError'

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    login: '',
    password: '',
    nombre_usuario: '',
    email: '',
    telefono: '',
    direccion: '',
    rol_ids: [],
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [uRes, rRes] = await Promise.all([
        usuariosService.list(),
        rolesService.list(),
      ])
      setUsuarios(uRes.data)
      setRoles(rRes.data)
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
      login: '',
      password: '',
      nombre_usuario: '',
      email: '',
      telefono: '',
      direccion: '',
      rol_ids: [],
    })
    setModalOpen(true)
  }

  const openEdit = async (u) => {
    setEditing(u)
    const initialRolIds = Array.isArray(u.roles)
      ? u.roles
          .map((r) => (typeof r === 'object' && r?.rol_id ? r.rol_id : roles.find((rr) => rr.nombre === r)?.rol_id))
          .filter(Boolean)
      : []
    setForm({
      login: u.login,
      password: '',
      nombre_usuario: u.nombre_usuario,
      email: u.email || '',
      telefono: u.telefono || '',
      direccion: u.direccion || '',
      rol_ids: initialRolIds,
    })
    setModalOpen(true)
    try {
      const { data } = await usuariosService.get(u.usuario_id)
      setEditingFull(data)
      setForm((f) => ({
        ...f,
        rol_ids: (data.roles || []).map((r) => r.rol_id) || [],
      }))
    } catch {
      setEditingFull(u)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { rol_ids, ...payload } = form
      if (editing) {
        if (!payload.password) delete payload.password
        delete payload.login
        await usuariosService.update(editing.usuario_id, payload)
        await usuariosService.syncRoles(editing.usuario_id, rol_ids || [])
      } else {
        if (!payload.email?.trim()) payload.email = null
        if (!payload.telefono?.trim()) payload.telefono = null
        if (!payload.direccion?.trim()) payload.direccion = null
        const { data } = await usuariosService.create(payload)
        if (rol_ids?.length) {
          await usuariosService.syncRoles(data.usuario_id, rol_ids)
        }
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (u) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await usuariosService.delete(u.usuario_id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'login',
        header: 'Usuario',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="font-mono">{getValue()}</span>,
      },
      {
        accessorKey: 'nombre_usuario',
        header: 'Nombre',
        filterFn: 'includesString',
      },
      {
        id: 'email',
        accessorFn: (u) => u.email || '—',
        header: 'Email',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: 'roles',
        accessorFn: (u) => ((u.roles || []).length ? (u.roles || []).join(', ') : '—'),
        header: 'Roles',
        filterFn: 'includesString',
        cell: ({ getValue }) => <span className="text-muted text-sm">{getValue()}</span>,
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
        title="Usuarios"
        description="Gestión de usuarios del sistema"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo usuario
          </Button>
        }
      />

      <DataTable
        data={usuarios}
        columns={columns}
        getRowId={(u) => u.usuario_id}
        exportFileName="usuarios"
        exportTitle="Usuarios"
        emptyMessage="No hay usuarios"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Login"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            disabled={!!editing}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editing ? 'Dejar vacío para no cambiar' : ''}
            required={!editing}
          />
          <Input
            label="Nombre"
            value={form.nombre_usuario}
            onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
          <Input
            label="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          />
          <MultiSelect
            label="Roles"
            options={roles}
            value={form.rol_ids || []}
            onChange={(rol_ids) => setForm({ ...form, rol_ids })}
            getOptionId={(r) => r.rol_id}
            getOptionLabel={(r) => r.nombre}
            placeholder="Buscar roles..."
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

export default Usuarios
