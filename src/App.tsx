import type { CSSProperties } from 'react'
import { campaigns, dataProjects, orgUrl, socials } from './links'
import { SocialIcon } from './Icons'

function Socials() {
  return (
    <nav className="socials" aria-label="Social links">
      {socials.map(s => (
        <a key={s.href} href={s.href} aria-label={s.name} title={s.name}>
          <SocialIcon icon={s.icon} />
        </a>
      ))}
    </nav>
  )
}

function Home() {
  return (
    <main className="home">
      <header className="hero">
        <img className="logo" src="/logo.png" alt="Hudson County Complete Streets seal" />
        <h1>Hudson County Complete Streets</h1>
        <p className="tagline">
          Better transit and safer, more complete streets across Hudson County, NJ.
        </p>
        <a className="cta" href={orgUrl}>Visit hudcostreets.org →</a>
        <Socials />
      </header>

      <section className="campaigns" aria-label="Campaigns">
        {campaigns.map(c => (
          <a key={c.href} className="campaign" href={c.href} style={{ '--accent': c.accent } as CSSProperties}>
            <span className="name">{c.name}</span>
            <span className="blurb">{c.blurb}</span>
          </a>
        ))}
      </section>

      <h2 className="section-title">Data &amp; Maps</h2>
      <ul className="projects">
        {dataProjects.map(p => (
          <li key={p.href}>
            <a href={p.href}>
              <span className="name">{p.name}</span>
              <span className="blurb">{p.blurb}</span>
            </a>
          </li>
        ))}
      </ul>

      <footer className="site-footer">
        <a href={orgUrl}>hudcostreets.org</a>
        <span className="dot">·</span>
        <a href="https://github.com/hudcostreets">GitHub</a>
      </footer>
    </main>
  )
}

function NotFound() {
  return (
    <main className="home notfound">
      <header className="hero">
        <img className="logo" src="/logo.png" alt="Hudson County Complete Streets seal" />
        <h1>Page not found</h1>
        <p className="tagline">
          There's nothing at <code>{location.pathname}</code>.
        </p>
        <p>
          <a className="back" href="/">← Back to hccs.dev</a>
        </p>
      </header>
    </main>
  )
}

export function App() {
  const path = location.pathname.replace(/\/+$/, '')
  return path === '' ? <Home /> : <NotFound />
}
