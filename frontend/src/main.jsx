import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import './assets/styles/globals.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { registerSW } from 'virtual:pwa-register'

// Registrar Service Worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible. Recarga para actualizar.');
  },
  onOfflineReady() {
    console.log('La app está lista para usarse offline.');
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
