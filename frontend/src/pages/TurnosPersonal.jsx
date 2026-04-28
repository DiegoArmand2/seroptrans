import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import { turnosPersonalService } from '../services/turnosPersonal.service'
import { proyectosService } from '../services/proyectos.service'
import { pasajerosService } from '../services/pasajeros.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const emptyForm = (defaults = {}) => ({
  proyecto_id: defaults.proyecto_id || '',
  horario_importacion_id: defaults.horario_importacion_id || '',
  pasajero_id: defaults.pasajero_id || '',
  empresa: defaults.empresa || '',
  proceso: defaults.proceso || '',
  cargo: defaults.cargo || '',
  rut: defaults.rut || '',
  apellidos: defaults.apellidos || '',
  funcionarios: defaults.funcionarios || '',
  dia_09: defaults.dia_09 || '',
  dia_10: defaults.dia_10 || '',
  dia_11: defaults.dia_11 || '',
  dia_12: defaults.dia_12 || '',
  dia_13: defaults.dia_13 || '',
  dia_14: defaults.dia_14 || '',
  dia_15: defaults.dia_15 || '',
})

const TurnosPersonal = () => {
  const { selectedProyectoId } = useProject()
  const [searchParams] = useSearchParams()
  const horarioImportacionIdParam = (searchParams.get('horario_importacion_id') || '').trim()

  const [rows, setRows] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [pasajeros, setPasajeros] = useState([])
  const [loadingPasajeros, setLoadingPasajeros] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFull, setEditingFull] = useState(null)
  const [form, setForm] = useState(() =>
    emptyForm({
      proyecto_id: selectedProyectoId || '',
      horario_importacion_id: horarioImportacionIdParam || '',
    })
  )

  const contextHorarioImportacionId = horarioImportacionIdParam || form.horario_importacion_id || ''

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedProyectoId) params.proyecto_id = selectedProyectoId
      if (horarioImportacionIdParam) params.horario_importacion_id = horarioImportacionIdParam

      const [rowsRes, proyRes] = await Promise.all([
        turnosPersonalService.list(params),
        proyectosService.list(),
      ])
      setRows(rowsRes.data || [])
      setProyectos(proyRes.data || [])

      // Opcional: cargar pasajeros solo si hay un proyecto en contexto
      const pid = selectedProyectoId || (rowsRes.data?.[0]?.proyecto_id || '')
      if (pid) {
        try {
          const { data } = await pasajerosService.list({ proyecto_id: pid })
          setPasajeros(data || [])
        } catch {
          setPasajeros([])
        }
      } else {
        setPasajeros([])
      }
    } catch (err) {
      console.error(err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [selectedProyectoId, horarioImportacionIdParam])

  const fetchPasajeros = useCallback(async (proyectoId) => {
    const pid = (proyectoId || '').trim()
    if (!pid) {
      setPasajeros([])
      return
    }
    setLoadingPasajeros(true)
    try {
      const { data } = await pasajerosService.list({ proyecto_id: pid })
      setPasajeros(data || [])
    } catch {
      setPasajeros([])
    } finally {
      setLoadingPasajeros(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setForm((prev) =>
      emptyForm({
        ...prev,
        proyecto_id: selectedProyectoId || prev.proyecto_id || '',
        horario_importacion_id: horarioImportacionIdParam || prev.horario_importacion_id || '',
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProyectoId, horarioImportacionIdParam])

  const proyectoOptions = useMemo(
    () => proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre })),
    [proyectos]
  )

  const pasajeroOptions = useMemo(
    () => pasajeros.map((p) => ({ value: p.pasajero_id, label: `${p.nombre} (${p.cedula || '—'})` })),
    [pasajeros]
  )

  const openCreate = () => {
    setEditing(null)
    setEditingFull(null)
    const proyectoId = selectedProyectoId || ''
    setForm(
      emptyForm({
        proyecto_id: proyectoId,
        horario_importacion_id: horarioImportacionIdParam || '',
      })
    )
    setModalOpen(true)
    fetchPasajeros(proyectoId)
  }

  const openEdit = async (row) => {
    setEditing(row)
    setEditingFull(null)
    setForm(
      emptyForm({
        ...row,
        pasajero_id: row.pasajero_id || '',
      })
    )
    setModalOpen(true)
    fetchPasajeros(row.proyecto_id)
    try {
      const { data } = await turnosPersonalService.get(row.turno_personal_id)
      setEditingFull(data)
      setForm(emptyForm({ ...data, pasajero_id: data.pasajero_id || '' }))
      fetchPasajeros(data.proyecto_id)
    } catch {
      setEditingFull(row)
    }
  }

  const buildCreatePayload = () => ({
    proyecto_id: form.proyecto_id,
    horario_importacion_id: form.horario_importacion_id,
    pasajero_id: form.pasajero_id.trim(),
    empresa: form.empresa || null,
    proceso: form.proceso || null,
    cargo: form.cargo || null,
    rut: form.rut || null,
    apellidos: form.apellidos || null,
    funcionarios: form.funcionarios || null,
    dia_09: form.dia_09 || null,
    dia_10: form.dia_10 || null,
    dia_11: form.dia_11 || null,
    dia_12: form.dia_12 || null,
    dia_13: form.dia_13 || null,
    dia_14: form.dia_14 || null,
    dia_15: form.dia_15 || null,
  })

  const buildUpdatePayload = () => ({
    pasajero_id: form.pasajero_id.trim(),
    empresa: form.empresa || null,
    proceso: form.proceso || null,
    cargo: form.cargo || null,
    rut: form.rut || null,
    apellidos: form.apellidos || null,
    funcionarios: form.funcionarios || null,
    dia_09: form.dia_09 || null,
    dia_10: form.dia_10 || null,
    dia_11: form.dia_11 || null,
    dia_12: form.dia_12 || null,
    dia_13: form.dia_13 || null,
    dia_14: form.dia_14 || null,
    dia_15: form.dia_15 || null,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.pasajero_id?.trim()) {
      alert('Seleccione un pasajero')
      return
    }
    try {
      if (editing) {
        await turnosPersonalService.update(editing.turno_personal_id, buildUpdatePayload())
      } else {
        await turnosPersonalService.create(buildCreatePayload())
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    }
  }

  const handleDelete = async (row) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await turnosPersonalService.delete(row.turno_personal_id)
      await loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const proyectoLabel = (pid) => proyectos.find((p) => p.proyecto_id === pid)?.nombre || pid || '—'

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
        title="Turnos Personal"
        description={
          contextHorarioImportacionId
            ? `Registros cargados para la importación ${contextHorarioImportacionId}.`
            : 'Gestión de registros cargados/creados manualmente.'
        }
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo registro
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Empresa</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proceso</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Cargo</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">RUT</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Apellidos</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Funcionarios</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No hay registros
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.turno_personal_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">{proyectoLabel(r.proyecto_id)}</td>
                  <td className="py-3 px-4 text-muted">{r.empresa || '—'}</td>
                  <td className="py-3 px-4 text-muted">{r.proceso || '—'}</td>
                  <td className="py-3 px-4 text-muted">{r.cargo || '—'}</td>
                  <td className="py-3 px-4 text-muted">{r.rut || '—'}</td>
                  <td className="py-3 px-4 text-muted">{r.apellidos || '—'}</td>
                  <td className="py-3 px-4 text-muted">{r.funcionarios || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(r)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleDelete(r)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar registro' : 'Nuevo registro'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Proyecto"
            options={proyectoOptions}
            value={form.proyecto_id || selectedProyectoId || ''}
            onChange={(e) => {
              const pid = e.target.value
              setForm((f) => ({ ...f, proyecto_id: pid, pasajero_id: '' }))
              fetchPasajeros(pid)
            }}
            disabled={!!editing || !!selectedProyectoId}
            required
          />
          <Input
            label="Horario importación ID"
            value={form.horario_importacion_id}
            onChange={(e) => setForm({ ...form, horario_importacion_id: e.target.value })}
            disabled={!!editing || !!horarioImportacionIdParam}
            placeholder="horario_importacion_id"
            required
          />
          <Select
            label="Pasajero"
            options={pasajeroOptions}
            value={form.pasajero_id}
            onChange={(e) => setForm({ ...form, pasajero_id: e.target.value })}
            disabled={!(form.proyecto_id || selectedProyectoId) || loadingPasajeros}
            placeholder="Seleccionar pasajero"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
            <Input label="Proceso" value={form.proceso} onChange={(e) => setForm({ ...form, proceso: e.target.value })} />
            <Input label="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            <Input label="RUT" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
            <Input label="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
            <Input
              label="Funcionarios"
              value={form.funcionarios}
              onChange={(e) => setForm({ ...form, funcionarios: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Día 09" value={form.dia_09} onChange={(e) => setForm({ ...form, dia_09: e.target.value })} />
            <Input label="Día 10" value={form.dia_10} onChange={(e) => setForm({ ...form, dia_10: e.target.value })} />
            <Input label="Día 11" value={form.dia_11} onChange={(e) => setForm({ ...form, dia_11: e.target.value })} />
            <Input label="Día 12" value={form.dia_12} onChange={(e) => setForm({ ...form, dia_12: e.target.value })} />
            <Input label="Día 13" value={form.dia_13} onChange={(e) => setForm({ ...form, dia_13: e.target.value })} />
            <Input label="Día 14" value={form.dia_14} onChange={(e) => setForm({ ...form, dia_14: e.target.value })} />
            <Input label="Día 15" value={form.dia_15} onChange={(e) => setForm({ ...form, dia_15: e.target.value })} />
          </div>

          <AuditoriaSection data={editingFull} />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={loadingPasajeros || !form.pasajero_id?.trim()}
            >
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default TurnosPersonal

