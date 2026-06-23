import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// ── Build / deployment metadata (injected at build time) ──────────────────
// Shown on the Architecture Docs page so each deployment reports its version,
// branch and build timestamp. Prefer CI-provided env vars (GitHub Actions sets
// GITHUB_REF_NAME / GITHUB_SHA, often a detached HEAD), then fall back to git.
function sh(cmd: string, fallback = 'unknown'): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const appVersion: string = pkg.version ?? '0.0.0'
const gitBranch: string = process.env.GITHUB_REF_NAME || sh('git rev-parse --abbrev-ref HEAD')
const gitCommit: string = (process.env.GITHUB_SHA || sh('git rev-parse --short HEAD')).slice(0, 12)
const buildTime: string = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8080';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __GIT_BRANCH__: JSON.stringify(gitBranch),
      __GIT_COMMIT__: JSON.stringify(gitCommit),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      proxy: {
        // Forward all /api/* requests to the Spring Boot backend
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          // Do NOT rewrite the path — Spring listens on /api/...
        },
        // STOMP/WebSocket handshake → Spring's /ws endpoint (ws: true upgrades the connection)
        "/ws": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
})
