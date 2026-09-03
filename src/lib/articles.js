import { parseArticle } from './markdown.js'

// content/dreams/*.md 를 빌드 시점에 모두 읽어온다
const raw = import.meta.glob(['../../content/dreams/*.md', '../../content/guides/*.md'], {
  query: '?raw', import: 'default', eager: true,
})

export const CATEGORIES = [
  { id: 'dream', label: '꿈해몽' },
  { id: 'guide', label: '사주·로또 상식' },
]

export const ARTICLES = Object.values(raw)
  .map((text) => parseArticle(text))
  .filter(Boolean)
  .map((a) => ({ ...a, category: a.category ?? 'dream' }))
  .sort((a, b) => a.order - b.order)

export function articleBySlug(slug) {
  return ARTICLES.find((a) => a.slug === slug) ?? null
}
