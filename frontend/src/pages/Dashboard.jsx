import { Users, Shield, Key, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'

const Dashboard = () => {
  const { user } = useAuth()

  const stats = [
    { label: 'Usuarios', icon: Users, color: 'text-primary' },
    { label: 'Roles', icon: Shield, color: 'text-accent' },
    { label: 'Permisos', icon: Key, color: 'text-muted' },
    { label: 'Actividad', icon: TrendingUp, color: 'text-primary' },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Bienvenido, ${user?.nombre_usuario || 'Usuario'}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl bg-primary/5 ${stat.color}`}
            >
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-primary">
                —
              </p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Acceso rápido</Card.Title>
            <Card.Description>
              Módulos disponibles según tus permisos
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="space-y-2">
              {user?.ventanas?.map((v) => (
                <li
                  key={v}
                  className="flex items-center gap-2 py-2 border-b border-primary/5 last:border-0"
                >
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="capitalize">{v}</span>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>Tu perfil</Card.Title>
            <Card.Description>
              Información de tu cuenta
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted">Usuario</dt>
                <dd className="font-medium">{user?.login}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Nombre</dt>
                <dd className="font-medium">{user?.nombre_usuario}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Roles</dt>
                <dd className="font-medium">{user?.roles?.join(', ') || '—'}</dd>
              </div>
            </dl>
          </Card.Content>
        </Card>
      </div>
    </>
  )
}

export default Dashboard
