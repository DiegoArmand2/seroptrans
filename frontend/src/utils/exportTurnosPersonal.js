import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const TURNOS_PERSONAL_EXPORT_COL_IDS = [
  'proyecto',
  'empresa',
  'proceso',
  'cargo',
  'rut',
  'funcionarios',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
]

export const TURNOS_PERSONAL_EXPORT_HEADERS = [
  'Proyecto',
  'Empresa',
  'Proceso',
  'Cargo',
  'RUT',
  'Funcionarios',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

function cellDisplay(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

export function buildTurnosPersonalExportMatrix(table) {
  const dataRows = table.getFilteredRowModel().rows
  const body = dataRows.map((row) =>
    TURNOS_PERSONAL_EXPORT_COL_IDS.map((id) => cellDisplay(row.getValue(id)))
  )
  return { headers: TURNOS_PERSONAL_EXPORT_HEADERS, body }
}

function stampFilename(prefix, ext) {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`
}

export async function exportTurnosPersonalExcel(table) {
  const { headers, body } = buildTurnosPersonalExportMatrix(table)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SeropTrans'
  const ws = wb.addWorksheet('Turnos personal', {
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
  a.download = stampFilename('turnos_personal', 'xlsx')
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTurnosPersonalPdf(table) {
  const { headers, body } = buildTurnosPersonalExportMatrix(table)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setProperties({ title: 'Turnos personal' })
  doc.setFontSize(10)
  doc.setTextColor(46, 64, 54)
  doc.text('Turnos personal', 8, 10)
  autoTable(doc, {
    startY: 14,
    head: [headers],
    body,
    styles: { fontSize: 6, cellPadding: 1.2 },
    headStyles: { fillColor: [46, 64, 54], textColor: 255 },
    margin: { left: 8, right: 8 },
  })
  doc.save(stampFilename('turnos_personal', 'pdf'))
}
