import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT_FILES = ['index.html', 'logo.png', 'favicon.ico', 'robots.txt', '_headers', '_redirects', 'og.jpg']
const DIRECTORIES = ['assets', 'media']
const SERVER_FILES = ['_worker.js', '_worker.js.map', '_routes.json', 'wrangler.json', 'wrangler.jsonc', 'wrangler.toml']

export function validateStaticArtifact(directory) {
  const files = []
  function visit(relative = '') {
    for (const name of readdirSync(join(directory, relative)).sort()) {
      const path = join(relative, name)
      const stat = lstatSync(join(directory, path))
      if (stat.isSymbolicLink()) throw new Error(`Symlinks are not static assets: ${path}`)
      if (SERVER_FILES.includes(basename(path))) throw new Error(`Server configuration is not allowed: ${path}`)
      if (stat.isDirectory()) {
        if (!DIRECTORIES.includes(path.split('/')[0])) throw new Error(`Unexpected asset directory: ${path}`)
        visit(path)
      } else if (stat.isFile()) {
        if (!relative && !ROOT_FILES.includes(name)) throw new Error(`Unexpected root asset: ${path}`)
        files.push(path)
      } else {
        throw new Error(`Unsupported filesystem entry: ${path}`)
      }
    }
  }
  visit()
  if (!files.includes('index.html')) throw new Error('Missing index.html')
  if (readFileSync(join(directory, 'index.html'), 'utf8').trim() === '') throw new Error('Empty index.html')
  return files.sort()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error('Usage: node org-static-artifact.mjs <directory>')
  const files = validateStaticArtifact(process.argv[2])
  console.log(`Validated ${files.length} static assets`)
}
