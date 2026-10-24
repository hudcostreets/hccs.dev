export type Block =
  | { type: 'html'; html: string }
  | { type: 'image'; src: string; alt: string; source: string; href?: string | null }
  | { type: 'link'; href: string; label: string }
  | { type: 'accordion'; title: string; html: string }
  | { type: 'card'; title: string; html: string; href: string; src: string | null }

export type Page = {
  path: string
  title: string
  description: string
  source: string
  blocks: Block[]
  review: { id: string; kind: string }[]
}

const files = import.meta.glob<Page>('../content/pages/*.json', { eager: true, import: 'default' })
export const pages = Object.fromEntries(Object.values(files).map(page => [page.path, page]))

export function localLink(href: string): string {
  const url = new URL(href, 'https://hudcostreets.org')
  // Squarespace section anchors need a separate parity pass before being routed locally.
  if (url.hash) return href
  if (['hudcostreets.org', 'www.hudcostreets.org'].includes(url.hostname)) {
    const path = url.pathname.replace(/\/+$/, '') || '/'
    if (pages[path]) return path + url.search + url.hash
  }
  return href
}

// Imported markup is sanitized by the capture CLI; only captured routes become local links.
export function localHtml(html: string): string {
  return html.replace(/href="([^"]*)"/g, (_, href: string) => `href="${localLink(href)}"`)
}
