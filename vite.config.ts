import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: [
        '@tanstack/react-query',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
        '@mui/icons-material/AccountBalance',
        '@mui/icons-material/Add',
        '@mui/icons-material/AdminPanelSettings',
        '@mui/icons-material/Apartment',
        '@mui/icons-material/ArrowBack',
        '@mui/icons-material/ArrowForward',
        '@mui/icons-material/Assessment',
        '@mui/icons-material/AssignmentInd',
        '@mui/icons-material/AttachMoney',
        '@mui/icons-material/Autorenew',
        '@mui/icons-material/BarChart',
        '@mui/icons-material/Bathtub',
        '@mui/icons-material/Bed',
        '@mui/icons-material/Build',
        '@mui/icons-material/Business',
        '@mui/icons-material/Call',
        '@mui/icons-material/Campaign',
        '@mui/icons-material/Cancel',
        '@mui/icons-material/CheckCircle',
        '@mui/icons-material/Close',
        '@mui/icons-material/ContentCopy',
        '@mui/icons-material/Delete',
        '@mui/icons-material/Description',
        '@mui/icons-material/Edit',
        '@mui/icons-material/EditOutlined',
        '@mui/icons-material/Email',
        '@mui/icons-material/EmojiEvents',
        '@mui/icons-material/FileDownload',
        '@mui/icons-material/History',
        '@mui/icons-material/Home',
        '@mui/icons-material/HomeWork',
        '@mui/icons-material/Image',
        '@mui/icons-material/Label',
        '@mui/icons-material/Link',
        '@mui/icons-material/MoveUp',
        '@mui/icons-material/OpenInNew',
        '@mui/icons-material/People',
        '@mui/icons-material/Person',
        '@mui/icons-material/PersonPin',
        '@mui/icons-material/Phone',
        '@mui/icons-material/PhoneDisabled',
        '@mui/icons-material/PhoneMissed',
        '@mui/icons-material/PictureAsPdf',
        '@mui/icons-material/PlayArrow',
        '@mui/icons-material/Receipt',
        '@mui/icons-material/Search',
        '@mui/icons-material/Security',
        '@mui/icons-material/SmartToy',
        '@mui/icons-material/Sms',
        '@mui/icons-material/SquareFoot',
        '@mui/icons-material/Storefront',
        '@mui/icons-material/TableChart',
        '@mui/icons-material/Timeline',
        '@mui/icons-material/TrendingUp',
        '@mui/icons-material/UploadFile',
        '@mui/icons-material/VerifiedUser',
        '@mui/icons-material/Warning',
        '@mui/icons-material/WarningAmber',
        '@mui/icons-material/WhatsApp',
      ],
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __GIT_BRANCH__: JSON.stringify(gitBranch),
      __GIT_COMMIT__: JSON.stringify(gitCommit),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
      {
        name: 'generate-version-json',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({
              version: appVersion,
              commit: gitCommit,
              branch: gitBranch,
              buildTime,
            }, null, 2),
          });
        },
      },
    ],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('@mui') || id.includes('@emotion') || id.includes('lucide-react') || id.includes('@tabler')) {
                return 'vendor-ui';
              }
              if (id.includes('sweetalert2') || id.includes('papaparse') || id.includes('date-fns') || id.includes('axios')) {
                return 'vendor-utils';
              }
              if (id.includes('@tanstack')) {
                return 'vendor-query';
              }
              return 'vendor-misc';
            }
          },
        },
      },
    },
    server: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; object-src 'none'; base-uri 'self'; form-action 'self';",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      },
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
    preview: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; object-src 'none'; base-uri 'self'; form-action 'self';",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    },
  };
})
