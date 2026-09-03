// 빌드 후: 라우트별 index.html 생성 + 글 페이지에 제목/설명/본문 주입(SEO) + sitemap 생성
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseArticle } from '../src/lib/markdown.js'

const ROUTES = ['unse', 'gunghap', 'zodiac', 'saju', 'lotto', 'speetto', 'info']
const dist = 'dist'
const base = readFileSync(join(dist, 'index.html'), 'utf-8')

for (const r of ROUTES) {
  mkdirSync(join(dist, r), { recursive: true })
  writeFileSync(join(dist, r, 'index.html'), base)
}
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))

// 글 페이지: 크롤러가 본문을 읽도록 실제 콘텐츠를 HTML에 주입 (앱 로드 시 React가 대체)
const articles = ['content/dreams', 'content/guides']
  .flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)))
  .map((f) => parseArticle(readFileSync(f, 'utf-8')))
  .filter(Boolean)
  .sort((a, b) => a.order - b.order)

for (const a of articles) {
  const html = base
    .replace(/<title>[^<]*<\/title>/, `<title>${a.title} | 사또</title>`)
    .replace(/(name="description" content=")[^"]*(")/, `$1${a.description}$2`)
    .replace(/(property="og:title" content=")[^"]*(")/, `$1${a.title} | 사또$2`)
    .replace(/(property="og:description" content=")[^"]*(")/, `$1${a.description}$2`)
    .replace(/(property="og:url" content=")[^"]*(")/, `$1https://satto.kr/info/${a.slug}/$2`)
    .replace('<div id="root"></div>', `<div id="root"><article><h1>${a.title}</h1>${a.html}</article></div>`)
  mkdirSync(join(dist, 'info', a.slug), { recursive: true })
  writeFileSync(join(dist, 'info', a.slug, 'index.html'), html)
}

// sitemap
const today = new Date().toISOString().slice(0, 10)
const urls = [
  ['', 'daily'], ['unse/', 'daily'], ['gunghap/', 'weekly'], ['zodiac/', 'daily'],
  ['saju/', 'daily'], ['lotto/', 'weekly'], ['speetto/', 'daily'], ['info/', 'weekly'],
  ...articles.map((a) => [`info/${a.slug}/`, 'monthly']),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(([u, f]) => `  <url><loc>https://satto.kr/${u}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq></url>`)
  .join('\n')}\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

console.log('routes:', ROUTES.join(', '), '| articles:', articles.map((a) => a.slug).join(', '))
