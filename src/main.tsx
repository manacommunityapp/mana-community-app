import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app/App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SessionTimeoutManager } from './app/components/commons/SessionTimeoutManager.tsx'
import { ErrorBoundary } from './app/components/commons/error/ErrorBoundary.tsx'
import { createLogger } from './utils/logger.ts'

const log = createLogger("Global");

window.addEventListener("error", (event) => {
  log.error("Uncaught exception", event.error ?? event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  log.error("Unhandled promise rejection", event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SessionTimeoutManager />
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
