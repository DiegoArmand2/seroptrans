import { Component } from 'react'

export default class RootErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 font-body text-dark bg-bg">
          <h1 className="text-xl font-heading font-semibold text-primary mb-2">Error al cargar la aplicación</h1>
          <pre className="text-sm text-red-600 max-w-2xl overflow-auto whitespace-pre-wrap break-words">
            {this.state.error.message}
          </pre>
          <p className="mt-4 text-sm text-muted text-center max-w-md">
            Revise la consola del navegador (F12 → Consola) para el detalle técnico. Si acaba de actualizar el proyecto, pruebe recargar sin caché (Ctrl+Shift+R).
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
