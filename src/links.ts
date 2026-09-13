// Single source of truth for hccs.dev routing & content.
//
// - `shortLinks` power vanity redirects (hccs.dev/<slug> -> target). Lookups
//   are case-insensitive: a Pages Function (functions/[slug].ts) resolves them
//   in production and the dev/preview servers use the same `resolveShortLink`.
//   Slugs may be authored in any case; uppercase them when you want a smaller,
//   alphanumeric-mode QR code (paths are case-sensitive per spec, so the
//   case-insensitive layer is what makes an uppercase QR convention safe).
// - `campaigns` are the four flagship HCCS campaigns (hudcostreets.org).
// - `dataProjects` are the standalone data/visualization sites.

export type ShortLink = {
  slug: string
  target: string
  status?: number // HTTP redirect code; defaults to 302 (temporary)
  desc?: string // human note; not shown on the site
}

// Resolve a single URL path segment to a short-link, case-insensitively.
// Used by the Pages Function and the dev/preview middleware.
export function resolveShortLink(segment: string): ShortLink | null {
  let key: string
  try {
    key = decodeURIComponent(segment)
  } catch {
    key = segment
  }
  key = key.replace(/^\/+|\/+$/g, '').toLowerCase()
  if (!key) return null
  return shortLinks.find(l => l.slug.toLowerCase() === key) ?? null
}

export const shortLinks: ShortLink[] = [
  {
    slug: 'sots26',
    target: 'https://www.zeffy.com/en-US/ticketing/state-of-the-streets--2026',
    desc: 'State of the Streets 2026 — tickets (Zeffy)',
  },
  // Port Authority campaign QR codes — carried over from the old
  // hudcostreets.github.io placeholder so printed QRs keep working.
  {
    slug: 'PA0',
    target: 'https://hudcostreets.org/panynj/action?source=canvassing-qr',
    desc: 'Port Authority take-action — canvassing QR',
  },
  {
    slug: 'PA1',
    target: 'https://hudcostreets.org/panynj/action?source=smartphone-qr',
    desc: 'Port Authority take-action — smartphone QR',
  },
]

export type Campaign = {
  href: string
  name: string
  blurb: string
  accent: string // brand accent color for the card
}

export const campaigns: Campaign[] = [
  {
    href: 'https://hudcostreets.org/panynj',
    name: 'A Better PATH',
    blurb: 'Frequent trains and one-seat airport access on the PATH.',
    accent: '#0e76bc',
  },
  {
    href: 'https://hudcostreets.org/hblr',
    name: 'Better Light Rail',
    blurb: 'Extend and improve Hudson-Bergen Light Rail across the region.',
    accent: '#159a54',
  },
  {
    href: 'https://hudcostreets.org/better-buses',
    name: 'Better Buses',
    blurb: 'Faster, more reliable buses throughout Hudson County.',
    accent: '#e58a1a',
  },
  {
    href: 'https://hudcostreets.org/vision-zero',
    name: 'Vision Zero',
    blurb: 'End traffic deaths and serious injuries on our streets.',
    accent: '#d23b2e',
  },
]

export type DataProject = {
  href: string
  name: string
  blurb: string
}

// Ordered by significance.
export const dataProjects: DataProject[] = [
  {
    href: 'https://crashes.hccs.dev',
    name: 'NJ Crashes',
    blurb: 'NJ traffic-crash data from NJ DOT & State Police, mapped and analyzed.',
  },
  {
    href: 'https://ctbk.dev',
    name: 'Citi Bike Dashboard',
    blurb: 'Interactive explorer for NYC Citi Bike ridership data.',
  },
  {
    href: 'https://path.hudcostreets.org',
    name: 'PATH Ridership',
    blurb: 'PATH train ridership stats and trends.',
  },
  {
    href: 'https://hbt.hccs.dev',
    name: 'Hub Bound Travel',
    blurb: 'NJ→NY transit trends, 2014–2024, from NYMTC Hub Bound Travel reports.',
  },
  {
    href: 'https://ht.hccs.dev',
    name: 'Holland Tunnel Bike Lane',
    blurb: 'A time-shared bike lane through the Holland Tunnel — 10 min/hour.',
  },
]

export const orgUrl = 'https://www.hudcostreets.org'

export type Social = {
  name: string
  href: string
  icon: 'instagram' | 'bluesky' | 'facebook' | 'newsletter'
}

export const socials: Social[] = [
  { name: 'Newsletter', href: 'https://newsletter.hudcostreets.org', icon: 'newsletter' },
  { name: 'Instagram', href: 'https://www.instagram.com/hudcostreets', icon: 'instagram' },
  { name: 'Bluesky', href: 'https://bsky.app/profile/hudcostreets.org', icon: 'bluesky' },
  { name: 'Facebook', href: 'https://www.facebook.com/hudcostreets', icon: 'facebook' },
]
