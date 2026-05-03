import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'

const METABASE_FRAGMENT = '#bordered=false&titled=false'

const LogisticaOperaciones = () => {
  const { user } = useAuth()
  const { hasVentana } = usePermissions()

  const baseUrl = import.meta.env.VITE_METABASE_DASHBOARD_URL?.trim()
  const canViewReportes = hasVentana('reportes')
  const iframeSrc =
    baseUrl && canViewReportes
      ? `${baseUrl.replace(/#.*$/, '')}${METABASE_FRAGMENT}`
      : null

  return (
    <>
      <PageHeader
        title="Logística de Operaciones"
        description={`Bienvenido, ${user?.nombre_usuario || 'Usuario'}`}
      />

      {!canViewReportes && (
        <Card>
          <Card.Header>
            <Card.Title>Sin acceso a Reportes</Card.Title>
            <Card.Description>
              No tienes permiso para ver el tablero de Metabase. Solicita el
              permiso al administrador.
            </Card.Description>
          </Card.Header>
        </Card>
      )}

      {canViewReportes && !baseUrl && (
        <Card>
          <Card.Header>
            <Card.Title>Configuración incompleta</Card.Title>
            <Card.Description>
              Define la variable{' '}
              <code className="text-sm bg-primary/5 px-1 rounded">
                VITE_METABASE_DASHBOARD_URL
              </code>{' '}
              en el entorno del frontend y vuelve a construir la imagen.
            </Card.Description>
          </Card.Header>
        </Card>
      )}

      {canViewReportes && iframeSrc && (
        <iframe
          src={iframeSrc}
          title="Logística de Operaciones — Metabase"
          className="w-full rounded-2xl border border-primary/10 bg-white shadow-sm"
          style={{ height: 'calc(100vh - 220px)', minHeight: 600 }}
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      )}
    </>
  )
}

export default LogisticaOperaciones
