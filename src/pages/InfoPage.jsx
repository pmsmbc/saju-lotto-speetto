import { useEffect, useState } from 'react'
import { ARTICLES, CATEGORIES, articleBySlug } from '../lib/articles.js'
import { hashSeed, mulberry32 } from '../lib/seed.js'
import { randomSet } from '../lib/lotto.js'
import { todayKST } from '../lib/dateformat.js'
import { LottoBall } from '../components/LottoBall.jsx'
import ShareButton from '../components/ShareButton.jsx'

function slugFromPath() {
  const m = window.location.pathname.match(/^\/info\/([a-z]+)\/?$/)
  return m ? m[1] : null
}

// 꿈 주제 + 오늘 날짜 시드의 결정적 행운 번호
function dreamNumbers(slug, dateStr) {
  return randomSet(mulberry32(hashSeed(`dream:${slug}:${dateStr}`)))
}

export function InfoPage({ today = todayKST() }) {
  const [slug, setSlug] = useState(slugFromPath)
  const [cat, setCat] = useState('dream')

  useEffect(() => {
    const onPop = () => setSlug(slugFromPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = (nextSlug) => {
    const path = nextSlug ? `/info/${nextSlug}/` : '/info'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setSlug(nextSlug)
    window.scrollTo(0, 0)
  }

  const article = slug ? articleBySlug(slug) : null

  if (article) {
    return (
      <section className="info-page">
        <button type="button" className="back-btn" onClick={() => open(null)}>← 글 목록</button>
        <article className="article surface-card">
          <h1>
            {article.icon && <img className="article-icon" src={`/twemoji/${article.icon}.svg`} alt="" aria-hidden="true" />}
            {article.title}
          </h1>
          {/* 본문은 저장소의 마크다운 파일에서 빌드 시 변환됨 */}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.html }} />
          {article.category === 'dream' && (
            <div className="dream-lucky">
              <h2>오늘의 {article.title.split(' ')[0]} 행운 번호</h2>
              <div className="set-balls">
                {dreamNumbers(article.slug, today).map((n) => (
                  <LottoBall key={n} number={n} />
                ))}
              </div>
              <p className="hint">이 꿈을 꾼 분들을 위한 오늘의 번호예요. 매일 자정에 바뀝니다.</p>
            </div>
          )}
          <div className="share-row">
            <ShareButton
              title={article.title}
              text={article.description}
              url={`${window.location.origin}/info/${article.slug}/`}
            />
          </div>
        </article>
        <p className="hint zodiac-hint">꿈해몽은 전통 풀이를 정리한 참고용 콘텐츠입니다.</p>
      </section>
    )
  }

  return (
    <section className="info-page">
      <h1 className="info-title">정보 이야기</h1>
      <p className="info-sub">꿈해몽과 사주·로또 상식을 쉽게 정리했습니다.</p>
      <div className="cat-tabs" role="group" aria-label="카테고리">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === cat ? 'sub-tab active' : 'sub-tab'}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="info-list">
        {ARTICLES.filter((a) => a.category === cat).map((a) => (
          <li key={a.slug}>
            <button type="button" className="info-card surface-card" onClick={() => open(a.slug)}>
              <span className="info-card-head">
                {a.icon && <img className="info-icon" src={`/twemoji/${a.icon}.svg`} alt="" aria-hidden="true" />}
                <span className="info-card-title">{a.title}</span>
              </span>
              <span className="info-card-desc">{a.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default InfoPage
