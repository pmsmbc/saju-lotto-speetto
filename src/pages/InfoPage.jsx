import { useEffect, useState } from 'react'
import { ARTICLES, CATEGORIES, articleBySlug } from '../lib/articles.js'
import { tagsWithCount, tagById } from '../lib/tags.js'
import { searchArticles } from '../lib/search.js'
import { hashSeed, mulberry32 } from '../lib/seed.js'
import { randomSet } from '../lib/lotto.js'
import { todayKST } from '../lib/dateformat.js'
import { LottoBall } from '../components/LottoBall.jsx'
import ShareButton from '../components/ShareButton.jsx'

function queryFromUrl() {
  return new URLSearchParams(window.location.search).get('q') ?? ''
}

// /info/tag/animal/ → 'animal'. 태그 경로가 아니거나 모르는 태그면 null.
function tagFromPath() {
  const m = window.location.pathname.match(/^\/info\/tag\/([a-z]+)\/?$/)
  return m && tagById(m[1]) ? m[1] : null
}

function slugFromPath() {
  // 슬러그는 소문자 + 하이픈 (taemong-fruit 처럼 두 단어 조합). /info/tag/... 는 글이 아니다.
  const m = window.location.pathname.match(/^\/info\/([a-z]+(?:-[a-z]+)*)\/?$/)
  return m && m[1] !== 'tag' ? m[1] : null
}

// 꿈 주제 + 오늘 날짜 시드의 결정적 행운 번호
function dreamNumbers(slug, dateStr) {
  return randomSet(mulberry32(hashSeed(`dream:${slug}:${dateStr}`)))
}

export function InfoPage({ today = todayKST() }) {
  const [slug, setSlug] = useState(slugFromPath)
  const [cat, setCat] = useState('dream')
  const [tag, setTag] = useState(tagFromPath)
  const [query, setQuery] = useState(queryFromUrl)

  // 검색어를 주소에 남겨 공유·새로고침에도 결과가 유지되게 한다
  const changeQuery = (next) => {
    setQuery(next)
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('q', next)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', url)
  }

  // 태그를 고르면 주소도 태그 페이지로 바꾼다 (정적 생성 페이지와 같은 URL)
  const changeTag = (nextTag) => {
    setTag(nextTag)
    const path = nextTag ? `/info/tag/${nextTag}/` : '/info/'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path + window.location.search)
    }
  }

  // 카테고리를 바꾸면 태그 선택은 초기화한다 (다른 카테고리엔 없는 태그일 수 있음)
  const changeCat = (nextCat) => {
    setCat(nextCat)
    changeTag(null)
  }

  useEffect(() => {
    const onPop = () => {
      setSlug(slugFromPath())
      setTag(tagFromPath())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = (nextSlug) => {
    if (!nextSlug) setTag(null)
    const path = nextSlug ? `/info/${nextSlug}/` : '/info/'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setSlug(nextSlug)
    window.scrollTo(0, 0)
  }

  const article = slug ? articleBySlug(slug) : null

  // 같은 카테고리에서 다음 순서 3개 (끝이면 앞으로 순환)
  const related = article
    ? (() => {
        const pool = ARTICLES.filter((a) => a.category === article.category && a.slug !== article.slug)
        const idx = pool.findIndex((a) => a.order > article.order)
        const start = idx === -1 ? 0 : idx
        return [...pool.slice(start), ...pool.slice(0, start)].slice(0, 3)
      })()
    : []

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
        {related.length > 0 && (
          <div className="related surface-card">
            <h2 className="related-title">함께 보면 좋은 글</h2>
            <ul className="related-list">
              {related.map((r) => (
                <li key={r.slug}>
                  <button type="button" onClick={() => open(r.slug)}>
                    {r.icon && <img className="info-icon" src={`/twemoji/${r.icon}.svg`} alt="" aria-hidden="true" />}
                    {r.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="hint zodiac-hint">꿈해몽은 전통 풀이를 정리한 참고용 콘텐츠입니다.</p>
      </section>
    )
  }

  const inCategory = ARTICLES.filter((a) => a.category === cat)
  const tagList = tagsWithCount(inCategory)
  const byTag = tag ? inCategory.filter((a) => a.tags.includes(tag)) : inCategory
  const visible = searchArticles(byTag, query)

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
            onClick={() => changeCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="info-search">
        <input
          type="search"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="어떤 꿈을 꾸셨나요?"
          aria-label="글 검색"
        />
      </div>
      {tagList.length > 0 && (
        <div className="tag-chips" role="group" aria-label="주제별 분류">
          <button
            type="button"
            className={tag === null ? 'tag-chip active' : 'tag-chip'}
            aria-pressed={tag === null}
            onClick={() => changeTag(null)}
          >
            전체 {inCategory.length}
          </button>
          {tagList.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tag ? 'tag-chip active' : 'tag-chip'}
              aria-pressed={t.id === tag}
              onClick={() => changeTag(t.id === tag ? null : t.id)}
            >
              {t.label} {t.count}
            </button>
          ))}
        </div>
      )}
      {query && (
        <p className="info-count">
          {visible.length > 0 ? (
            `'${query}' 검색 결과 ${visible.length}편`
          ) : tag ? (
            <>
              '{query}'에 맞는 글이 <b>{tagById(tag).label}</b> 안에는 없어요.{' '}
              <button type="button" className="link-btn" onClick={() => changeTag(null)}>
                전체에서 찾기
              </button>
            </>
          ) : (
            `'${query}'에 맞는 글이 없어요. 다른 말로 찾아보세요.`
          )}
        </p>
      )}
      <ul className="info-list">
        {visible.map((a) => (
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
