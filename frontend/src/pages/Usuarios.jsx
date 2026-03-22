import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
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

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await usuariosService.delete(id)
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
        title="Usuarios"
        description="Gestión de usuarios del sistema"
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo usuario
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">
                  Usuario
                </th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">
                  Nombre
                </th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">
                  Roles
                </th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.usuario_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4 font-mono">{u.login}</td>
                  <td className="py-3 px-4">{u.nombre_usuario}</td>
                  <td className="py-3 px-4 text-muted">{u.email || '—'}</td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {(u.roles || []).length ? (u.roles || []).join(', ') : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={() => openEdit(u)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleDelete(u.usuario_id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
