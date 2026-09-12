import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type Connect } from 'vite'
import type { ServerResponse } from 'node:http'
import { resolveShortLink } from './src/links'

const allowedHosts = process.env.VITE_ALLOWED_HOSTS?.split(',') ?? []

// Short-links are resolved case-insensitively by a Pages Function
// (functions/[slug].ts) in production. Here we (a) emit the `_redirects` SPA
// fallback so unknown paths render the app's 404 view, and (b) mirror the
// Function's redirect behavior in the dev + preview servers for parity.
// https://developers.cloudflare.com/pages/configuration/redirects/
function redirects(): Plugin {
  const file = `# SPA fallback — short-links are handled by functions/[slug].ts.\n/*  /index.html  200\n`

  const middleware = (req: Connect.IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = (req.url ?? '').split('?')[0].replace(/^\/+|\/+$/g, '')
    // Only single-segment paths are short-link candidates (mirrors [slug].ts).
    const link = path.includes('/') ? null : resolveShortLink(path)
    if (link) {
      res.statusCode = link.status ?? 302
      res.setHeader('Location', link.target)
      res.end()
      return
    }
    next()
  }

  return {
    name: 'hccs-redirects',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_redirects', source: file })
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), redirects()],
  base: '/',
  server: {
    host: true,
    port: 5280,
    allowedHosts,
  },
})
