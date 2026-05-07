import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, FileText, Plus, Pencil, Trash2, Upload } from 'lucide-react'
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
import { tiposPasajeroService } from '../services/tiposPasajero.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'
import { exportPasajerosExcel, exportPasajerosPdf } from '../utils/exportPasajeros'

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

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200]
const PASAJEROS_LIMIT = 5000

const Pasajero = () => {
  const { selectedProyectoId } = useProject()
  const [pasajeros, setPasajeros] = useState([])
  const [totalFromApi, setTotalFromApi] = useState(0)
  const [proyectos, setProyectos] = useState([])
  const [rutas, setRutas] = useState([])
  const [tiposPasajero, setTiposPasajero] = useState([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
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
    lat: '',
    lng: '',
    ruta_id: '',
    tipo_pasajero_id: '',
    horario_habitual: '',
    placa_asignada: '',
    contrasena: '',
    activo: true,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const [pRes, proyRes, rRes, tRes] = await Promise.all([
        pasajerosService.paged({ ...params, skip: 0, limit: PASAJEROS_LIMIT }),
        proyectosService.list(),
        rutasService.list(params),
        tiposPasajeroService.list(params),
      ])
      const items = Array.isArray(pRes.data?.items) ? pRes.data.items : []
      setPasajeros(items)
      setTotalFromApi(typeof pRes.data?.total === 'number' ? pRes.data.total : items.length)
      setProyectos(proyRes.data)
      setRutas(rRes.data)
      setTiposPasajero(tRes.data)
    } catch (err) {
      console.error(err)
      setPasajeros([])
      setTotalFromApi(0)
    } finally {
      setLoading(false)
    }
  }, [selectedProyectoId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [pasajeros])

  const openCreate = () => {
    setEditing(null)
    setEditingFull(null)
    setForm({
      proyecto_id: selectedProyectoId || '',
      cedula: '',
      nombre: '',
      direccion: '',
      lat: '',
      lng: '',
      ruta_id: '',
      tipo_pasajero_id: '',
      horario_habitual: '',
      placa_asignada: '',
      contrasena: '',
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
      lat: p.lat != null && p.lat !== '' ? String(p.lat) : '',
      lng: p.lng != null && p.lng !== '' ? String(p.lng) : '',
      ruta_id: p.ruta_id || '',
      tipo_pasajero_id: p.tipo_pasajero_id || '',
      horario_habitual: p.horario_habitual || '',
      placa_asignada: p.placa_asignada || '',
      contrasena: '',
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

  const parseCoord = (s) => {
    const t = String(s ?? '')
      .trim()
      .replace(/\s/g, '')
      .replace(/,/g, '.')
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }

  const buildPasajeroPayload = (forCreate) => {
    const lat = parseCoord(form.lat)
    const lng = parseCoord(form.lng)
    const pw = String(form.contrasena || '').trim()
    const payload = {
      cedula: String(form.cedula || '').trim(),
      nombre: String(form.nombre || '').trim(),
      direccion: String(form.direccion || '').trim() || null,
      lat,
      lng,
      ruta_id: form.ruta_id || null,
      tipo_pasajero_id: form.tipo_pasajero_id || null,
      horario_habitual: String(form.horario_habitual || '').trim() || null,
      placa_asignada: String(form.placa_asignada || '').trim() || null,
      activo: Boolean(form.activo),
    }
    if (forCreate) {
      payload.proyecto_id = form.proyecto_id || selectedProyectoId
      if (pw) payload.contrasena = pw
    } else if (pw) {
      payload.contrasena = pw
    }
    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await pasajerosService.update(editing.pasajero_id, buildPasajeroPayload(false))
      } else {
        await pasajerosService.create(buildPasajeroPayload(true))
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
      const { data } = await pasajerosService.importar(importProyecto, importFile)
      setImportModalOpen(false)
      setImportFile(null)
      setImportProyecto('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadData()
      const msg =
        data?.message ||
        (typeof data?.creados === 'number' && typeof data?.actualizados === 'number'
          ? `Nuevos: ${data.creados}, actualizados: ${data.actualizados}.`
          : 'Importación completada.')
      alert(msg)
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const rutasDelProyecto = form.proyecto_id
    ? rutas.filter((r) => r.proyecto_id === form.proyecto_id)
    : rutas

  const tiposDelProyecto = form.proyecto_id
    ? tiposPasajero.filter((t) => t.proyecto_id === form.proyecto_id)
    : tiposPasajero

  const proyectoMap = useMemo(() => {
    const m = new Map()
    ;(proyectos || []).forEach((p) => m.set(p.proyecto_id, p.nombre))
    return m
  }, [proyectos])

  const rutaMap = useMemo(() => {
    const m = new Map()
    ;(rutas || []).forEach((r) => m.set(r.ruta_id, r.nombre))
    return m
  }, [rutas])

  const tipoMap = useMemo(() => {
    const m = new Map()
    ;(tiposPasajero || []).forEach((t) => m.set(t.tipo_pasajero_id, `${t.codigo} — ${t.nombre}`))
    return m
  }, [tiposPasajero])

  const columns = useMemo(
    () => [
      {
        id: 'proyecto',
        accessorFn: (p) => proyectoMap.get(p.proyecto_id) || '—',
        header: 'Proyecto',
        filterFn: 'includesString',
      },
      { id: 'cedula', accessorFn: (p) => String(p.cedula ?? ''), header: 'Cédula', filterFn: 'includesString' },
      { id: 'nombre', accessorFn: (p) => String(p.nombre ?? ''), header: 'Nombre', filterFn: 'includesString' },
      {
        id: 'direccion',
        accessorFn: (p) => String(p.direccion ?? ''),
        header: 'Dirección',
        filterFn: 'includesString',
      },
      {
        id: 'lat',
        accessorFn: (p) => (p.lat != null && p.lat !== '' ? String(p.lat) : ''),
        header: 'Latitud',
        filterFn: 'includesString',
      },
      {
        id: 'lng',
        accessorFn: (p) => (p.lng != null && p.lng !== '' ? String(p.lng) : ''),
        header: 'Longitud',
        filterFn: 'includesString',
      },
      {
        id: 'ruta',
        accessorFn: (p) => (p.ruta_id ? rutaMap.get(p.ruta_id) || '' : ''),
        header: 'Ruta',
        filterFn: 'includesString',
      },
      {
        id: 'tipo_pasajero',
        accessorFn: (p) => (p.tipo_pasajero_id ? tipoMap.get(p.tipo_pasajero_id) || '' : ''),
        header: 'Tipo pasajero',
        filterFn: 'includesString',
      },
      {
        id: 'contrasena',
        accessorFn: (p) => (p.tiene_contrasena ? '••••••••' : '—'),
        header: 'Contraseña',
        filterFn: 'includesString',
      },
      {
        id: 'estado',
        accessorFn: (p) => (p.activo ? 'Activo' : 'Inactivo'),
        header: 'Estado',
        filterFn: 'includesString',
        cell: (info) => {
          const val = info.row.original?.activo ? 'Activo' : 'Inactivo'
          const active = info.row.original?.activo
          return (
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs ${
                active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'
              }`}
            >
              {val}
            </span>
          )
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        enableColumnFilter: false,
        cell: (info) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => openEdit(info.row.original)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-600" />}
              onClick={() => handleDelete(info.row.original.pasajero_id)}
            />
          </div>
        ),
      },
    ],
    [handleDelete, openEdit, proyectoMap, rutaMap, tipoMap]
  )

  const table = useReactTable({
    data: pasajeros,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    defaultColumn: {
      cell: (info) => (info.getValue() == null || info.getValue() === '' ? '—' : info.getValue()),
    },
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
  const truncated = totalFromApi > pasajeros.length
  const exportDisabled = loading || filteredCount === 0

  const handleExportExcel = async () => {
    try {
      await exportPasajerosExcel(table)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el archivo Excel.')
    }
  }

  const handleExportPdf = () => {
    try {
      exportPasajerosPdf(table)
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

      <Card className={loading ? 'pointer-events-none opacity-60' : ''}>
        {truncated && (
          <p className="text-sm text-amber-700 dark:text-amber-400/90 mb-3">
            Hay {totalFromApi} registro{totalFromApi === 1 ? '' : 's'} en total; se cargaron {pasajeros.length}. Acote
            por proyecto o contacte al administrador si necesita más de {pasajeros.length} filas en pantalla.
          </p>
        )}

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
            <label className="flex flex-1 min-w-[12rem] items-center gap-2 lg:flex-initial lg:max-w-xl xl:max-w-2xl">
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

        <div className="overflow-x-auto border border-primary/10 rounded-md min-h-[55vh]">
          <table className="w-full text-base border-collapse min-w-[1520px]">
            <thead>
              <tr className="bg-primary/5 border-b border-primary/15">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  const isActions = header.column.id === 'acciones'
                  return (
                    <th
                      key={header.id}
                      className={`text-left py-3 px-3 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap ${
                        isActions
                          ? 'text-right sticky right-0 z-30 bg-primary/5 border-l border-primary/15 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.12)] min-w-[9rem]'
                          : ''
                      }`}
                    >
                      {header.isPlaceholder ? null : canSort && !isActions ? (
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
                  <th
                    key={`f-${header.id}`}
                    className={`p-2 align-middle ${
                      header.column.id === 'acciones'
                        ? 'sticky right-0 z-30 bg-bg border-l border-primary/15 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.12)] min-w-[9rem]'
                        : ''
                    }`}
                  >
                    {header.column.getCanFilter() ? (
                      <input
                        type="text"
                        className="w-full min-w-[5rem] border border-primary/15 rounded px-2 py-1.5 text-sm bg-bg text-fg focus:outline-none focus:ring-1 focus:ring-primary/30"
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
                    {selectedProyectoId ? 'No hay pasajeros en este proyecto' : 'No hay pasajeros'}
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`group border-b border-primary/10 hover:bg-primary/5 ${
                    i % 2 === 1 ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`py-3 px-3 align-middle ${
                        cell.column.id === 'acciones'
                          ? `text-right whitespace-nowrap sticky right-0 z-20 min-w-[9rem] border-l border-primary/15 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.1)] group-hover:bg-primary/5 ${
                              i % 2 === 1 ? 'bg-primary/[0.03]' : 'bg-white'
                            }`
                          : 'max-w-[min(28rem,40vw)] whitespace-normal break-words [overflow-wrap:anywhere]'
                      }`}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar pasajero' : 'Nuevo pasajero'} size="xl">
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
          <div className="pt-2 border-t border-primary/10">
            <p className="text-sm font-medium text-primary mb-3">Ubicación y acceso del pasajero</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitud"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              placeholder="Ej. -0.22985"
            />
            <Input
              label="Longitud"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              placeholder="Ej. -78.52495"
            />
          </div>
          <Input
            type="password"
            label="Contraseña"
            value={form.contrasena}
            onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
            placeholder={editing ? 'Vacío = sin cambios' : 'Opcional'}
            autoComplete="new-password"
          />
          {editing && (
            <p className="text-xs text-muted -mt-2">
              Si ya tiene contraseña, deje el campo vacío para conservarla; escriba una nueva solo si desea reemplazarla.
            </p>
          )}
          <Select
            label="Ruta asignada"
            options={rutasDelProyecto.map((r) => ({ value: r.ruta_id, label: r.nombre }))}
            value={form.ruta_id}
            onChange={(e) => setForm({ ...form, ruta_id: e.target.value })}
            placeholder="Sin asignar"
          />
          <Select
            label="Tipo de pasajero"
            options={tiposDelProyecto.map((t) => ({ value: t.tipo_pasajero_id, label: `${t.codigo} — ${t.nombre}` }))}
            value={form.tipo_pasajero_id}
            onChange={(e) => setForm({ ...form, tipo_pasajero_id: e.target.value })}
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
            Columnas: cedula, nombre, direccion (opc), lat/latitud, lng/longitud (opc), contrasena (opc), ruta (nombre de la ruta en el proyecto, opc), horario_habitual (opc), placa_asignada (opc). La columna ruta_id sigue admitida por compatibilidad. Si la cédula ya existe en el proyecto, el registro se actualiza con los datos de la fila (contraseña vacía no cambia la actual).
          </p>
          <p className="text-sm">
            <a
              href={`${import.meta.env.BASE_URL}plantilla_pasajeros.csv`}
              download="plantilla_pasajeros.csv"
              className="text-primary font-medium underline hover:opacity-90"
            >
              Descargar plantilla CSV
            </a>
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
