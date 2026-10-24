import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: { host: true, allowedHosts: true, port: 5281, strictPort: true },
  preview: { host: true, allowedHosts: true, port: 5281, strictPort: true },
  build: { outDir: 'dist' },
})
