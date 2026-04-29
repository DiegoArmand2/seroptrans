import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { demandaViajesService } from '../services/demandaViajes.service'
import { useProject } from '../contexts/ProjectContext'

function formatFecha(v) {
  if (v == null || v === '') return '—'
  try {
    return new Date(v).toLocaleString()
  } catch {
    return String(v)
  }
}

function formatHoraMin(h, m) {
  if (h == null || m == null) return '—'
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const DemandaViajes = () => {
  const { selectedProyectoId, proyectos } = useProject()
  const [searchParams] = useSearchParams()
  const horarioImportacionIdParam = (searchParams.get('horario_importacion_id') || '').trim()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedProyectoId) params.proyecto_id = selectedProyectoId
      if (horarioImportacionIdParam) params.horario_importacion_id = horarioImportacionIdParam
      const { data } = await demandaViajesService.list(params)
      setRows(data || [])
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const proyectoNombre = (pid) => proyectos.find((p) => p.proyecto_id === pid)?.nombre || pid || '—'

  return (
    <>
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Turno</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Horario imp.</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Pasajero</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Día</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Sector</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Inicio</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Fin</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Día fin</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Cédula</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Nombre</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Fecha</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Año</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Sem.</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Tipo</th>
                <th className="text-left py-3 px-3 font-heading text-primary font-semibold">Día #</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-muted">
                    No hay registros de demanda de viajes
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.demanda_viaje_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-2 px-3 text-muted whitespace-nowrap">{proyectoNombre(r.proyecto_id)}</td>
                  <td className="py-2 px-3">{r.turno_nombre || r.turno_id}</td>
                  <td className="py-2 px-3 text-muted font-mono text-xs">{r.horario_importacion_id || '—'}</td>
                  <td className="py-2 px-3 whitespace-nowrap" title={r.pasajero_id || ''}>
                    {r.pasajero_id ? r.pasajero_nombre || r.pasajero_id : '—'}
                  </td>
                  <td className="py-2 px-3">{r.dia}</td>
                  <td className="py-2 px-3 text-muted whitespace-nowrap" title={r.sector}>
                    {r.sector}
                  </td>
                  <td className="py-2 px-3 tabular-nums">{formatHoraMin(r.hora_ini, r.min_ini)}</td>
                  <td className="py-2 px-3 tabular-nums">{formatHoraMin(r.hora_fin, r.min_fin)}</td>
                  <td className="py-2 px-3">{r.dia_fin}</td>
                  <td className="py-2 px-3 font-mono text-xs">{r.cedula}</td>
                  <td className="py-2 px-3 whitespace-nowrap" title={r.nombre}>
                    {r.nombre}
                  </td>
                  <td className="py-2 px-3 text-muted whitespace-nowrap text-xs">{formatFecha(r.fecha)}</td>
                  <td className="py-2 px-3 tabular-nums">{r.anio ?? '—'}</td>
                  <td className="py-2 px-3 tabular-nums">{r.numero_semana ?? '—'}</td>
                  <td className="py-2 px-3 text-muted">{r.tipo || '—'}</td>
                  <td className="py-2 px-3 tabular-nums">{r.dia_numero ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export default DemandaViajes
