#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["beautifulsoup4", "click"]
# ///
"""Capture public Squarespace content for the HCCS React migration."""

import json
import sys
from datetime import datetime, timezone
from functools import partial
from hashlib import sha256
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit
from urllib.request import Request, urlopen
from xml.etree.ElementTree import fromstring

from bs4 import BeautifulSoup, Comment
from click import argument, group, option

err = partial(print, file=sys.stderr)
ORIGIN = 'https://hudcostreets.org'
ROUTES = ['/', '/panynj', '/hblr', '/better-buses', '/vision-zero', '/our-story', '/groups', '/wins', '/advocacy', '/get-involved']
ALLOWED = {'a', 'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sup', 'sub'}


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def download(url: str, path: Path) -> bytes:
    """Reuse raw captures so extraction can be repeated without refetching."""
    if not path.exists():
        request = Request(quote(url, safe=':/?=&%+'), headers={'User-Agent': 'HCCS-content-migration/0.1'})
        with urlopen(request, timeout=45) as response:
            data = response.read()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        err(f'Downloaded {url}')
    return path.read_bytes()


def absolute_link(href: str) -> str:
    return urljoin(ORIGIN, href)


def clean_html(fragment: str, base: str = ORIGIN) -> str:
    soup = BeautifulSoup(fragment, 'html.parser')
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    for node in soup.select('script, style, iframe, form, input, button, svg, noscript'):
        node.decompose()
    for node in list(soup.find_all(True)):
        if node.name not in ALLOWED:
            node.unwrap()
            continue
        if node.name == 'h1':
            node.name = 'h2'
        href = node.get('href')
        node.attrs = {}
        if node.name == 'a' and href:
            url = urljoin(base, href)
            if urlsplit(url).scheme in {'https', 'http', 'mailto', 'tel'}:
                node['href'] = url
                if not node.get_text(strip=True):
                    node.string = urlsplit(url).netloc.removeprefix('www.') + urlsplit(url).path.rstrip('/')
    return str(soup).strip()


@group
def cli() -> None:
    """Inventory the old site and extract editable content without Squarespace scripts."""


@cli.command
@option('-c', '--cache', type=Path, default=Path('tmp/squarespace'), show_default=True)
@option('-o', '--output', type=Path, default=Path('org/content/inventory.json'), show_default=True)
def inventory(cache: Path, output: Path) -> None:
    root = fromstring(download(f'{ORIGIN}/sitemap.xml', cache / 'sitemap.xml'))
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    rows = []
    for entry in root.findall('s:url', ns):
        url = entry.findtext('s:loc', namespaces=ns)
        path = urlsplit(url).path
        rows.append({'path': path, 'source': url, 'modified': entry.findtext('s:lastmod', namespaces=ns), 'imported': path in ROUTES or path == '/home'})
    write_json(output, {'source': f'{ORIGIN}/sitemap.xml', 'capturedAt': datetime.now(timezone.utc).isoformat(), 'pages': rows})
    err(f'{len(rows)} URLs inventoried → {output}')


@cli.command
@option('-c', '--cache', type=Path, default=Path('tmp/squarespace'), show_default=True)
@option('-f', '--force', is_flag=True, help='Replace existing authored page files with a new extraction.')
@option('-o', '--output', type=Path, default=Path('org'), show_default=True)
@argument('paths', nargs=-1)
def capture(cache: Path, force: bool, output: Path, paths: tuple[str, ...]) -> None:
    assets_path = output / 'content/assets.json'
    assets = json.loads(assets_path.read_text()) if assets_path.exists() else {}

    def image_asset(src: str) -> str:
        url = absolute_link(src)
        if url not in assets:
            suffix = Path(unquote(urlsplit(url).path)).suffix.lower()
            if suffix not in {'.jpg', '.jpeg', '.png', '.webp', '.gif'}:
                suffix = '.jpg'
            name = sha256(url.encode()).hexdigest()[:16] + suffix
            download(url + ('&' if '?' in url else '?') + 'format=1500w', output / 'public/media' / name)
            assets[url] = f'/media/{name}'
        return assets[url]

    for path in paths or ROUTES:
        slug = path.strip('/').replace('/', '--') or 'home'
        destination = output / 'content/pages' / f'{slug}.json'
        if destination.exists() and not force:
            err(f'Keeping authored page {destination}')
            continue
        soup = BeautifulSoup(download(ORIGIN + path, cache / f'{slug}.html'), 'html.parser')
        main = soup.select_one('main')
        if main is None:
            raise ValueError(f'No main content found at {path}')
        blocks = []
        review = []
        for block in main.select('.sqs-block, .user-items-list-item-container > li, .user-items-list-carousel__slide'):
            classes = block.get('class', [])
            text = block.select_one('.sqs-html-content')
            button = block.select_one('.sqs-block-button-container a')
            if block.select_one('.list-item-content__title'):
                heading = block.select_one('.list-item-content__title').get_text(' ', strip=True)
                description = block.select_one('.list-item-content__description')
                link = block.select_one('.list-item-content__button')
                img = block.select_one('img')
                src = img.get('data-src') or img.get('src') if img else None
                blocks.append({'type': 'card', 'title': heading, 'html': clean_html(str(description or '')), 'href': absolute_link(link['href']) if link else ORIGIN + path, 'src': image_asset(src) if src else None})
            elif 'sqs-block-accordion' in classes:
                for item in block.select('.accordion-item'):
                    title = item.select_one('.accordion-item__title')
                    body = item.select_one('.accordion-item__description')
                    blocks.append({'type': 'accordion', 'title': title.get_text(' ', strip=True), 'html': clean_html(str(body))})
            elif text:
                html = clean_html(str(text), ORIGIN + path)
                if BeautifulSoup(html, 'html.parser').get_text(strip=True):
                    blocks.append({'type': 'html', 'html': html})
            elif button:
                blocks.append({'type': 'link', 'label': button.get_text(' ', strip=True), 'href': absolute_link(button['href'])})
            elif 'sqs-block-image' in classes:
                img = block.select_one('img[data-src], img[src]')
                if img:
                    src = img.get('data-src') or img.get('src')
                    link = img.find_parent('a')
                    blocks.append({'type': 'image', 'src': image_asset(src), 'alt': img.get('alt') or '', 'source': absolute_link(src), 'href': absolute_link(link['href']) if link and link.get('href') else None})
            elif 'sqs-block-code' in classes:
                html = clean_html(str(block.select_one('.sqs-block-content') or ''), ORIGIN + path)
                if BeautifulSoup(html, 'html.parser').get_text(strip=True):
                    blocks.append({'type': 'html', 'html': html})
                review.append({'id': block.get('id'), 'kind': 'custom-code'})
            elif any(kind in classes for kind in ['sqs-block-form', 'sqs-block-newsletter', 'sqs-block-embed', 'sqs-block-video']):
                review.append({'id': block.get('id'), 'kind': 'interactive-embed'})
                blocks.append({'type': 'link', 'label': 'Continue on hudcostreets.org', 'href': ORIGIN + path})
            elif block.get('data-sqsp-block') != 'shape' and not any(kind in classes for kind in ['sqs-block-spacer', 'sqs-block-horizontalrule']):
                review.append({'id': block.get('id'), 'kind': 'unmapped-block', 'classes': classes})
        # Galleries/backgrounds are recorded separately so they cannot silently disappear in review.
        images = []
        for img in main.select('img[data-src]'):
            url = absolute_link(img['data-src'])
            if url not in images:
                images.append(url)
        meta = soup.select_one('meta[name="description"]')
        if not blocks:
            raise ValueError(f'No content extracted at {path}; add a parser for this page before marking it imported')
        write_json(destination, {'path': path, 'title': soup.title.get_text().split(' — ')[0].strip(), 'description': meta.get('content', '') if meta else '', 'source': ORIGIN + path, 'blocks': blocks, 'review': review, 'sourceImages': images})
        write_json(assets_path, assets)
        err(f'{path}: {len(blocks)} content blocks, {len(review)} blocks to review')


if __name__ == '__main__':
    cli()
