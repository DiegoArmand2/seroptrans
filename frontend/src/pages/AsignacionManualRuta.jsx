import { useCallback, useEffect, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { asignacionManualRutaService } from '../services/asignacionManualRuta.service'
import { vehiculosService } from '../services/vehiculos.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

const AsignacionManualRuta = () => {
  const { selectedProyectoId } = useProject()
  const [vehiculos, setVehiculos] = useState([])
  const [loadingVehiculos, setLoadingVehiculos] = useState(true)
  const [demandaViajePlacaId, setDemandaViajePlacaId] = useState('')
  const [placa, setPlaca] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState(null)

  const loadVehiculos = useCallback(async () => {
    setLoadingVehiculos(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const { data } = await vehiculosService.list(params)
      const list = Array.isArray(data) ? data : []
      setVehiculos(list.filter((v) => v.activo !== false && String(v.placa || '').trim()))
    } catch (err) {
      console.error(err)
      setVehiculos([])
    } finally {
      setLoadingVehiculos(false)
    }
  }, [selectedProyectoId])

  useEffect(() => {
    loadVehiculos()
  }, [loadVehiculos])

  useEffect(() => {
    setPlaca('')
  }, [selectedProyectoId])

  const placaOptions = useMemo(() => {
    const seen = new Set()
    const opts = []
    for (const v of vehiculos) {
      const p = String(v.placa || '').trim()
      if (!p || seen.has(p)) continue
      seen.add(p)
      opts.push({ value: p, label: p })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [vehiculos])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = demandaViajePlacaId.trim()
    const placaVal = placa.trim()
    if (!id) {
      alert('Indique el ID de ruta')
      return
    }
    if (!placaVal) {
      alert('Seleccione una placa')
      return
    }
    setSubmitting(true)
    setResultado(null)
    try {
      const { data } = await asignacionManualRutaService.asignar({
        demanda_viaje_placa_id: id,
        placa: placaVal,
      })
      setResultado({ ok: true, mensaje: data?.mensaje || 'Asignación solicitada' })
    } catch (err) {
      setResultado({ ok: false, mensaje: getErrorMessage(err) || 'Error al asignar placa' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingVehiculos) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Asignación manual de ruta"
        description="Asigna una placa de vehículo a un ID de ruta mediante el servicio n8n."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <Input
            label="ID de ruta"
            value={demandaViajePlacaId}
            onChange={(e) => setDemandaViajePlacaId(e.target.value)}
            placeholder="Ej. 01a18f2278db855ef2138739d5c5d99d"
            required
          />
          <Select
            label="Placa"
            options={placaOptions}
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            placeholder={placaOptions.length ? 'Seleccionar placa' : 'No hay vehículos'}
            required
          />
          {placaOptions.length === 0 && (
            <p className="text-sm text-muted">
              {selectedProyectoId
                ? 'No hay vehículos activos con placa en este proyecto.'
                : 'No hay vehículos activos con placa.'}
            </p>
          )}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="accent"
              icon={<Send className="w-4 h-4" />}
              disabled={submitting || !placaOptions.length}
            >
              {submitting ? 'Asignando…' : 'Asignar placa'}
            </Button>
          </div>
          {resultado && (
            <p
              className={`text-sm rounded-lg px-3 py-2 border ${
                resultado.ok
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {resultado.mensaje}
            </p>
          )}
        </form>
      </Card>
    </>
  )
}

export default AsignacionManualRuta
