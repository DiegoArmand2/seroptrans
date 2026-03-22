import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { pasajerosService } from '../services/pasajeros.service'
import { proyectosService } from '../services/proyectos.service'
import { rutasService } from '../services/rutas.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const Pasajero = () => {
  const { selectedProyectoId } = useProject()
  const [pasajeros, setPasajeros] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [rutas, setRutas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [importProyecto, setImportProyecto] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    proyecto_id: '',
    cedula: '',
    nombre: '',
    direccion: '',
    ruta_id: '',
    horario_habitual: '',
    placa_asignada: '',
    activo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [pRes, proyRes, rRes] = await Promise.all([
        pasajerosService.list(params),
        proyectosService.list(),
        rutasService.list(params),
      ])
      setPasajeros(pRes.data)
      setProyectos(proyRes.data)
      setRutas(rRes.data)
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
      cedula: '',
      nombre: '',
      direccion: '',
      ruta_id: '',
      horario_habitual: '',
      placa_asignada: '',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = async (p) => {
    setEditing(p)
    setForm({
      proyecto_id: p.proyecto_id,
      cedula: p.cedula,
      nombre: p.nombre,
      direccion: p.direccion || '',
      ruta_id: p.ruta_id || '',
      horario_habitual: p.horario_habitual || '',
      placa_asignada: p.placa_asignada || '',
      activo: p.activo ?? true,
    })
    setModalOpen(true)
    try {
      const { data } = await pasajerosService.get(p.pasajero_id)
      setEditingFull(data)
    } catch {
      setEditingFull(p)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!payload.ruta_id) payload.ruta_id = null
      if (editing) {
        delete payload.proyecto_id
        await pasajerosService.update(editing.pasajero_id, payload)
      } else {
        await pasajerosService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este pasajero?')) return
    try {
      await pasajerosService.delete(id)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importProyecto || !importFile) {
      alert('Seleccione proyecto y archivo')
      return
    }
    setImporting(true)
    try {
      await pasajerosService.importar(importProyecto, importFile)
      setImportModalOpen(false)
      setImportFile(null)
      setImportProyecto('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadData()
      alert('Importación completada')
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const rutasDelProyecto = form.proyecto_id
    ? rutas.filter((r) => r.proyecto_id === form.proyecto_id)
    : rutas

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
        title="Pasajero"
        description="Nómina de pasajeros"
        children={
          <div className="flex gap-2">
            <Button icon={<Upload className="w-5 h-5" />} variant="outline" onClick={() => setImportModalOpen(true)}>
              Importar
            </Button>
            <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo pasajero
            </Button>
          </div>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Cédula</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Dirección</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Ruta</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Estado</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pasajeros.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay pasajeros en este proyecto' : 'No hay pasajeros'}
                  </td>
                </tr>
              )}
              {pasajeros.map((p) => (
                <tr key={p.pasajero_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectos.find((proy) => proy.proyecto_id === p.proyecto_id)?.nombre || '—'}</td>
                  <td className="py-3 px-4 font-mono">{p.cedula}</td>
                  <td className="py-3 px-4">{p.nombre}</td>
                  <td className="py-3 px-4 text-muted max-w-xs truncate">{p.direccion || '—'}</td>
                  <td className="py-3 px-4">{rutas.find((r) => r.ruta_id === p.ruta_id)?.nombre || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${p.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(p)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={() => handleDelete(p.pasajero_id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar pasajero' : 'Nuevo pasajero'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={form.proyecto_id || selectedProyectoId}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
            disabled={!!editing || !!selectedProyectoId}
            required
          />
          <Input label="Cédula" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} required />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          <Select
            label="Ruta asignada"
            options={rutasDelProyecto.map((r) => ({ value: r.ruta_id, label: r.nombre }))}
            value={form.ruta_id}
            onChange={(e) => setForm({ ...form, ruta_id: e.target.value })}
            placeholder="Sin asignar"
          />
          <Input label="Horario habitual" value={form.horario_habitual} onChange={(e) => setForm({ ...form, horario_habitual: e.target.value })} />
          <Input label="Placa asignada" value={form.placa_asignada} onChange={(e) => setForm({ ...form, placa_asignada: e.target.value })} />
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

      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Importar pasajeros">
        <form onSubmit={handleImport} className="space-y-4">
          <p className="text-sm text-muted">
            Columnas esperadas: cedula, nombre, direccion, ruta_id (opc), horario_habitual (opc), placa_asignada (opc)
          </p>
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={importProyecto}
            onChange={(e) => setImportProyecto(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Archivo (Excel o CSV)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-primary/20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setImportModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="accent" disabled={importing || !importFile}>
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default Pasajero
