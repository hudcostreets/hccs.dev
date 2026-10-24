import { useEffect, useState, type CSSProperties } from 'react'
import { campaigns, dataProjects, socials } from '../../src/links'
import { localHtml, localLink, pages, type Block } from './content'

const source = 'https://hudcostreets.org'
const mission = 'Our mission is to improve connectivity and transportation equity in Hudson County by advocating for safe streets, pedestrian and cycling infrastructure, and access to transit in each community.'
const navigation = [
  { label: 'About', href: '/our-story' },
  { label: 'Campaigns', href: '/advocacy' },
  { label: 'Local groups', href: '/groups' },
  { label: 'Our wins', href: '/wins' },
  { label: 'Calendar', href: `${source}/calendar` },
  { label: 'Get involved', href: '/get-involved' },
]

function Header() {
  const [open, setOpen] = useState(false)
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="preview-note">Website preview <a href={source}>Visit the current site</a></div>
    <header className="header wrap">
      <a href="/" className="brand" aria-label="Hudson County Complete Streets home">
        <img src="/logo.png" alt="" width="88" height="88" />
        <span>Hudson County<br />Complete Streets</span>
      </a>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>{open ? 'Close menu' : 'Menu'}</button>
      <nav id="navigation" aria-label="Main navigation" className={open ? 'is-open' : ''}>
        {navigation.map(item => <a key={item.href} href={item.href} aria-current={location.pathname === item.href ? 'page' : undefined}>{item.label}</a>)}
        <a className="button" href={`${source}/donate`}>Donate</a>
      </nav>
    </header>
  </>
}

function Html({ html }: { html: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: localHtml(html) }} />
}

function ContentBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'html': return <Html html={block.html} />
    case 'image': {
      const img = <img src={block.src} alt={block.alt} loading="lazy" />
      return <figure className="content-image">{block.href ? <a href={localLink(block.href)}>{img}</a> : img}</figure>
    }
    case 'link': return <p className="action"><a className="button" href={localLink(block.href)}>{block.label}</a></p>
    case 'accordion': return <details><summary>{block.title}</summary><Html html={block.html} /></details>
    case 'card': return <article className="campaign-tile">
      {block.src && <a href={localLink(block.href)} tabIndex={-1} aria-hidden="true"><img src={block.src} alt="" loading="lazy" /></a>}
      <h2><a href={localLink(block.href)}>{block.title}</a></h2>
      <Html html={block.html} />
    </article>
  }
}

function Home() {
  const home = pages['/']
  const eventCopy = home.blocks.find(block => block.type === 'html')
  const eventImage = home.blocks.find(block => block.type === 'image')
  const campaignImages = [
    '/media/b258f5a0797e88e5.jpg',
    '/media/32b6c3e20b275366.png',
    '',
    '/media/b26ac77317a6c38e.png',
  ]
  const busImage = pages['/better-buses'].blocks.find(block => block.type === 'image')
  if (busImage?.type === 'image') campaignImages[2] = busImage.src

  return <main id="main">
    <section className="event-feature wrap" aria-label="State of the Streets">
      <div>
        {eventCopy?.type === 'html' && <Html html={eventCopy.html.replace('<h2>', '<h1>').replace('</h2>', '</h1>')} />}
        <a className="button" href={`${source}/events/2026-sots`}>RSVP for State of the Streets</a>
      </div>
      {eventImage?.type === 'image' && <a href={`${source}/events/2026-sots`}><img src={eventImage.src} alt="State of the Streets Episode 3 fundraiser invitation" fetchPriority="high" /></a>}
    </section>

    <section className="mission-band">
      <div className="wrap mission-layout">
        <h2>Help create a safe and sustainable future.</h2>
        <div><p>{mission}</p><a href="/our-story">Our story</a></div>
      </div>
    </section>

    <section className="wrap section" aria-labelledby="campaign-heading">
      <div className="section-heading"><h2 id="campaign-heading">Our campaigns</h2><a href="/advocacy">All campaigns</a></div>
      <div className="campaign-grid">
        {campaigns.map((campaign, index) => <a className="campaign-feature" key={campaign.href} href={localLink(campaign.href)} style={{ '--accent': campaign.accent } as CSSProperties}>
          <img src={campaignImages[index]} alt="" loading="lazy" />
          <div><h3>{campaign.name}</h3><p>{campaign.blurb}</p><span>Explore the campaign</span></div>
        </a>)}
      </div>
    </section>

    <section className="community-section">
      <div className="wrap community-layout">
        <img src="/media/a56123419938fd4b.jpg" alt="Residents at a rally for safe streets" loading="lazy" />
        <div><h2>Our work starts with our neighbors.</h2><p>From installing protected bike lanes countywide to stopping a highway expansion our advocacy work is transforming our county.</p><p>Join a local community advocacy group in your area!</p><a className="button" href="/groups">Find your local group</a><a className="text-link" href="/wins">See our wins</a></div>
      </div>
    </section>

    <section className="wrap section" aria-labelledby="data-heading">
      <div className="section-heading"><h2 id="data-heading">Data that moves us forward</h2><a href="https://hccs.dev">All data &amp; maps</a></div>
      <div className="data-grid">{dataProjects.slice(0, 3).map(project => <a key={project.href} href={project.href}><img src={project.og} alt="" loading="lazy" /><h3>{project.name}</h3><p>{project.blurb}</p></a>)}</div>
    </section>

    <section className="wrap support-section">
      <div><h2>Support safer streets.</h2><p>Your donation allows Hudson County Complete Streets to harness the power of grassroots organizing to make our streets safer, more livable, and more vibrant for all people in Hudson County.</p><a className="button" href={`${source}/donate`}>Contribute</a></div>
      <div><h2>Stay connected.</h2><p>News about bike infrastructure, pedestrian safety, transit connections, community rides and events, and opportunities to volunteer.</p><a className="button secondary" href="https://newsletter.hudcostreets.org/">Subscribe to the newsletter</a><a className="text-link" href={`${source}/calendar`}>View the event calendar</a></div>
    </section>
  </main>
}

function ContentPage({ path }: { path: string }) {
  const page = pages[path]
  if (!page) return <main id="main" className="wrap section narrow"><h1>Page not found</h1><p>This page hasn’t moved into the preview yet.</p><p><a href={`${source}${path}`}>Look for it on hudcostreets.org</a></p><a href="/">Return home</a></main>
  const cardsOnly = page.blocks.every(block => block.type === 'card')
  const groups: Block[][] = []
  if (path === '/groups') {
    page.blocks.forEach(block => {
      if (block.type === 'image' || groups.length === 0) groups.push([])
      groups[groups.length - 1].push(block)
    })
  }
  return <main id="main" className={`wrap section article-page ${path === '/groups' ? 'groups-page' : ''}`}>
    <div className="page-heading"><a href="/">Home</a><h1>{page.title}</h1></div>
    {path === '/groups'
      ? <div className="group-grid">{groups.map((blocks, index) => <article key={index}>{blocks.map((block, blockIndex) => <ContentBlock block={block} key={blockIndex} />)}</article>)}</div>
      : <div className={cardsOnly ? 'campaign-catalog' : 'article-content'}>{page.blocks.map((block, index) => <ContentBlock block={block} key={index} />)}</div>}
    <aside className="page-source"><a href={page.source}>View this page on the current site</a></aside>
  </main>
}

function Footer() {
  return <footer className="footer">
    <div className="wrap footer-layout">
      <div><a className="brand" href="/"><img src="/logo.png" width="64" height="64" alt="" /><span>Hudson County<br />Complete Streets</span></a><p>{mission}</p></div>
      <div><h2>Join us</h2><a href="/get-involved">Get involved</a><a href="/groups">Local groups</a><a href={`${source}/membership`}>Become a member</a><a href={`${source}/contact`}>Contact us</a></div>
      <div><h2>Stay connected</h2>{socials.map(social => <a key={social.href} href={social.href}>{social.name}</a>)}</div>
    </div>
    <div className="wrap footer-bottom"><span>Hudson County Complete Streets is a registered 501(c)(3) nonprofit organization.</span><a href={`${source}/privacy`}>Privacy</a></div>
  </footer>
}

export function App() {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const resolved = path === '/home' ? '/' : path
  const page = pages[resolved]
  useEffect(() => {
    document.title = page?.title ? `${page.title}${resolved === '/' ? '' : ' — Hudson County Complete Streets'}` : 'Page not found — Hudson County Complete Streets'
    document.querySelector('meta[name="description"]')?.setAttribute('content', page?.description || mission)
  }, [page, resolved])
  return <><Header />{resolved === '/' ? <Home /> : <ContentPage path={resolved} />}<Footer /></>
}
