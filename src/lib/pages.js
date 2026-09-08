import { parseArticle } from './markdown.js'

const raw = import.meta.glob('../../content/pages/*.md', {
  query: '?raw', import: 'default', eager: true,
})

export const PAGES = Object.values(raw).map((t) => parseArticle(t)).filter(Boolean)

export function pageBySlug(slug) {
  return PAGES.find((p) => p.slug === slug) ?? null
}
