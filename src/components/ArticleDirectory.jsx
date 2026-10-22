import { ARTICLES } from '../lib/articles.js'
import { directoryGroups, shortName } from '../lib/directory.js'

// 홈 "글 모아보기". 구글이 가장 자주 크롤하는 페이지가 홈이라, 홈 한 번 크롤로 검색에 남긴 글 전부가
// 발견되게 주제별 짧은 이름 링크를 모두 싣는다. 정적 HTML(scripts/seo-pages.js)도 같은 묶음을 쓴다.
export function ArticleDirectory({ articles = ARTICLES }) {
  const groups = directoryGroups(articles)
  if (groups.length === 0) return null
  return (
    <section className="article-directory surface-card" aria-label="꿈해몽·상식 글 모아보기">
      <h2 className="page-intro-title">꿈해몽·상식 글 모아보기</h2>
      {groups.map((g) => (
        <div key={g.id} className="directory-group">
          <h3>{g.label} <span className="directory-count">{g.items.length}편</span></h3>
          <ul className="directory-list">
            {g.items.map((a) => (
              <li key={a.slug}>
                <a href={`/info/${a.slug}/`} title={a.title}>{shortName(a.title)}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

export default ArticleDirectory
