import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileSpreadsheet, Upload, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { horariosService } from '../services/horarios.service'
import { useProject } from '../contexts/ProjectContext'
import { usePermissions } from '../hooks/usePermissions'
import { getErrorMessage } from '../utils/apiError'
import {
  isoWeekRangeLabel,
  isoWeeksInIsoYear,
  mondayOfIsoWeekAsLocalDateString,
  toIsoYearWeekFromDate,
} from '../utils/isoWeek'

/** Semana por defecto al abrir: la ISO de hoy si coincide el año ISO con el año calendario en curso; si no, 1 (borde de año). */
function semanaInicialParaAnioEnCurso(anioCalendario) {
  const { isoYear, week } = toIsoYearWeekFromDate(new Date())
  return String(isoYear === anioCalendario ? week : 1)
}

const Horarios = () => {
  const navigate = useNavigate()
  const anioEnCurso = new Date().getFullYear()
  const { selectedProyectoId, proyectos, loading: proyectosLoading } = useProject()
  const { hasProceso } = usePermissions()
  const puedeEditarHorariosConfirmados = hasProceso('editar_horarios_confirmados')
  const [importaciones, setImportaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProyectoId, setModalProyectoId] = useState('')
  const [numeroSemana, setNumeroSemana] = useState(() => semanaInicialParaAnioEnCurso(new Date().getFullYear()))
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef(null)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingImport, setEditingImport] = useState(null)
  const [editForm, setEditForm] = useState({ anio: anioEnCurso, numero_semana: '1', url: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editImporting, setEditImporting] = useState(false)
  const [editUploadingFile, setEditUploadingFile] = useState(false)
  const editFileInputRef = useRef(null)

  const maxSemanas = useMemo(() => isoWeeksInIsoYear(anioEnCurso), [anioEnCurso])
  const maxSemanasEdit = useMemo(() => isoWeeksInIsoYear(Number(editForm.anio) || anioEnCurso), [editForm.anio, anioEnCurso])

  function paginationRange(pageIndex, pageCount) {
    if (pageCount <= 9) {
      return Array.from({ length: pageCount }, (_, i) => i)
    }
    const delta = 2
    const range = []
    for (let i = 0; i < pageCount; i += 1) {
      if (i === 0 || i === pageCount - 1 || (i >= pageIndex - delta && i <= pageIndex + delta)) {
        range.push(i)
      }
    }
    const out = []
    let prev = -2
    for (const i of range) {
      if (prev >= 0 && i - prev > 1) out.push('gap')
      out.push(i)
      prev = i
    }
    return out
  }

  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const { data } = await horariosService.listImportaciones(params)
      setImportaciones(data || [])
    } catch (err) {
      console.error(err)
      setImportaciones([])
    } finally {
      setLoading(false)
    }
  }, [selectedProyectoId])

  useEffect(() => {
    if (!proyectosLoading) {
      loadData()
    }
  }, [proyectosLoading, loadData])

  useEffect(() => {
    setPageIndex(0)
  }, [importaciones, selectedProyectoId])

  const openCreate = () => {
    setModalProyectoId(selectedProyectoId || '')
    setNumeroSemana(semanaInicialParaAnioEnCurso(new Date().getFullYear()))
    setUrl('')
    setResultado(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setResultado(null)
  }

  const proyectoImportarId = selectedProyectoId || modalProyectoId

  useEffect(() => {
    const w = Number(numeroSemana)
    if (numeroSemana === '' || Number.isNaN(w)) return
    if (w > maxSemanas) setNumeroSemana(String(maxSemanas))
    if (w < 1 && maxSemanas >= 1) setNumeroSemana('1')
  }, [maxSemanas, numeroSemana])

  const handleSemanaChange = (e) => {
    const t = e.target.value
    if (t === '') {
      setNumeroSemana('')
      return
    }
    const n = Number.parseInt(t, 10)
    if (!Number.isFinite(n)) return
    setNumeroSemana(String(Math.min(maxSemanas, Math.max(1, n))))
  }

  const handleSemanaBlur = () => {
    if (numeroSemana === '' || Number(numeroSemana) < 1) {
      setNumeroSemana('1')
    }
  }

  const handleArchivoSeleccionado = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingFile(true)
    try {
      const { data } = await horariosService.subirArchivo(file)
      if (data?.url) {
        setUrl(data.url)
      }
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al subir el archivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const openEditImportacion = async (row) => {
    const confirmado = (row.estado || 'DR') === 'CO'
    if (confirmado && !puedeEditarHorariosConfirmados) return
    setEditingImport(row)
    setEditForm({
      anio: row.anio ?? anioEnCurso,
      numero_semana: String(row.numero_semana ?? 1),
      url: row.url_archivo ?? '',
    })
    setEditModalOpen(true)
    try {
      const { data } = await horariosService.getImportacion(row.horario_importacion_id)
      setEditForm({
        anio: data.anio ?? anioEnCurso,
        numero_semana: String(data.numero_semana ?? 1),
        url: data.url_archivo ?? '',
      })
    } catch {
      /* usar datos del listado */
    }
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingImport(null)
  }

  const handleEditSemanaChange = (e) => {
    const t = e.target.value
    if (t === '') {
      setEditForm((f) => ({ ...f, numero_semana: '' }))
      return
    }
    const n = Number.parseInt(t, 10)
    if (!Number.isFinite(n)) return
    setEditForm((f) => ({
      ...f,
      numero_semana: String(Math.min(maxSemanasEdit, Math.max(1, n))),
    }))
  }

  const handleEditSemanaBlur = () => {
    setEditForm((f) => {
      if (f.numero_semana === '' || Number(f.numero_semana) < 1) {
        return { ...f, numero_semana: '1' }
      }
      return f
    })
  }

  const handleEditArchivoSeleccionado = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setEditUploadingFile(true)
    try {
      const { data } = await horariosService.subirArchivo(file)
      if (data?.url) setEditForm((f) => ({ ...f, url: data.url }))
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al subir el archivo')
    } finally {
      setEditUploadingFile(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingImport) return
    const w = Number(editForm.numero_semana)
    const anio = Number(editForm.anio)
    if (!Number.isFinite(anio) || !Number.isFinite(w) || w < 1 || w > maxSemanasEdit) {
      alert('Indique año y número de semana válidos')
      return
    }
    if (!String(editForm.url || '').trim()) return
    setEditSubmitting(true)
    try {
      await horariosService.updateImportacion(editingImport.horario_importacion_id, {
        anio,
        numero_semana: w,
        url: String(editForm.url).trim(),
      })
      closeEditModal()
      await loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al guardar')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleEditImportar = async () => {
    if (!editingImport) return
    const w = Number(editForm.numero_semana)
    const anio = Number(editForm.anio)
    if (!Number.isFinite(anio) || !Number.isFinite(w) || w < 1 || w > maxSemanasEdit) {
      alert('Indique año y número de semana válidos')
      return
    }
    const urlTrim = String(editForm.url || '').trim()
    if (!urlTrim) {
      alert('Indique la URL del archivo o súbalo desde su equipo')
      return
    }
    setEditImporting(true)
    try {
      const { data } = await horariosService.importar({
        proyecto_id: editingImport.proyecto_id,
        anio,
        numero_semana: w,
        url: urlTrim,
        horario_importacion_id: editingImport.horario_importacion_id,
      })
      await loadData()
      closeEditModal()
      if (data?.code === 200 && data?.horario_importacion_id) {
        navigate(`/turnos-personal?horario_importacion_id=${encodeURIComponent(data.horario_importacion_id)}`)
      } else {
        const msg = [data?.title, data?.msg].filter(Boolean).join('\n') || 'Importación enviada.'
        alert(msg)
      }
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al importar')
    } finally {
      setEditImporting(false)
    }
  }

  const handleEliminarImportacion = async (row) => {
    if (
      !confirm(
        '¿Eliminar esta importación? También se eliminarán los registros de Turnos personal vinculados a esta carga.'
      )
    )
      return
    try {
      await horariosService.deleteImportacion(row.horario_importacion_id)
      await loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al eliminar')
    }
  }

  const handleImportar = async (e) => {
    e.preventDefault()
    if (!proyectoImportarId) {
      alert('Seleccione un proyecto')
      return
    }
    if (!url.trim()) return
    const w = Number(numeroSemana)
    if (!Number.isFinite(w) || w < 1 || w > maxSemanas) {
      alert('Indique un número de semana válido')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await horariosService.importar({
        proyecto_id: proyectoImportarId,
        anio: anioEnCurso,
        numero_semana: w,
        url: url.trim(),
      })
      setResultado(data)
      await loadData()
      if (data?.code === 200 && data?.horario_importacion_id) {
        navigate(`/turnos-personal?horario_importacion_id=${encodeURIComponent(data.horario_importacion_id)}`)
      }
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al importar')
    } finally {
      setSubmitting(false)
    }
  }

  const weekNum = Number(numeroSemana)
  const rangoSemanaActual =
    Number.isFinite(weekNum) && weekNum >= 1 && weekNum <= maxSemanas
      ? isoWeekRangeLabel(anioEnCurso, weekNum)
      : ''

  if (proyectosLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const total = importaciones.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const pagedRows = importaciones.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)
  const fromIdx = total === 0 ? 0 : safePageIndex * pageSize + 1
  const toIdx = Math.min((safePageIndex + 1) * pageSize, total)

  return (
    <>
      <PageHeader
        title="Horarios"
        description={
          selectedProyectoId
            ? 'Importaciones de planillas por proyecto (filtro superior activo).'
            : 'Todas las importaciones según sus permisos. Use Nuevo horario para importar una planilla.'
        }
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo horario
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between mb-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-muted whitespace-nowrap">
              <span>Mostrar</span>
              <select
                className="border border-primary/15 rounded-md px-2 py-1.5 bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={pageSize}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  setPageSize(n)
                  setPageIndex(0)
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>registros</span>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="overflow-x-auto border border-primary/10 rounded-md">
            <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-primary/15">
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Proyecto</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Año</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Número de semana</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Estado</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Título</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Código</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Registro</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">URL</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Turnos personal</th>
                <th className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Ver viajes</th>
                <th className="text-right py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {importaciones.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted border-t border-primary/5">
                    {selectedProyectoId ? 'No hay importaciones en este proyecto' : 'No hay importaciones'}
                  </td>
                </tr>
              )}
              {pagedRows.map((row) => {
                const lunesIso =
                  row.anio != null && row.numero_semana != null
                    ? mondayOfIsoWeekAsLocalDateString(row.anio, row.numero_semana)
                    : ''
                const confirmado = (row.estado || 'DR') === 'CO'
                return (
                <tr key={row.horario_importacion_id} className="border-b border-primary/10 hover:bg-primary/5">
                  <td className="py-2 px-2 align-middle whitespace-nowrap max-w-[16rem] truncate">
                    {proyectos.find((p) => p.proyecto_id === row.proyecto_id)?.nombre || row.proyecto_id}
                  </td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap tabular-nums" title={lunesIso ? `Lunes ISO: ${lunesIso}` : ''}>
                    {row.anio ?? '—'}
                  </td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap tabular-nums" title={lunesIso ? `Lunes ISO: ${lunesIso}` : ''}>
                    {row.numero_semana ?? '—'}
                  </td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        confirmado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {confirmado ? 'Confirmado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="py-2 px-2 align-middle text-muted max-w-[200px] truncate" title={row.respuesta_title}>
                    {row.respuesta_title ?? '—'}
                  </td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap">{row.respuesta_code ?? '—'}</td>
                  <td className="py-2 px-2 align-middle text-muted whitespace-nowrap">
                    {row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 px-2 align-middle max-w-[240px] truncate" title={row.url_archivo}>
                    {row.url_archivo}
                  </td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap">
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() =>
                        navigate(
                          `/turnos-personal?horario_importacion_id=${encodeURIComponent(row.horario_importacion_id)}`
                        )
                      }
                    >
                      Ver turnos
                    </button>
                  </td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap">
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() =>
                        navigate(
                          `/demanda-viajes?horario_importacion_id=${encodeURIComponent(row.horario_importacion_id)}`
                        )
                      }
                    >
                      Ver demanda
                    </button>
                  </td>
                  <td className="py-2 px-2 align-middle text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={() => openEditImportacion(row)}
                        aria-label="Editar importación"
                        disabled={confirmado && !puedeEditarHorariosConfirmados}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => handleEliminarImportacion(row)}
                        aria-label="Eliminar importación"
                        disabled={confirmado}
                      />
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mt-3 text-sm text-muted">
          <p>
            Mostrando {fromIdx} a {toIdx} de {total} registro{total === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap items-center gap-1 justify-end">
            <button
              type="button"
              className="px-2 py-1 rounded border border-primary/15 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={safePageIndex <= 0}
            >
              Anterior
            </button>
            {pageCount > 1 &&
              paginationRange(safePageIndex, pageCount).map((item, idx) =>
                item === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`min-w-[2rem] px-2 py-1 rounded border ${
                      safePageIndex === item
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-primary/15 hover:bg-primary/5'
                    }`}
                    onClick={() => setPageIndex(item)}
                  >
                    {item + 1}
                  </button>
                )
              )}
            <button
              type="button"
              className="px-2 py-1 rounded border border-primary/15 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none"
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePageIndex >= pageCount - 1}
            >
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      <Modal isOpen={editModalOpen} onClose={closeEditModal} title="Editar importación" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editingImport && (editingImport.estado || 'DR') === 'CO' && puedeEditarHorariosConfirmados && (
            <p className="text-sm text-primary/90 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
              Horario confirmado. Puede editar la importación porque su rol incluye el permiso correspondiente.
            </p>
          )}
          <p className="text-sm text-muted">
            Proyecto:{' '}
            <span className="font-medium text-primary">
              {editingImport
                ? proyectos.find((p) => p.proyecto_id === editingImport.proyecto_id)?.nombre ||
                  editingImport.proyecto_id
                : '—'}
            </span>
          </p>
          <Input
            label="Año"
            type="number"
            min={1900}
            max={2100}
            value={String(editForm.anio ?? '')}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              if (!Number.isFinite(n)) return
              const maxW = isoWeeksInIsoYear(n)
              setEditForm((f) => {
                const w = Number(f.numero_semana)
                let sem = f.numero_semana
                if (Number.isFinite(w) && w > maxW) sem = String(maxW)
                if (Number.isFinite(w) && w < 1) sem = '1'
                return { ...f, anio: n, numero_semana: sem }
              })
            }}
            required
          />
          <div>
            <Input
              label="Número de semana"
              type="number"
              min={1}
              max={maxSemanasEdit}
              step={1}
              value={editForm.numero_semana}
              onChange={handleEditSemanaChange}
              onBlur={handleEditSemanaBlur}
              required
            />
            <p className="text-xs text-muted mt-1.5">Entre 1 y {maxSemanasEdit} (año {editForm.anio}).</p>
          </div>
          <div>
            <Input
              label="Ubicación del archivo (URL)"
              value={editForm.url}
              onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
              required
            />
            <input
              ref={editFileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleEditArchivoSeleccionado}
            />
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                icon={<Upload className="w-4 h-4" />}
                disabled={editUploadingFile}
                onClick={() => editFileInputRef.current?.click()}
              >
                {editUploadingFile ? 'Subiendo…' : 'Cargar archivo Excel (.xls / .xlsx)'}
              </Button>
              <p className="text-xs text-muted mt-2">
                El archivo se guarda en el servidor y se rellena la URL automáticamente. n8n debe poder abrir esa URL (si
                hace falta, configure <code className="text-primary/80">PUBLIC_BASE_URL</code> en el backend).
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            El botón Importar archivo envía al webhook de n8n el JSON{' '}
            <code className="text-primary/80 text-[11px]">
              {`{ "id_proyecto": "<uuid>", "url": "<ubicación del archivo>", "horario_id": "<uuid>", "anio": 2026, "semana": 17 }`}
            </code>{' '}
            (proyecto de este registro y campo URL). En edición se reutiliza el mismo <code className="text-primary/80 text-[11px]">horario_id</code>.{' '}
            <span className="block mt-1">
              Use <span className="font-medium text-primary/90">Solo guardar</span> (abajo) si solo desea actualizar año, semana o URL sin llamar a n8n.
            </span>
          </p>
          <Button
            type="button"
            variant="accent"
            disabled={
              editImporting ||
              editSubmitting ||
              editUploadingFile ||
              !String(editForm.url || '').trim() ||
              editForm.numero_semana === '' ||
              !Number.isFinite(Number(editForm.numero_semana))
            }
            onClick={handleEditImportar}
          >
            {editImporting ? 'Importando…' : 'Importar archivo'}
          </Button>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closeEditModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={
                editSubmitting ||
                editImporting ||
                editUploadingFile ||
                !String(editForm.url || '').trim() ||
                editForm.numero_semana === '' ||
                !Number.isFinite(Number(editForm.numero_semana))
              }
            >
              {editSubmitting ? 'Guardando…' : 'Solo guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalOpen} onClose={closeModal} title="Nuevo horario" size="lg">
        <form onSubmit={handleImportar} className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-sm font-medium">Cabecera de importación</span>
          </div>
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={modalProyectoId || selectedProyectoId || ''}
            onChange={(e) => setModalProyectoId(e.target.value)}
            disabled={!!selectedProyectoId}
            required
          />
          <Input
            label="Año"
            type="text"
            readOnly
            value={String(anioEnCurso)}
            className="bg-primary/5 cursor-default"
          />
          <div>
            <Input
              label="Número de semana"
              type="number"
              min={1}
              max={maxSemanas}
              step={1}
              value={numeroSemana}
              onChange={handleSemanaChange}
              onBlur={handleSemanaBlur}
              required
            />
            <p className="text-xs text-muted mt-1.5">
              Entre 1 y {maxSemanas}.
              {rangoSemanaActual ? ` Rango aproximado: ${rangoSemanaActual}` : ''}
            </p>
          </div>
          <div>
            <Input
              label="Ubicación del archivo (URL)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=xlsx"
              required
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleArchivoSeleccionado}
            />
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                icon={<Upload className="w-4 h-4" />}
                disabled={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFile ? 'Subiendo…' : 'Cargar archivo Excel (.xls / .xlsx)'}
              </Button>
              <p className="text-xs text-muted mt-2">
                El archivo se guarda en el servidor y se rellena la URL automáticamente. n8n debe poder abrir esa URL (si
                hace falta, configure <code className="text-primary/80">PUBLIC_BASE_URL</code> en el backend).
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            El botón Importar archivo envía al webhook de n8n el JSON{' '}
            <code className="text-primary/80 text-[11px]">
              {`{ "id_proyecto": "<uuid>", "url": "<ubicación del archivo>", "horario_id": "<uuid>", "anio": 2026, "semana": 17 }`}
            </code>{' '}
            (proyecto seleccionado y campo URL). En base de datos se guardan el año y el número de semana ISO elegidos.
          </p>
          <Button
            type="submit"
            variant="accent"
            disabled={
              submitting ||
              uploadingFile ||
              !url.trim() ||
              !proyectoImportarId ||
              numeroSemana === '' ||
              !Number.isFinite(Number(numeroSemana))
            }
          >
            {submitting ? 'Importando…' : 'Importar archivo'}
          </Button>

          {resultado && (
            <div className="border-t border-primary/10 pt-4 mt-4 space-y-3 text-sm">
              <p className="font-heading font-semibold text-primary">Resultado del servicio</p>
              <div>
                <span className="font-medium text-primary">Título</span>
                <p className="mt-1 text-muted whitespace-pre-wrap">{resultado.title ?? '—'}</p>
              </div>
              <div>
                <span className="font-medium text-primary">Código</span>
                <p className="mt-1 text-muted">{resultado.code ?? '—'}</p>
              </div>
              <div>
                <span className="font-medium text-primary">Mensaje</span>
                <pre className="mt-1 p-3 rounded-lg bg-primary/5 text-primary whitespace-pre-wrap font-sans text-xs overflow-x-auto max-h-48">
                  {resultado.msg ?? '—'}
                </pre>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              {resultado ? 'Cerrar' : 'Cancelar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default Horarios
