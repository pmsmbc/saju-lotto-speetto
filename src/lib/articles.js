import { parseArticle } from './markdown.js'
import { parseSlugList } from './slug-list.js'

// content/dreams/*.md 를 빌드 시점에 모두 읽어온다
const raw = import.meta.glob(['../../content/dreams/*.md', '../../content/guides/*.md'], {
  query: '?raw', import: 'default', eager: true,
})

// 검색에서 뺀 글 목록(content/noindex.txt). 파일이 없으면 빈 목록.
const noindexRaw = import.meta.glob('../../content/noindex.txt', { query: '?raw', import: 'default', eager: true })
const NOINDEX = parseSlugList(Object.values(noindexRaw)[0] ?? null)

export const CATEGORIES = [
  { id: 'dream', label: '꿈해몽' },
  { id: 'guide', label: '사주·로또 상식' },
]

export const ARTICLES = Object.values(raw)
  .map((text) => parseArticle(text))
  .filter(Boolean)
  // 검색용 평문: html에서 태그를 걷어내 미리 만들어 둔다 (번들에는 html만 실린다)
  .map((a) => ({
    ...a,
    category: a.category ?? 'dream',
    noindex: NOINDEX.has(a.slug),
    text: a.html.replace(/<[^>]*>/g, ' '),
  }))
  .sort((a, b) => a.order - b.order)

export function articleBySlug(slug) {
  return ARTICLES.find((a) => a.slug === slug) ?? null
}
