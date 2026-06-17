import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app/App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SessionTimeoutManager } from './app/components/commons/SessionTimeoutManager.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SessionTimeoutManager />
      <App />
    </AuthProvider>
  </StrictMode>,
)
