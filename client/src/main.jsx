import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as goalsService from './services/goalsService.js'
import * as metricsService from './services/metricsService.js'
import * as authService from './services/authService.js'
import * as dateUtils from './utils/dateUtils.js'

// Expose services and utilities to window for console testing
if (import.meta.env.VITE_NODE_ENV === 'development') {
  window.goalsService = goalsService
  window.metricsService = metricsService
  window.authService = authService
  window.dateUtils = dateUtils
  console.log('🧪 Services & Utilities available in console:')
  console.log('  - window.goalsService')
  console.log('  - window.metricsService')
  console.log('  - window.authService')
  console.log('  - window.dateUtils')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
