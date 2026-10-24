import { test } from 'node:test'
import { deepStrictEqual, throws } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { validateStaticArtifact } from './org-static-artifact.mjs'

function fixture(t) {
  mkdirSync('tmp', { recursive: true })
  const directory = mkdtempSync(resolve('tmp/static-artifact-'))
  t.after(() => rmSync(directory, { recursive: true }))
  writeFileSync(join(directory, 'index.html'), '<html><body>Preview</body></html>\n')
  return directory
}

test('static build files are returned as a complete sorted manifest', t => {
  const dir = fixture(t)
  mkdirSync(join(dir, 'assets'))
  writeFileSync(join(dir, 'assets/app.js'), 'console.log("client")\n')
  writeFileSync(join(dir, '_headers'), '/*\n  X-Robots-Tag: noindex\n')
  deepStrictEqual(validateStaticArtifact(dir), ['_headers', 'assets/app.js', 'index.html'])
})

test('server entrypoints and routing configuration are rejected at every depth', t => {
  for (const file of ['_worker.js', 'assets/_worker.js', '_routes.json', 'wrangler.jsonc']) {
    const dir = fixture(t)
    mkdirSync(join(dir, 'assets'))
    writeFileSync(join(dir, file), 'untrusted\n')
    throws(() => validateStaticArtifact(dir), { message: `Server configuration is not allowed: ${file}` })
  }
})

test('functions and arbitrary root files are rejected', t => {
  const dir = fixture(t)
  mkdirSync(join(dir, 'functions'))
  throws(() => validateStaticArtifact(dir), { message: 'Unexpected asset directory: functions' })
  rmSync(join(dir, 'functions'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), '{}\n')
  throws(() => validateStaticArtifact(dir), { message: 'Unexpected root asset: package.json' })
})

test('symlink escapes are rejected', t => {
  const dir = fixture(t)
  symlinkSync('/etc/passwd', join(dir, 'logo.png'))
  throws(() => validateStaticArtifact(dir), { message: 'Symlinks are not static assets: logo.png' })
})

test('missing or empty index documents are rejected', t => {
  const dir = fixture(t)
  writeFileSync(join(dir, 'index.html'), '')
  throws(() => validateStaticArtifact(dir), { message: 'Empty index.html' })
  rmSync(join(dir, 'index.html'))
  throws(() => validateStaticArtifact(dir), { message: 'Missing index.html' })
})
