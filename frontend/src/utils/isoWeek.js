/**
 * Semanas ISO 8601 (lunes = inicio de semana).
 * El "año" del selector es el año de semana ISO (coincide con el civil salvo bordes de año).
 */

/** @param {Date} d */
function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

/** @param {Date} d */
function toYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Cantidad de semanas (52 o 53) en el año ISO `isoYear`.
 * @param {number} isoYear
 */
export function isoWeeksInIsoYear(isoYear) {
  const p =
    (isoYear +
      Math.floor(isoYear / 4) -
      Math.floor(isoYear / 100) +
      Math.floor(isoYear / 400)) %
    7
  return p === 4 || p === 3 ? 53 : 52
}

/**
 * Lunes de la semana ISO (`isoYear`, `week`) en hora local → `YYYY-MM-DD`.
 * @param {number} isoYear
 * @param {number} week 1..53
 */
export function mondayOfIsoWeekAsLocalDateString(isoYear, week) {
  const jan4 = new Date(isoYear, 0, 4, 12, 0, 0, 0)
  const jan4Dow = jan4.getDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - (jan4Dow - 1))
  const monday = new Date(week1Monday)
  monday.setDate(week1Monday.getDate() + (week - 1) * 7)
  return toYmd(monday)
}

/**
 * @param {Date} d
 * @returns {{ isoYear: number, week: number }}
 */
export function toIsoYearWeekFromDate(d) {
  const date = startOfLocalDay(d)
  const day = date.getDay() || 7
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + 4 - day)
  const isoYear = thursday.getFullYear()
  const w1 = mondayOfIsoWeekAsLocalDateString(isoYear, 1)
  const [y, m, dayM] = w1.split('-').map(Number)
  const week1Monday = new Date(y, m - 1, dayM, 12, 0, 0, 0)
  const diffDays = Math.round((date - week1Monday) / 86400000)
  const week = Math.floor(diffDays / 7) + 1
  return { isoYear, week }
}

/**
 * @param {string} isoDateStr `YYYY-MM-DD`
 * @returns {{ isoYear: number, week: number } | null}
 */
export function isoYearWeekFromDateString(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDateStr.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const day = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(day)) return null
  return toIsoYearWeekFromDate(new Date(y, mo, day, 12, 0, 0, 0))
}

/** Etiqueta corta para historial */
export function formatIsoYearWeekLabel(isoDateStr) {
  const p = isoYearWeekFromDateString(isoDateStr)
  if (!p) return isoDateStr ?? '—'
  return `Semana ${p.week} · ${p.isoYear}`
}

/** Rango lun–dom legible (opcional, tooltip) */
export function isoWeekRangeLabel(isoYear, week) {
  const start = mondayOfIsoWeekAsLocalDateString(isoYear, week)
  const [y, m, d] = start.split('-').map(Number)
  const mon = new Date(y, m - 1, d, 12, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const opts = { day: 'numeric', month: 'short' }
  return `${mon.toLocaleDateString(undefined, opts)} – ${sun.toLocaleDateString(undefined, opts)}`
}
