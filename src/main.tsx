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

// Auto-recover if Vite fails to load a lazy chunk due to a new deployment replacing chunk hashes
window.addEventListener("vite:preloadError", (event) => {
  const PRELOAD_KEY = "mana_preload_error_ts";
  const lastReload = Number(sessionStorage.getItem(PRELOAD_KEY) || 0);
  const now = Date.now();

  log.warn("Vite dynamic chunk preload failed (new deployment likely). Recovering...", event);

  // Prevent rapid reload loops (allow at most once per 10 seconds)
  if (now - lastReload > 10000) {
    sessionStorage.setItem(PRELOAD_KEY, String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ErrorBoundary>
        <SessionTimeoutManager />
        <App />
      </ErrorBoundary>
    </AuthProvider>
  </StrictMode>,
)
