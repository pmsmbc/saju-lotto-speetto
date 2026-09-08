import { pageBySlug } from '../lib/pages.js'

export function StaticPage({ slug }) {
  const page = pageBySlug(slug)
  if (!page) return null
  return (
    <section className="info-page">
      <article className="article surface-card">
        <h1>{page.title}</h1>
        <div className="article-body" dangerouslySetInnerHTML={{ __html: page.html }} />
      </article>
    </section>
  )
}

export default StaticPage
