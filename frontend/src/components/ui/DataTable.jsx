import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, FileText, Pencil, Trash2 } from 'lucide-react'
import Button from './Button'
import Card from './Card'
import { exportDataTableExcel, exportDataTablePdf } from '../../utils/exportDataTable'

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100]

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

/** Badge Activo / Inactivo */
export function StatusBadge({ activo }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs ${
        activo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/30 text-muted'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

/** Columna Acciones estándar (editar / eliminar) */
export function makeActionsColumn({ onEdit, onDelete, editDisabled, deleteDisabled } = {}) {
  return {
    id: 'acciones',
    header: 'Acciones',
    enableSorting: false,
    enableColumnFilter: false,
    meta: { export: false },
    cell: ({ row }) => {
      const item = row.original
      const noEdit = typeof editDisabled === 'function' ? editDisabled(item) : !!editDisabled
      const noDel = typeof deleteDisabled === 'function' ? deleteDisabled(item) : !!deleteDisabled
      return (
        <div className="flex justify-end gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => onEdit(item)}
              disabled={noEdit}
              aria-label="Editar"
            />
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-600" />}
              onClick={() => onDelete(item)}
              disabled={noDel}
              aria-label="Eliminar"
            />
          )}
        </div>
      )
    },
  }
}

/**
 * Tabla con Mostrar N, Excel/PDF, Buscar global, orden, filtros por columna y paginación.
 *
 * @param {object} props
 * @param {any[]} props.data
 * @param {import('@tanstack/react-table').ColumnDef[]} props.columns
 * @param {string} [props.exportFileName]
 * @param {string} [props.exportTitle]
 * @param {string} [props.emptyMessage]
 * @param {(row: any) => string} [props.getRowId]
 * @param {number[]} [props.pageSizeOptions]
 * @param {number} [props.initialPageSize]
 * @param {string} [props.tableMinWidth] — p.ej. 'min-w-[1200px]'
 * @param {string} [props.className] — clases extra en Card
 * @param {boolean} [props.enableExport=true]
 */
export default function DataTable({
  data,
  columns,
  exportFileName = 'export',
  exportTitle = 'Exportación',
  emptyMessage = 'No hay registros',
  getRowId,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  initialPageSize = 10,
  tableMinWidth = '',
  className = '',
  enableExport = true,
}) {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const cols = useMemo(() => columns, [columns])

  const table = useReactTable({
    data,
    columns: cols,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: getRowId ? (row, index) => getRowId(row) ?? String(index) : undefined,
    globalFilterFn: 'includesString',
  })

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [data])

  const filteredCount = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const fromIdx = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const toIdx = Math.min((pageIndex + 1) * pageSize, filteredCount)
  const headerGroup = table.getHeaderGroups()[0]
  const exportDisabled = filteredCount === 0
  const hasActiveFilters = !!(globalFilter || columnFilters.some((f) => f.value))

  const handleExportExcel = async () => {
    try {
      await exportDataTableExcel(table, { fileName: exportFileName, sheetName: exportTitle })
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el Excel.')
    }
  }

  const handleExportPdf = () => {
    try {
      exportDataTablePdf(table, { fileName: exportFileName, title: exportTitle })
    } catch (e) {
      console.error(e)
      alert('No se pudo generar el PDF.')
    }
  }

  return (
    <Card className={className}>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between mb-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-muted whitespace-nowrap">
            <span>Mostrar</span>
            <select
              className="border border-primary/15 rounded-md px-2 py-1.5 bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>registros</span>
          </label>
        </div>
        {enableExport && (
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
        )}
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
        <table className={`w-full text-sm border-collapse ${tableMinWidth}`.trim()}>
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
                <td
                  colSpan={cols.length}
                  className="py-12 text-center text-muted border-t border-primary/5"
                >
                  {emptyMessage}
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
          {hasActiveFilters ? ' (filtrados)' : ''}
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
  )
}
