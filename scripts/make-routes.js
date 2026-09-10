// 빌드 후: 라우트별 index.html 생성 + 제목/설명/본문 주입(SEO) + sitemap/RSS 생성
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseArticle } from '../src/lib/markdown.js'
import { SITE, esc, staticPages, speettoOverview, speettoRoundPages, lottoOverview } from './seo-pages.js'

const dist = 'dist'
const base = readFileSync(join(dist, 'index.html'), 'utf-8')
const today = new Date().toISOString().slice(0, 10)
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf-8')) : null)

// 페이지별 head/본문을 주입한 HTML을 만든다.
function render({ title, description, canonical, html, ld }) {
  let out = base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(property="og:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`)
  const head = `<link rel="canonical" href="${esc(canonical)}" />` + (ld ? `<script type="application/ld+json">${ld}</script>` : '')
  out = out.replace('</head>', `${head}</head>`)
  if (html) out = out.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  return out
}

function writePage(path, htmlText) {
  const dir = path ? join(dist, path) : dist
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), htmlText)
}

// ---------- 글 ----------
const articles = ['content/dreams', 'content/guides']
  .flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)))
  .map((f) => parseArticle(readFileSync(f, 'utf-8')))
  .filter(Boolean)
  .map((a) => ({ ...a, category: a.category ?? 'dream' }))
  .sort((a, b) => a.order - b.order)

const speetto = readJson('public/data/speetto.json')
const lotto = readJson('public/data/lotto-stats.json')

const sitemap = [] // { loc, lastmod, changefreq }
const addUrl = (path, lastmod, changefreq) =>
  sitemap.push({ loc: `${SITE}/${path}`, lastmod: lastmod ?? today, changefreq })

// ---------- 기능 페이지(홈·운세·궁합·띠별·사주·글목록) ----------
for (const p of staticPages({ articles, speetto, lotto, today })) {
  const ld = p.path === ''
    ? JSON.stringify({
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: '사또 - 사주 로또 스피또', url: `${SITE}/`,
        description: '오늘의 운세, 궁합, 띠별·사주 행운 번호, 로또 추천, 스피또 당첨 지역',
      })
    : null
  writePage(p.path, render({ ...p, canonical: `${SITE}/${p.path}`, ld }))
  addUrl(p.path, p.lastmod, p.changefreq ?? 'weekly')
}

// ---------- 스피또: 전체 + 회차별 ----------
if (speetto) {
  const ov = speettoOverview(speetto)
  writePage('speetto/', render({ ...ov, canonical: `${SITE}/speetto/` }))
  addUrl('speetto/', ov.lastmod, 'daily')

  for (const p of speettoRoundPages(speetto)) {
    writePage(p.path, render({ ...p, canonical: `${SITE}/${p.path}` }))
    addUrl(p.path, p.lastmod, p.changefreq)
  }
} else {
  writePage('speetto/', base)
  addUrl('speetto/', today, 'daily')
}

// ---------- 로또 ----------
if (lotto) {
  const lo = lottoOverview(lotto)
  writePage('lotto/', render({ ...lo, canonical: `${SITE}/lotto/` }))
  addUrl('lotto/', lo.lastmod, 'weekly')
} else {
  writePage('lotto/', base)
  addUrl('lotto/', today, 'weekly')
}

// ---------- 글 상세 ----------
for (const a of articles) {
  const ld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, description: a.description,
    datePublished: a.date ?? '2026-09-03',
    dateModified: a.date ?? '2026-09-03',
    author: { '@type': 'Organization', name: '사또' },
    publisher: { '@type': 'Organization', name: '사또', url: `${SITE}/` },
    mainEntityOfPage: `${SITE}/info/${a.slug}/`,
  })
  writePage(`info/${a.slug}/`, render({
    title: `${a.title} | 사또`,
    description: a.description,
    canonical: `${SITE}/info/${a.slug}/`,
    html: `<article><h1>${esc(a.title)}</h1>${a.html}</article>`,
    ld,
  }))
  addUrl(`info/${a.slug}/`, a.date ?? '2026-09-03', 'monthly')
}

// ---------- 정적 페이지(/privacy /about) ----------
const pages = readdirSync('content/pages')
  .filter((f) => f.endsWith('.md'))
  .map((f) => parseArticle(readFileSync(join('content/pages', f), 'utf-8')))
  .filter(Boolean)
for (const pg of pages) {
  writePage(`${pg.slug}/`, render({
    title: `${pg.title} | 사또`,
    description: pg.description,
    canonical: `${SITE}/${pg.slug}/`,
    html: `<article><h1>${esc(pg.title)}</h1>${pg.html}</article>`,
  }))
  addUrl(`${pg.slug}/`, pg.date ?? '2026-09-08', 'yearly')
}

copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))

// ---------- sitemap ----------
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq></url>`)
    .join('\n')}\n</urlset>\n`)

// ---------- RSS ----------
const byDate = [...articles].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.order - a.order)
writeFileSync(join(dist, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>
<title>사또 - 꿈해몽·사주·로또 이야기</title>
<link>${SITE}/info/</link>
<description>꿈해몽과 사주·로또 상식을 쉽게 정리했습니다</description>
${byDate.map((a) => `<item><title>${esc(a.title)}</title><link>${SITE}/info/${a.slug}/</link><description>${esc(a.description)}</description><pubDate>${new Date((a.date ?? '2026-09-03') + 'T09:00:00+09:00').toUTCString()}</pubDate><guid>${SITE}/info/${a.slug}/</guid></item>`).join('\n')}
</channel></rss>\n`)

console.log(`sitemap ${sitemap.length}개 | 글 ${articles.length}편 | 스피또 회차 페이지 ${speetto ? speettoRoundPages(speetto).length : 0}개`)
