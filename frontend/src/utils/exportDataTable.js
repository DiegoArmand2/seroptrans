import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function cellDisplay(v) {
  if (v == null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  return String(v)
}

function stampFilename(prefix, ext) {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}.${ext}`
}

/** Columnas exportables: excluye acciones y meta.export === false */
export function getExportableColumns(table) {
  return table
    .getAllLeafColumns()
    .filter((col) => {
      if (col.id === 'acciones') return false
      if (col.columnDef?.meta?.export === false) return false
      return true
    })
}

export function buildDataTableExportMatrix(table) {
  const cols = getExportableColumns(table)
  const headers = cols.map((col) => {
    const h = col.columnDef.header
    return typeof h === 'string' ? h : col.id
  })
  const body = table.getFilteredRowModel().rows.map((row) =>
    cols.map((col) => {
      const raw = row.getValue(col.id)
      if (raw != null && raw !== '') return cellDisplay(raw)
      // Fallback: texto del cell renderizado no disponible; usar accessor
      return cellDisplay(raw)
    })
  )
  return { headers, body }
}

export async function exportDataTableExcel(table, { fileName = 'export', sheetName = 'Datos' } = {}) {
  const { headers, body } = buildDataTableExportMatrix(table)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SeropTrans'
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  ws.addRow(headers)
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E6DC' },
  }
  body.forEach((line) => ws.addRow(line))
  ws.columns.forEach((col) => {
    let max = 10
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0
      if (len > max) max = Math.min(len, 40)
    })
    col.width = max + 2
  })
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = stampFilename(fileName, 'xlsx')
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDataTablePdf(table, { fileName = 'export', title = 'Exportación' } = {}) {
  const { headers, body } = buildDataTableExportMatrix(table)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setProperties({ title })
  doc.setFontSize(10)
  doc.setTextColor(46, 64, 54)
  doc.text(title, 8, 10)
  autoTable(doc, {
    startY: 14,
    head: [headers],
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [46, 64, 54], textColor: 255 },
    margin: { left: 8, right: 8 },
  })
  doc.save(stampFilename(fileName, 'pdf'))
}
