import INDEX from 'virtual:article-index'
import { parseArticle } from './markdown.js'
import { parseSlugList } from './slug-list.js'

// 목록에 필요한 frontmatter만 메인 번들에 싣는다(scripts/vite-article-index.js).
// 본문은 글마다 별도 청크로 지연 로드한다 — 230여 편을 통째로 실으면 번들이 1.4MB가 되어 모바일 LCP가 무너진다.
const bodyLoaders = import.meta.glob(['../../content/dreams/*.md', '../../content/guides/*.md'], {
  query: '?raw', import: 'default',
})
// 파일 이름 = 슬러그 (articles.test.js가 확인)
const LOADER_BY_SLUG = Object.fromEntries(
  Object.entries(bodyLoaders).map(([path, load]) => [path.match(/([^/]+)\.md$/)[1], load]),
)

// 검색에서 뺀 글 목록(content/noindex.txt). 파일이 없으면 빈 목록.
const noindexRaw = import.meta.glob('../../content/noindex.txt', { query: '?raw', import: 'default', eager: true })
const NOINDEX = parseSlugList(Object.values(noindexRaw)[0] ?? null)

export const CATEGORIES = [
  { id: 'dream', label: '꿈해몽' },
  { id: 'guide', label: '사주·로또 상식' },
]

export const ARTICLES = INDEX
  .map((a) => ({ ...a, category: a.category ?? 'dream', noindex: NOINDEX.has(a.slug) }))
  .sort((a, b) => a.order - b.order)

export function articleBySlug(slug) {
  return ARTICLES.find((a) => a.slug === slug) ?? null
}

export function hasArticleFile(slug) {
  return slug in LOADER_BY_SLUG
}

// --- 본문 html (글마다 지연 로드, 한 번 받으면 캐시) ---
const htmlCache = new Map()

export function cachedArticleHtml(slug) {
  return htmlCache.get(slug) ?? null
}

export async function loadArticleHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug)
  const load = LOADER_BY_SLUG[slug]
  if (!load) return null
  const html = parseArticle(await load())?.html ?? null
  htmlCache.set(slug, html)
  return html
}

// --- 검색용 본문 평문 { slug: text } (검색창을 쓸 때만 내려받는다) ---
let textPromise = null
export function loadSearchText() {
  textPromise ??= import('virtual:article-text').then((m) => m.default)
  return textPromise
}
