// Case-insensitive vanity short-links: hccs.dev/<slug> -> target.
//
// Runs only for single-segment paths (e.g. /PA0, /sots26); the homepage (/)
// and nested asset paths (/assets/*) bypass it and are served statically.
// Unknown slugs fall through to the static site (its SPA 404 view).
import { resolveShortLink } from '../src/links'

type Ctx = {
  params: { slug: string | string[] }
  next: () => Response | Promise<Response>
}

export const onRequest = (context: Ctx): Response | Promise<Response> => {
  const raw = context.params.slug
  const segment = Array.isArray(raw) ? raw[0] : raw
  const link = resolveShortLink(segment)
  return link ? Response.redirect(link.target, link.status ?? 302) : context.next()
}
