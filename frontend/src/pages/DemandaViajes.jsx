import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, FileText } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { demandaViajesService } from '../services/demandaViajes.service'
import { useProject } from '../contexts/ProjectContext'
import { exportDemandaViajesExcel, exportDemandaViajesPdf } from '../utils/exportDemandaViajes'

function formatHoraMin(h, m) {
  if (h == null || m == null) return '—'
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

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

const DemandaViajes = () => {
  const { selectedProyectoId, proyectos } = useProject()
  const [searchParams] = useSearchParams()
  const horarioImportacionIdParam = (searchParams.get('horario_importacion_id') || '').trim()
  const [rows, setRows] = useState([])
  const [totalFromApi, setTotalFromApi] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedProyectoId) params.proyecto_id = selectedProyectoId
      if (horarioImportacionIdParam) params.horario_importacion_id = horarioImportacionIdParam
      const { data } = await demandaViajesService.list(params)
      const items = Array.isArray(data?.items) ? data.items : []
      setRows(items)
      setTotalFromApi(typeof data?.total === 'number' ? data.total : items.length)
    } catch (err) {
      console.error(err)
      setRows([])
      setTotalFromApi(0)
    } finally {
      setLoading(false)
    }
  }, [selectedProyectoId, horarioImportacionIdParam])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [rows])

  const proyectoNombre = useCallback(
    (pid) => proyectos.find((p) => p.proyecto_id === pid)?.nombre || pid || '—',
    [proyectos]
  )

  const columns = useMemo(
    () => [
      {
        id: 'proyecto',
        accessorFn: (r) => proyectoNombre(r.proyecto_id),
        header: 'Proyecto',
        filterFn: 'includesString',
      },
      {
        id: 'turno',
        accessorFn: (r) => String(r.turno_codigo ?? r.turno_id ?? ''),
        header: 'Turno',
        filterFn: 'includesString',
      },
      {
        id: 'pasajero',
        accessorFn: (r) =>
          r.pasajero_id ? String(r.pasajero_nombre || r.pasajero_id) : '—',
        header: 'Pasajero',
        filterFn: 'includesString',
      },
      {
        id: 'dia',
        accessorFn: (r) => String(r.dia ?? ''),
        header: 'Día',
        filterFn: 'includesString',
      },
      {
        id: 'sector',
        accessorFn: (r) => String(r.sector ?? ''),
        header: 'Sector',
        filterFn: 'includesString',
      },
      {
        id: 'inicio',
        accessorFn: (r) => formatHoraMin(r.hora_ini, r.min_ini),
        header: 'Inicio',
        filterFn: 'includesString',
      },
      {
        id: 'anio',
        accessorFn: (r) => (r.anio != null ? String(r.anio) : ''),
        header: 'Año',
        filterFn: 'includesString',
      },
      {
        id: 'semana',
        accessorFn: (r) => (r.numero_semana != null ? String(r.numero_semana) : ''),
        header: 'Sem.',
        filterFn: 'includesString',
      },
      {
        id: 'tipo',
        accessorFn: (r) => String(r.tipo || ''),
        header: 'Tipo',
        filterFn: 'includesString',
      },
    ],
    [proyectoNombre]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    defaultColumn: {
      cell: (info) => info.getValue(),
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
  const truncated = totalFromApi > rows.length
  const exportDisabled = loading || filteredCount === 0

  const handleExportExcel = async () => {
    try {
      await exportDemandaViajesExcel(table)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el archivo Excel.')
    }
  }

  const handleExportPdf = () => {
    try {
      exportDemandaViajesPdf(table)
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el PDF.')
    }
  }

  const toolbar = (
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
  )

  const footerStatus = (
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
  )

  return (
    <>
      {loading && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
          aria-label="Cargando demanda de viajes"
        >
          <div className="rounded-xl bg-white px-8 py-6 shadow-card-hover">
            <Spinner size="lg" />
          </div>
        </div>
      )}
      <PageHeader
        title="Demanda Viajes"
        description={
          horarioImportacionIdParam
            ? `Demanda de viajes filtrada por importación ${horarioImportacionIdParam}.`
            : selectedProyectoId
              ? 'Consulta de demanda de viajes (solo lectura) filtrada por proyecto.'
              : 'Consulta de demanda de viajes según sus permisos de proyecto.'
        }
      />

      <Card className={loading ? 'pointer-events-none opacity-60' : ''}>
        {truncated && (
          <p className="text-sm text-amber-700 dark:text-amber-400/90 mb-3">
            Hay {totalFromApi} registro{totalFromApi === 1 ? '' : 's'} en total; se cargaron {rows.length}. Acote por
            proyecto o importación para trabajar con un conjunto menor, o contacte al administrador si necesita más de{' '}
            {rows.length} filas en pantalla.
          </p>
        )}
        {toolbar}
        <div className="overflow-x-auto border border-primary/10 rounded-md">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-primary/15">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className="text-left py-2 px-2 font-heading text-primary font-semibold border-b border-primary/10 whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
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
                      )}
                    </th>
                  )
                })}
              </tr>
              <tr className="bg-bg border-b border-primary/10">
                {headerGroup.headers.map((header) => (
                  <th key={`f-${header.id}`} className="p-1.5 align-middle">
                    <input
                      type="text"
                      className="w-full min-w-[4rem] border border-primary/15 rounded px-2 py-1 text-xs bg-bg text-fg focus:outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="Filtrar…"
                      value={header.column.getFilterValue() ?? ''}
                      onChange={(e) => header.column.setFilterValue(e.target.value)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-muted border-t border-primary/5">
                    No hay registros de demanda de viajes
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
                    <td key={cell.id} className="py-2 px-2 align-middle whitespace-nowrap max-w-[16rem] truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {footerStatus}
      </Card>
    </>
  )
}

export default DemandaViajes
