import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, MapPinned } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { rutasService } from '../services/rutas.service'
import { proyectosService } from '../services/proyectos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'
import { validateGeocercaString } from '../utils/geocerca'
import GeocercaEditor from '../components/ruta/GeocercaEditor'

const PUNTO_INICIO_OPTIONS = [
  { value: 'domicilio', label: 'Domicilio' },
  { value: 'punto_encuentro', label: 'Punto de encuentro' },
]

function puntoInicioLabel(v) {
  return PUNTO_INICIO_OPTIONS.find((o) => o.value === v)?.label || '—'
}

const GEO_FIELDS = {
  origen_nombre: '',
  origen_lat: '',
  origen_lng: '',
  destino_nombre: '',
  destino_lat: '',
  destino_lng: '',
}

function parseCoord(s) {
  const t = String(s ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/,/g, '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}

function rutaToForm(data) {
  return {
    proyecto_id: data.proyecto_id,
    nombre: data.nombre,
    codigo: data.codigo ?? '',
    punto_inicio: data.punto_inicio || 'domicilio',
    punto_inicio_salida: data.punto_inicio_salida || 'domicilio',
    origen_nombre: data.origen_nombre ?? '',
    origen_lat: data.origen_lat != null && data.origen_lat !== '' ? String(data.origen_lat) : '',
    origen_lng: data.origen_lng != null && data.origen_lng !== '' ? String(data.origen_lng) : '',
    destino_nombre: data.destino_nombre ?? '',
    destino_lat: data.destino_lat != null && data.destino_lat !== '' ? String(data.destino_lat) : '',
    destino_lng: data.destino_lng != null && data.destino_lng !== '' ? String(data.destino_lng) : '',
    sector: data.sector || '',
    geocerca: data.geocerca || '',
    costo_base: data.costo_base ?? '',
    tipo: data.tipo || 'diurna',
    activo: data.activo ?? true,
  }
}

const Ruta = () => {
  const { selectedProyectoId } = useProject()
  const [rutas, setRutas] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState({
    proyecto_id: '',
    nombre: '',
    codigo: '',
    punto_inicio: 'domicilio',
    punto_inicio_salida: 'domicilio',
    ...GEO_FIELDS,
    sector: '',
    geocerca: '',
    costo_base: '',
    tipo: 'diurna',
    activo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [rRes, pRes] = await Promise.all([rutasService.list(params), proyectosService.list()])
      setRutas(rRes.data)
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
      nombre: '',
      codigo: '',
      punto_inicio: 'domicilio',
      punto_inicio_salida: 'domicilio',
      ...GEO_FIELDS,
      sector: '',
      geocerca: '',
      costo_base: '',
      tipo: 'diurna',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = async (r) => {
    setEditing(r)
    setModalOpen(true)
    setForm(rutaToForm(r))
    try {
      const { data } = await rutasService.get(r.ruta_id)
      setEditingFull(data)
      setForm(rutaToForm(data))
    } catch {
      setEditingFull(r)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const geoErr = validateGeocercaString(form.geocerca)
    if (geoErr) {
      alert(geoErr)
      return
    }
    const origenLat = parseCoord(form.origen_lat)
    const origenLng = parseCoord(form.origen_lng)
    const destinoLat = parseCoord(form.destino_lat)
    const destinoLng = parseCoord(form.destino_lng)
    if (Number.isNaN(origenLat) || Number.isNaN(origenLng) || Number.isNaN(destinoLat) || Number.isNaN(destinoLng)) {
      alert('Latitud y longitud deben ser números válidos')
      return
    }
    try {
      const payload = { ...form }
      payload.codigo = (payload.codigo && String(payload.codigo).trim()) || null
      payload.origen_nombre = String(payload.origen_nombre || '').trim() || null
      payload.destino_nombre = String(payload.destino_nombre || '').trim() || null
      payload.origen_lat = origenLat
      payload.origen_lng = origenLng
      payload.destino_lat = destinoLat
      payload.destino_lng = destinoLng
      if (typeof payload.geocerca === 'string' && !payload.geocerca.trim()) {
        payload.geocerca = ''
      }
      if (editing) {
        delete payload.proyecto_id
        await rutasService.update(editing.ruta_id, payload)
      } else {
        await rutasService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta ruta?')) return
    try {
      await rutasService.delete(id)
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
        title="Ruta"
        description="Rutas maestras y sectores"
        children={<Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nueva ruta</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Código</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Punto de inicio ingreso</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Punto de inicio salida</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Sector</th>
                <th className="text-center py-3 px-4 font-heading text-primary font-semibold" title="Geocerca definida">
                  Geo
                </th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Tipo</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Costo</th>
                <th className="text-right py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutas.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay rutas en este proyecto' : 'No hay rutas'}
                  </td>
                </tr>
              )}
              {rutas.map((r) => (
                <tr key={r.ruta_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectos.find((p) => p.proyecto_id === r.proyecto_id)?.nombre || '-'}</td>
                  <td className="py-3 px-4">{r.nombre}</td>
                  <td className="py-3 px-4 text-muted">{r.codigo || '—'}</td>
                  <td className="py-3 px-4 text-muted">{puntoInicioLabel(r.punto_inicio)}</td>
                  <td className="py-3 px-4 text-muted">{puntoInicioLabel(r.punto_inicio_salida)}</td>
                  <td className="py-3 px-4 text-muted">{r.sector || '—'}</td>
                  <td className="py-3 px-4 text-center text-muted">
                    {r.geocerca && String(r.geocerca).trim() ? (
                      <MapPinned className="w-5 h-5 inline-block text-accent" aria-label="Tiene geocerca" />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize">{r.tipo}</td>
                  <td className="py-3 px-4">{r.costo_base != null ? r.costo_base : '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(r)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={() => handleDelete(r.ruta_id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar ruta' : 'Nueva ruta'} size="3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 content-start">
              <div className="sm:col-span-2">
                <Select
                  label="Proyecto"
                  options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
                  value={form.proyecto_id || selectedProyectoId}
                  onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
                  disabled={!!editing || !!selectedProyectoId}
                  required
                />
              </div>
              <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              <Input
                label="Código"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                maxLength={50}
                placeholder="Opcional"
              />
              <Input label="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
              <Input label="Costo base" type="number" step="0.01" value={form.costo_base} onChange={(e) => setForm({ ...form, costo_base: e.target.value })} />
              <Select
                label="Punto de inicio ingreso"
                options={PUNTO_INICIO_OPTIONS}
                value={form.punto_inicio}
                onChange={(e) => setForm({ ...form, punto_inicio: e.target.value })}
              />
              <Select
                label="Punto de inicio salida"
                options={PUNTO_INICIO_OPTIONS}
                value={form.punto_inicio_salida}
                onChange={(e) => setForm({ ...form, punto_inicio_salida: e.target.value })}
              />
              <div className="rounded-lg border border-primary/10 p-3 space-y-3">
                <p className="text-sm font-semibold text-primary">Origen</p>
                <Input
                  label="Origen nombre"
                  value={form.origen_nombre}
                  onChange={(e) => setForm({ ...form, origen_nombre: e.target.value })}
                  maxLength={255}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Origen lat"
                    value={form.origen_lat}
                    onChange={(e) => setForm({ ...form, origen_lat: e.target.value })}
                    placeholder="-0.1806532"
                  />
                  <Input
                    label="Origen lng"
                    value={form.origen_lng}
                    onChange={(e) => setForm({ ...form, origen_lng: e.target.value })}
                    placeholder="-78.4678382"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-primary/10 p-3 space-y-3">
                <p className="text-sm font-semibold text-primary">Destino</p>
                <Input
                  label="Destino nombre"
                  value={form.destino_nombre}
                  onChange={(e) => setForm({ ...form, destino_nombre: e.target.value })}
                  maxLength={255}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Destino lat"
                    value={form.destino_lat}
                    onChange={(e) => setForm({ ...form, destino_lat: e.target.value })}
                    placeholder="-0.1806532"
                  />
                  <Input
                    label="Destino lng"
                    value={form.destino_lng}
                    onChange={(e) => setForm({ ...form, destino_lng: e.target.value })}
                    placeholder="-78.4678382"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2 pt-1">
                <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="rounded w-4 h-4 accent-primary" />
                <label htmlFor="activo" className="text-sm font-medium text-primary">Activo</label>
              </div>
            </div>
            <div className="min-w-0 xl:sticky xl:top-0">
              <GeocercaEditor
                instanceKey={editing?.ruta_id ?? 'create'}
                value={form.geocerca}
                onChange={(g) => setForm((f) => ({ ...f, geocerca: g }))}
              />
            </div>
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

export default Ruta
