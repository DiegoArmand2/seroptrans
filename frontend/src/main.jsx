import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import RootErrorBoundary from './components/RootErrorBoundary'
import './styles/index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="margin:1rem;font-family:sans-serif">Error: no existe el elemento #root en index.html.</p>'
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </React.StrictMode>,
    )
  } catch (err) {
    rootEl.innerHTML = `<p style="margin:1rem;font-family:sans-serif;color:#b91c1c">Error al iniciar la app: ${String(err?.message || err)}</p>`
  }
}
