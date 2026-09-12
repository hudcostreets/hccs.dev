import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type Connect } from 'vite'
import type { ServerResponse } from 'node:http'
import { shortLinks } from './src/links'

const allowedHosts = process.env.VITE_ALLOWED_HOSTS?.split(',') ?? []

// Emit a Cloudflare Pages `_redirects` file from `shortLinks`, and honor the
// same redirects in the dev + preview servers so they're testable locally.
// https://developers.cloudflare.com/pages/configuration/redirects/
function redirects(): Plugin {
  const rules = shortLinks
    .map(({ slug, target, status }) => `/${slug}  ${target}  ${status ?? 302}`)
    .join('\n')
  const file = `# Generated from src/links.ts — do not edit by hand.\n${rules}\n\n# SPA fallback (unknown paths render the app, which shows a 404 view).\n/*  /index.html  200\n`

  const bySlug = new Map(shortLinks.map(l => [l.slug, l]))
  const middleware = (req: Connect.IncomingMessage, res: ServerResponse, next: () => void) => {
    const slug = (req.url ?? '').split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '')
    const link = bySlug.get(slug)
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
