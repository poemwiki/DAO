import React from 'react'
import ReactDOM from 'react-dom/client'
import { config } from './config'
import './i18n'
import App from './App'
import './index.css'
import { Providers } from '@/providers/Providers'

// Log the configuration
console.log('App configuration:', {
  baseUrl: config.api.baseUrl,
  daoName: config.app.name,
  network: config.network,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)
