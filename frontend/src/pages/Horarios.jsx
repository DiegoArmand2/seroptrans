import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, FileSpreadsheet, Upload } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { horariosService } from '../services/horarios.service'
import { useProject } from '../contexts/ProjectContext'
import { getErrorMessage } from '../utils/apiError'

function localISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const Horarios = () => {
  const { selectedProyectoId, proyectos, loading: proyectosLoading } = useProject()
  const [importaciones, setImportaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProyectoId, setModalProyectoId] = useState('')
  const [fecha, setFecha] = useState(localISODate)
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = selectedProyectoId ? { proyecto_id: selectedProyectoId } : {}
      const { data } = await horariosService.listImportaciones(params)
      setImportaciones(data || [])
    } catch (err) {
      console.error(err)
      setImportaciones([])
    } finally {
      setLoading(false)
    }
  }, [selectedProyectoId])

  useEffect(() => {
    if (!proyectosLoading) {
      loadData()
    }
  }, [proyectosLoading, loadData])

  const openCreate = () => {
    setModalProyectoId(selectedProyectoId || '')
    setFecha(localISODate())
    setUrl('')
    setResultado(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setResultado(null)
  }

  const proyectoImportarId = selectedProyectoId || modalProyectoId

  const handleArchivoSeleccionado = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingFile(true)
    try {
      const { data } = await horariosService.subirArchivo(file)
      if (data?.url) {
        setUrl(data.url)
      }
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al subir el archivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleImportar = async (e) => {
    e.preventDefault()
    if (!proyectoImportarId) {
      alert('Seleccione un proyecto')
      return
    }
    if (!url.trim()) return
    setSubmitting(true)
    try {
      const { data } = await horariosService.importar({
        proyecto_id: proyectoImportarId,
        fecha,
        url: url.trim(),
      })
      setResultado(data)
      await loadData()
    } catch (err) {
      alert(getErrorMessage(err) || 'Error al importar')
    } finally {
      setSubmitting(false)
    }
  }

  if (proyectosLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Horarios"
        description={
          selectedProyectoId
            ? 'Importaciones de planillas por proyecto (filtro superior activo).'
            : 'Todas las importaciones según sus permisos. Use Nuevo horario para importar una planilla.'
        }
        children={
          <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
            Nuevo horario
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Proyecto</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Fecha ref.</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Título</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Código</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">Registro</th>
                <th className="text-left py-3 px-4 font-heading text-primary font-semibold">URL</th>
              </tr>
            </thead>
            <tbody>
              {importaciones.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    {selectedProyectoId ? 'No hay importaciones en este proyecto' : 'No hay importaciones'}
                  </td>
                </tr>
              )}
              {importaciones.map((row) => (
                <tr key={row.horario_importacion_id} className="border-b border-primary/5 hover:bg-primary/5">
                  <td className="py-3 px-4">
                    {proyectos.find((p) => p.proyecto_id === row.proyecto_id)?.nombre || row.proyecto_id}
                  </td>
                  <td className="py-3 px-4">{row.fecha_referencia}</td>
                  <td className="py-3 px-4 text-muted max-w-[200px] truncate" title={row.respuesta_title}>
                    {row.respuesta_title ?? '—'}
                  </td>
                  <td className="py-3 px-4">{row.respuesta_code ?? '—'}</td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap text-sm">
                    {row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm max-w-[240px] truncate" title={row.url_archivo}>
                    {row.url_archivo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={closeModal} title="Nuevo horario" size="lg">
        <form onSubmit={handleImportar} className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-sm font-medium">Cabecera de importación</span>
          </div>
          <Select
            label="Proyecto"
            options={proyectos.map((p) => ({ value: p.proyecto_id, label: p.nombre }))}
            value={modalProyectoId || selectedProyectoId || ''}
            onChange={(e) => setModalProyectoId(e.target.value)}
            disabled={!!selectedProyectoId}
            required
          />
          <Input
            type="date"
            label="Fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <div>
            <Input
              label="Ubicación del archivo (URL)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=xlsx"
              required
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleArchivoSeleccionado}
            />
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                icon={<Upload className="w-4 h-4" />}
                disabled={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFile ? 'Subiendo…' : 'Cargar archivo Excel (.xls / .xlsx)'}
              </Button>
              <p className="text-xs text-muted mt-2">
                El archivo se guarda en el servidor y se rellena la URL automáticamente. n8n debe poder abrir esa URL (si
                hace falta, configure <code className="text-primary/80">PUBLIC_BASE_URL</code> en el backend).
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            El botón Importar archivo envía al webhook de n8n el JSON{' '}
            <code className="text-primary/80 text-[11px]">
              {`{ "id_proyecto": "<uuid>", "url": "<ubicación del archivo>" }`}
            </code>{' '}
            (proyecto seleccionado y campo URL).
          </p>
          <Button
            type="submit"
            variant="accent"
            disabled={submitting || uploadingFile || !url.trim() || !proyectoImportarId}
          >
            {submitting ? 'Importando…' : 'Importar archivo'}
          </Button>

          {resultado && (
            <div className="border-t border-primary/10 pt-4 mt-4 space-y-3 text-sm">
              <p className="font-heading font-semibold text-primary">Resultado del servicio</p>
              <div>
                <span className="font-medium text-primary">Título</span>
                <p className="mt-1 text-muted whitespace-pre-wrap">{resultado.title ?? '—'}</p>
              </div>
              <div>
                <span className="font-medium text-primary">Código</span>
                <p className="mt-1 text-muted">{resultado.code ?? '—'}</p>
              </div>
              <div>
                <span className="font-medium text-primary">Mensaje</span>
                <pre className="mt-1 p-3 rounded-lg bg-primary/5 text-primary whitespace-pre-wrap font-sans text-xs overflow-x-auto max-h-48">
                  {resultado.msg ?? '—'}
                </pre>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              {resultado ? 'Cerrar' : 'Cancelar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default Horarios
