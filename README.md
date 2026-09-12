# hccs.dev

Apex site for [Hudson County Complete Streets]: a homepage link-tree of the
`*.hccs.dev` data projects, plus vanity short-links.

Static Vite + React + TypeScript app, deployed to Cloudflare Pages.

## Short-links

Edit [`src/links.ts`] — one entry per vanity link:

```ts
{ slug: 'sots26', target: 'https://www.zeffy.com/en-US/ticketing/state-of-the-streets--2026' }
```

`hccs.dev/sots26` then 302s to the target. At build the list is emitted to a
Cloudflare Pages [`_redirects`] file (`dist/_redirects`); the dev and preview
servers honor the same redirects, so they're testable locally.

The homepage link-tree is the `projects` array in the same file.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:5280
pnpm build      # -> dist/ (incl. generated _redirects)
pnpm preview    # serve the build on :5280
```

## Deploy

Cloudflare Pages builds from the connected GitHub repo:

- Build command: `pnpm build`
- Output directory: `dist`

Or push a build directly: `pnpm deploy` (`wrangler pages deploy dist`).

[Hudson County Complete Streets]: https://www.hudcostreets.org
[`src/links.ts`]: src/links.ts
[`_redirects`]: https://developers.cloudflare.com/pages/configuration/redirects/
