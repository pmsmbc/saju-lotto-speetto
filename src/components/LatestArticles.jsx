import { ARTICLES } from '../lib/articles.js'

// 첫 화면에서 글로 바로 들어갈 수 있게 하는 목록.
// 정적 HTML(scripts/seo-pages.js)도 같은 기준으로 같은 글을 싣는다.
export function latestArticles(all = ARTICLES, limit = 8) {
  return [...all]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.order - a.order)
    .slice(0, limit)
}

export function LatestArticles({ limit = 8 }) {
  const items = latestArticles(ARTICLES, limit)
  if (items.length === 0) return null
  return (
    <section className="latest-articles surface-card" aria-label="새로 올라온 글">
      <h2 className="page-intro-title">새로 올라온 글</h2>
      <ul className="latest-list">
        {items.map((a) => (
          <li key={a.slug}>
            <a href={`/info/${a.slug}/`}>
              {a.icon && <img className="info-icon" src={`/twemoji/${a.icon}.svg`} alt="" aria-hidden="true" />}
              {a.title}
            </a>
          </li>
        ))}
      </ul>
      <p className="hint"><a href="/info/">꿈해몽·상식 글 전체 보기</a></p>
    </section>
  )
}

export default LatestArticles
