import { pageContent } from '../lib/page-content.js'

// 기능 페이지 아래에 붙는 설명 섹션.
// 정적 HTML(scripts/seo-pages.js)과 같은 문자열을 쓰므로 크롤러와 방문자가 같은 내용을 본다.
export function PageIntro({ id }) {
  const content = pageContent(id)
  if (!content) return null
  return (
    <section className="page-intro surface-card" aria-label={content.heading}>
      <h2 className="page-intro-title">{content.heading}</h2>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: content.html }} />
    </section>
  )
}

export default PageIntro
