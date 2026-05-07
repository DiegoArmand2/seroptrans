import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const PASAJEROS_EXPORT_COL_IDS = [
  'proyecto',
  'cedula',
  'nombre',
  'direccion',
  'lat',
  'lng',
  'ruta',
  'tipo_pasajero',
  'contrasena',
  'estado',
]

export const PASAJEROS_EXPORT_HEADERS = [
  'Proyecto',
  'Cédula',
  'Nombre',
  'Dirección',
  'Latitud',
  'Longitud',
  'Ruta',
  'Tipo pasajero',
  'Contraseña',
  'Estado',
]

function cellDisplay(v) {
  if (v == null || v === '') return '—'
  return String(v)
}

export function buildPasajerosExportMatrix(table) {
  const dataRows = table.getFilteredRowModel().rows
  const body = dataRows.map((row) => PASAJEROS_EXPORT_COL_IDS.map((id) => cellDisplay(row.getValue(id))))
  return { headers: PASAJEROS_EXPORT_HEADERS, body }
}

function stampFilename(prefix, ext) {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes()
  )}.${ext}`
}

export async function exportPasajerosExcel(table) {
  const { headers, body } = buildPasajerosExportMatrix(table)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SeropTrans'
  const ws = wb.addWorksheet('Pasajeros', {
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
  a.download = stampFilename('pasajeros', 'xlsx')
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPasajerosPdf(table) {
  const { headers, body } = buildPasajerosExportMatrix(table)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setProperties({ title: 'Pasajeros' })
  doc.setFontSize(10)
  doc.setTextColor(46, 64, 54)
  doc.text('Pasajeros', 8, 10)
  autoTable(doc, {
    startY: 14,
    head: [headers],
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [46, 64, 54], textColor: 255 },
    margin: { left: 8, right: 8 },
  })
  doc.save(stampFilename('pasajeros', 'pdf'))
}

