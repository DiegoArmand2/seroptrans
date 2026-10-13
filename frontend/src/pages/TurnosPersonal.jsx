import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import AuditoriaSection from '../components/ui/AuditoriaSection'
import PasajeroSearchSelect from '../components/ui/PasajeroSearchSelect'
import { turnosPersonalService } from '../services/turnosPersonal.service'
import { proyectosService } from '../services/proyectos.service'
import { horariosService } from '../services/horarios.service'
import { useProject } from '../contexts/ProjectContext'
import { usePermissions } from '../hooks/usePermissions'
import { getErrorMessage } from '../utils/apiError'
import { exportTurnosPersonalExcel, exportTurnosPersonalPdf } from '../utils/exportTurnosPersonal'

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
  const navigate = useNavigate()
  const { selectedProyectoId } = useProject()
  const { hasProceso } = usePermissions()
  const puedeEditarTurnosPersonalConfirmado = hasProceso('editar_turnos_personal_confirmado')
  const [searchParams] = useSearchParams()
  const horarioImportacionIdParam = (searchParams.get('horario_importacion_id') || '').trim()

  const [importacionDetail, setImportacionDetail] = useState(null)
  const [rows, setRows] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  /** Modal para Procesar / Rutas batch: idle | loading | success | error */
  const [procesarModal, setProcesarModal] = useState({
    open: false,
    phase: 'idle',
    importacionId: null,
    kind: null, // 'procesar' | 'rutas_batch'
  })
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
    } catch (err) {
      console.error(err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [selectedProyectoId, horarioImportacionIdParam])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [rows, selectedProyectoId, horarioImportacionIdParam])

  useEffect(() => {
    const id = horarioImportacionIdParam
    if (!id) {
      setImportacionDetail(null)
      return
    }
    let cancelled = false
    horariosService
      .getImportacion(id)
      .then(({ data }) => {
        if (!cancelled) setImportacionDetail(data)
      })
      .catch(() => {
        if (!cancelled) setImportacionDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [horarioImportacionIdParam])

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
  }

  const openEdit = useCallback(async (row) => {
    setEditing(row)
    setEditingFull(null)
    setForm(
      emptyForm({
        ...row,
        pasajero_id: row.pasajero_id || '',
      })
    )
    setModalOpen(true)
    try {
      const { data } = await turnosPersonalService.get(row.turno_personal_id)
      setEditingFull(data)
      setForm(emptyForm({ ...data, pasajero_id: data.pasajero_id || '' }))
    } catch {
      setEditingFull(row)
    }
  }, [])

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
    const currentHorarioImportacionId = String(form.horario_importacion_id || '').trim()
    const currentPasajeroId = String(form.pasajero_id || '').trim()
    if (currentHorarioImportacionId && currentPasajeroId) {
      const dup = rows.some((r) => {
        if (editing && r.turno_personal_id === editing.turno_personal_id) return false
        return (
          String(r.horario_importacion_id || '').trim() === currentHorarioImportacionId &&
          String(r.pasajero_id || '').trim() === currentPasajeroId
        )
      })
      if (dup) {
        alert('Este pasajero ya tiene un registro para esta importación')
        return
      }
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

  const handleDelete = useCallback(
    async (row) => {
      if (!confirm('¿Eliminar este registro?')) return
      try {
        await turnosPersonalService.delete(row.turno_personal_id)
        await loadData()
      } catch (err) {
        alert(getErrorMessage(err) || 'Error al eliminar')
      }
    },
    [loadData]
  )

  const proyectoNombre = useCallback(
    (pid) => proyectos.find((p) => p.proyecto_id === pid)?.nombre || pid || '—',
    [proyectos]
  )

  const importacionConfirmada =
    !!horarioImportacionIdParam && importacionDetail && (importacionDetail.estado || 'DR') === 'CO'

  const horarioContextLocked = importacionConfirmada && !puedeEditarTurnosPersonalConfirmado

  const showConfirmarBtn =
    !!horarioImportacionIdParam &&
    importacionDetail &&
    (importacionDetail.estado || 'DR') === 'DR' &&
    hasProceso('confirmar_horario')

  const showProcesarBtn =
    !!horarioImportacionIdParam &&
    importacionDetail &&
    (importacionDetail.estado || 'DR') === 'CO' &&
    hasProceso('procesar_horario')

  const showRutasBatchBtn = showProcesarBtn

  const handleConfirmarHorario = async () => {
    const id = horarioImportacionIdParam
    if (!id) return
    try {
      await horariosService.confirmarImportacion(id)
      const { data } = await horariosService.getImportacion(id)
      setImportacionDetail(data)
      await loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'No se pudo confirmar')
    }
  }

  const resetProcesarModal = () => {
    setProcesarModal({ open: false, phase: 'idle', importacionId: null, kind: null })
  }

  const handleProcesarAceptar = () => {
    if (
      procesarModal.phase === 'success' &&
      procesarModal.kind === 'procesar' &&
      procesarModal.importacionId
    ) {
      navigate(
        `/demanda-viajes?horario_importacion_id=${encodeURIComponent(procesarModal.importacionId)}`
      )
    }
    resetProcesarModal()
  }

  const handleProcesarHorario = async () => {
    const id = horarioImportacionIdParam
    if (!id) return
    setProcesarModal({ open: true, phase: 'loading', importacionId: id, kind: 'procesar' })
    try {
      await horariosService.procesarImportacion(id)
      setProcesarModal({ open: true, phase: 'success', importacionId: id, kind: 'procesar' })
    } catch (err) {
      console.error(err)
      setProcesarModal({ open: true, phase: 'error', importacionId: id, kind: 'procesar' })
    }
  }

  const handleRutasBatch = async () => {
    const id = horarioImportacionIdParam
    if (!id) return
    setProcesarModal({ open: true, phase: 'loading', importacionId: id, kind: 'rutas_batch' })
    try {
      await horariosService.rutasBatchImportacion(id)
      setProcesarModal({ open: true, phase: 'success', importacionId: id, kind: 'rutas_batch' })
    } catch (err) {
      console.error(err)
      setProcesarModal({ open: true, phase: 'error', importacionId: id, kind: 'rutas_batch' })
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'proyecto',
        accessorFn: (r) => proyectoNombre(r.proyecto_id),
        header: 'Proyecto',
        filterFn: 'includesString',
      },
      {
        id: 'empresa',
        accessorFn: (r) => String(r.empresa ?? ''),
        header: 'Empresa',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'proceso',
        accessorFn: (r) => String(r.proceso ?? ''),
        header: 'Proceso',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'cargo',
        accessorFn: (r) => String(r.cargo ?? ''),
        header: 'Cargo',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'rut',
        accessorFn: (r) => String(r.rut ?? ''),
        header: 'RUT',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'funcionarios',
        accessorFn: (r) => String(r.funcionarios ?? ''),
        header: 'Funcionarios',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'lunes',
        accessorFn: (r) => String(r.dia_09 ?? ''),
        header: 'Lunes',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'martes',
        accessorFn: (r) => String(r.dia_10 ?? ''),
        header: 'Martes',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'miercoles',
        accessorFn: (r) => String(r.dia_11 ?? ''),
        header: 'Miércoles',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'jueves',
        accessorFn: (r) => String(r.dia_12 ?? ''),
        header: 'Jueves',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'viernes',
        accessorFn: (r) => String(r.dia_13 ?? ''),
        header: 'Viernes',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'sabado',
        accessorFn: (r) => String(r.dia_14 ?? ''),
        header: 'Sábado',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'domingo',
        accessorFn: (r) => String(r.dia_15 ?? ''),
        header: 'Domingo',
        filterFn: 'includesString',
        cell: (info) => info.getValue() || '—',
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Pencil className="w-4 h-4" />}
                onClick={() => openEdit(r)}
                disabled={horarioContextLocked}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4 text-red-600" />}
                onClick={() => handleDelete(r)}
                disabled={horarioContextLocked}
              />
            </div>
          )
        },
      },
    ],
    [proyectoNombre, horarioContextLocked, openEdit, handleDelete]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const headerGroup = table.getHeaderGroups()[0]
  const filteredCount = table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const fromIdx = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const toIdx = Math.min((pageIndex + 1) * pageSize, filteredCount)
  const exportDisabled = loading || filteredCount === 0

  const handleExportExcel = async () => {
    try {
      await exportTurnosPersonalExcel(table)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el archivo Excel.')
    }
  }

  const handleExportPdf = () => {
    try {
      exportTurnosPersonalPdf(table)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el PDF.')
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
      {procesarModal.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-busy={procesarModal.phase === 'loading'}
          aria-labelledby="procesar-turnos-title"
          aria-live="polite"
        >
          <div className="relative w-full max-w-md rounded-xl bg-white p-8 text-center shadow-card-hover">
            {procesarModal.phase === 'loading' && (
              <>
                <div className="mb-4 flex justify-center">
                  <Spinner size="lg" />
                </div>
                <p id="procesar-turnos-title" className="text-lg font-heading font-semibold text-primary">
                  {procesarModal.kind === 'rutas_batch' ? 'Procesando rutas batch.....' : 'Procesando.....'}
                </p>
              </>
            )}
            {procesarModal.phase === 'success' && (
              <>
                <p id="procesar-turnos-title" className="text-lg font-heading font-semibold text-primary mb-6">
                  {procesarModal.kind === 'rutas_batch'
                    ? 'Batch de rutas completado con éxito'
                    : 'Proceso completado con exito'}
                </p>
                <Button variant="accent" type="button" onClick={handleProcesarAceptar}>
                  Aceptar
                </Button>
              </>
            )}
            {procesarModal.phase === 'error' && (
              <>
                <p id="procesar-turnos-title" className="text-lg font-heading font-semibold text-primary mb-6">
                  {procesarModal.kind === 'rutas_batch'
                    ? 'Batch de rutas fallido, intente nuevamente'
                    : 'Proceso fallido, intente nuevamente'}
                </p>
                <Button variant="accent" type="button" onClick={handleProcesarAceptar}>
                  Aceptar
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      <PageHeader
        title="Turnos Personal"
        description={
          contextHorarioImportacionId
            ? `Registros cargados para la importación ${contextHorarioImportacionId}.`
            : 'Gestión de registros cargados/creados manualmente.'
        }
        children={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {showConfirmarBtn && (
              <Button variant="accent" onClick={handleConfirmarHorario}>
                Confirmar
              </Button>
            )}
            {showProcesarBtn && (
              <Button variant="outline" onClick={handleProcesarHorario}>
                Procesar
              </Button>
            )}
            {showRutasBatchBtn && (
              <Button variant="outline" onClick={handleRutasBatch}>
                Rutas batch
              </Button>
            )}
            <Button
              icon={<Plus className="w-5 h-5" />}
              onClick={openCreate}
              disabled={horarioContextLocked}
            >
              Nuevo registro
            </Button>
          </div>
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
                  table.setPageSize(Number(e.target.value))
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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              disabled={exportDisabled}
              onClick={handleExportExcel}
            >
              Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4" />}
              disabled={exportDisabled}
              onClick={handleExportPdf}
            >
              PDF
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <label className="flex flex-1 min-w-[12rem] items-center gap-2 lg:flex-initial lg:max-w-md">
              <span className="text-muted whitespace-nowrap">Buscar:</span>
              <input
                type="search"
                className="w-full border border-primary/15 rounded-md px-3 py-1.5 bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Texto en cualquier columna…"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto border border-primary/10 rounded-md">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-primary/15">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      className={`text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap ${
                        header.id === 'acciones' ? 'text-right' : ''
                      }`}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:opacity-80"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {!sorted && <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />}
                          {sorted === 'asc' && <ArrowUp className="h-3.5 w-3.5" aria-hidden />}
                          {sorted === 'desc' && <ArrowDown className="h-3.5 w-3.5" aria-hidden />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
              <tr className="bg-bg border-b border-primary/10">
                {headerGroup.headers.map((header) => (
                  <th key={`f-${header.id}`} className="p-1.5 align-middle">
                    {header.column.getCanFilter() ? (
                      <input
                        type="text"
                        className="w-full min-w-[4rem] border border-primary/15 rounded px-2 py-1 text-xs bg-bg text-fg focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="Filtrar…"
                        value={header.column.getFilterValue() ?? ''}
                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-muted border-t border-primary/5">
                    No hay registros
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-primary/10 hover:bg-primary/5 ${
                    i % 2 === 1 ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`py-2 px-2 align-middle whitespace-nowrap max-w-[16rem] truncate ${
                        cell.column.id === 'acciones' ? 'text-right' : 'text-muted'
                      } ${cell.column.id === 'proyecto' ? 'text-fg' : ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mt-3 text-sm text-muted">
          <p>
            Mostrando {fromIdx} a {toIdx} de {filteredCount} registro{filteredCount === 1 ? '' : 's'}
            {globalFilter || columnFilters.some((f) => f.value) ? ' (filtrados)' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-1 justify-end">
            <button
              type="button"
              className="px-2 py-1 rounded border border-primary/15 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </button>
            {pageCount > 1 &&
              paginationRange(pageIndex, pageCount).map((item, idx) =>
                item === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`min-w-[2rem] px-2 py-1 rounded border ${
                      pageIndex === item
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-primary/15 hover:bg-primary/5'
                    }`}
                    onClick={() => table.setPageIndex(item)}
                  >
                    {item + 1}
                  </button>
                )
              )}
            <button
              type="button"
              className="px-2 py-1 rounded border border-primary/15 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar registro' : 'Nuevo registro'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {horarioContextLocked && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Este horario está confirmado: solo lectura.
            </p>
          )}
          {importacionConfirmada && !horarioContextLocked && (
            <p className="text-sm text-primary/90 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
              Horario confirmado. Puede modificar registros porque su rol incluye el permiso correspondiente.
            </p>
          )}
          <Select
            label="Proyecto"
            options={proyectoOptions}
            value={form.proyecto_id || selectedProyectoId || ''}
            onChange={(e) => {
              const pid = e.target.value
              setForm((f) => ({ ...f, proyecto_id: pid, pasajero_id: '' }))
            }}
            disabled={!!editing || !!selectedProyectoId || horarioContextLocked}
            required
          />
          <Input
            label="Horario importación ID"
            value={form.horario_importacion_id}
            onChange={(e) => setForm({ ...form, horario_importacion_id: e.target.value })}
            disabled={!!editing || !!horarioImportacionIdParam || horarioContextLocked}
            placeholder="horario_importacion_id"
            required
          />
          <PasajeroSearchSelect
            label="Pasajero"
            proyectoId={form.proyecto_id || selectedProyectoId || ''}
            value={form.pasajero_id}
            onChange={(p) => {
              const pasajeroId = p?.pasajero_id || ''
              setForm((f) => ({
                ...f,
                pasajero_id: pasajeroId,
                rut: p?.cedula || '',
                apellidos: p?.nombre || '',
                funcionarios: p?.nombre || '',
              }))
            }}
            disabled={horarioContextLocked}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Proceso" value={form.proceso} onChange={(e) => setForm({ ...form, proceso: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} disabled={horarioContextLocked} />
            <Input label="RUT" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} disabled={horarioContextLocked} />
            <Input
              label="Funcionarios"
              value={form.funcionarios}
              onChange={(e) => setForm({ ...form, funcionarios: e.target.value })}
              disabled={horarioContextLocked}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Lunes" value={form.dia_09} onChange={(e) => setForm({ ...form, dia_09: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Martes" value={form.dia_10} onChange={(e) => setForm({ ...form, dia_10: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Miércoles" value={form.dia_11} onChange={(e) => setForm({ ...form, dia_11: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Jueves" value={form.dia_12} onChange={(e) => setForm({ ...form, dia_12: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Viernes" value={form.dia_13} onChange={(e) => setForm({ ...form, dia_13: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Sábado" value={form.dia_14} onChange={(e) => setForm({ ...form, dia_14: e.target.value })} disabled={horarioContextLocked} />
            <Input label="Domingo" value={form.dia_15} onChange={(e) => setForm({ ...form, dia_15: e.target.value })} disabled={horarioContextLocked} />
          </div>

          <AuditoriaSection data={editingFull} />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={horarioContextLocked || !form.pasajero_id?.trim()}
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
