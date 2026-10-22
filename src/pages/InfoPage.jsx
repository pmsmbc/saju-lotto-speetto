import { useEffect, useState } from 'react'
import { ARTICLES, CATEGORIES, articleBySlug } from '../lib/articles.js'
import { tagsWithCount, tagById } from '../lib/tags.js'
import { searchArticles } from '../lib/search.js'
import { spaClick } from '../lib/spa-link.js'
import { AUTHOR_LABEL, AUTHOR_HREF, articleDates } from '../lib/article-meta.js'
import ShareButton from '../components/ShareButton.jsx'

function queryFromUrl() {
  return new URLSearchParams(window.location.search).get('q') ?? ''
}

// /info/tag/animal/ → 'animal'. 태그 경로가 아니거나 모르는 태그면 null.
function tagFromPath() {
  const m = window.location.pathname.match(/^\/info\/tag\/([a-z]+)\/?$/)
  return m && tagById(m[1]) ? m[1] : null
}

// /info/all/ → 검색에서 뺀 글(noindex)까지 모두 보는 전체 목록. 정적 페이지도 같은 주소로 만든다.
function archiveFromPath() {
  return /^\/info\/all\/?$/.test(window.location.pathname)
}

function slugFromPath() {
  // 슬러그는 소문자 + 하이픈 (taemong-fruit 처럼 두 단어 조합). /info/tag/... 와 /info/all/ 은 글이 아니다.
  const m = window.location.pathname.match(/^\/info\/([a-z]+(?:-[a-z]+)*)\/?$/)
  return m && m[1] !== 'tag' && m[1] !== 'all' ? m[1] : null
}

// 꿈 글에는 로또 번호를 붙이지 않는다. 본문이 "꿈과 당첨은 무관하다"고 말하는데
// 그 아래에 번호를 주면 말과 행동이 어긋나고, 꿈해몽이 복권 유도 수단으로 읽힌다.
export function InfoPage() {
  const [slug, setSlug] = useState(slugFromPath)
  const [cat, setCat] = useState('dream')
  const [tag, setTag] = useState(tagFromPath)
  const [archive, setArchive] = useState(archiveFromPath)
  const [query, setQuery] = useState(queryFromUrl)

  // 검색어를 주소에 남겨 공유·새로고침에도 결과가 유지되게 한다
  const changeQuery = (next) => {
    setQuery(next)
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('q', next)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', url)
  }

  // 태그를 고르면 주소도 태그 페이지로 바꾼다 (정적 생성 페이지와 같은 URL). 태그 페이지는 전체 목록이 아니다.
  const changeTag = (nextTag) => {
    setTag(nextTag)
    if (nextTag) setArchive(false)
    const path = nextTag ? `/info/tag/${nextTag}/` : archive ? '/info/all/' : '/info/'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path + window.location.search)
    }
  }

  // 전체 목록(/info/all/) ↔ 검색에 남긴 글 목록(/info/)
  const changeArchive = (next) => {
    setArchive(next)
    setTag(null)
    const path = next ? '/info/all/' : '/info/'
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
      setArchive(archiveFromPath())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = (nextSlug) => {
    if (!nextSlug) {
      setTag(null)
      setArchive(false)
    }
    const path = nextSlug ? `/info/${nextSlug}/` : '/info/'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setSlug(nextSlug)
    window.scrollTo(0, 0)
  }

  const article = slug ? articleBySlug(slug) : null

  // 같은 카테고리에서 다음 순서 3개 (끝이면 앞으로 순환). 검색에서 뺀 글로는 잇지 않는다.
  const related = article
    ? (() => {
        const pool = ARTICLES.filter((a) => a.category === article.category && a.slug !== article.slug && !a.noindex)
        const idx = pool.findIndex((a) => a.order > article.order)
        const start = idx === -1 ? 0 : idx
        return [...pool.slice(start), ...pool.slice(0, start)].slice(0, 3)
      })()
    : []

  if (article) {
    return (
      <section className="info-page">
        <a href="/info/" className="back-btn" onClick={(e) => spaClick(e, () => open(null))}>← 글 목록</a>
        <article className="article surface-card">
          <h1>
            {article.icon && <img className="article-icon" src={`/twemoji/${article.icon}.svg`} alt="" aria-hidden="true" />}
            {article.title}
          </h1>
          <p className="article-meta">
            <a href={AUTHOR_HREF}>{AUTHOR_LABEL}</a>
            {articleDates(article).map((d) => <span key={d}> · {d}</span>)}
          </p>
          {/* 본문은 저장소의 마크다운 파일에서 빌드 시 변환됨 */}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.html }} />
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
                  <a href={`/info/${r.slug}/`} onClick={(e) => spaClick(e, () => open(r.slug))}>
                    {r.icon && <img className="info-icon" src={`/twemoji/${r.icon}.svg`} alt="" aria-hidden="true" />}
                    {r.title}
                  </a>
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
  // 목록·태그 칩은 검색에 남긴 글만 센다. 크롤 요청이 검색에서 뺀 글로 새지 않게 하기 위함이다.
  // 뺀 글은 /info/all/ 에서 모두 보이고, 검색창은 언제나 전체 글을 뒤진다.
  const browsable = archive ? inCategory : inCategory.filter((a) => !a.noindex)
  const tagList = tagsWithCount(browsable)
  const withTag = (items) => (tag ? items.filter((a) => a.tags.includes(tag)) : items)
  const visible = query ? searchArticles(withTag(inCategory), query) : withTag(browsable)
  const hasHidden = ARTICLES.some((a) => a.noindex)

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
        <nav className="tag-chips" aria-label="주제별 분류">
          <a
            href={archive ? '/info/all/' : '/info/'}
            className={tag === null ? 'tag-chip active' : 'tag-chip'}
            aria-current={tag === null ? 'page' : undefined}
            onClick={(e) => spaClick(e, () => changeTag(null))}
          >
            전체 {browsable.length}
          </a>
          {tagList.map((t) => (
            <a
              key={t.id}
              href={`/info/tag/${t.id}/`}
              className={t.id === tag ? 'tag-chip active' : 'tag-chip'}
              aria-current={t.id === tag ? 'page' : undefined}
              onClick={(e) => spaClick(e, () => changeTag(t.id === tag ? null : t.id))}
            >
              {t.label} {t.count}
            </a>
          ))}
        </nav>
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
            <a href={`/info/${a.slug}/`} className="info-card surface-card" onClick={(e) => spaClick(e, () => open(a.slug))}>
              <span className="info-card-head">
                {a.icon && <img className="info-icon" src={`/twemoji/${a.icon}.svg`} alt="" aria-hidden="true" />}
                <span className="info-card-title">{a.title}</span>
              </span>
              <span className="info-card-desc">{a.description}</span>
            </a>
          </li>
        ))}
      </ul>
      {/* 전체 목록으로 가는 링크는 nofollow: 검색에서 뺀 글 171편으로 크롤이 번지지 않게 한다 */}
      {hasHidden && !query && !archive && (
        <p className="info-archive">
          <a href="/info/all/" rel="nofollow" onClick={(e) => spaClick(e, () => changeArchive(true))}>
            검색에서 뺀 글까지 전체 {ARTICLES.length}편 보기
          </a>
        </p>
      )}
      {archive && (
        <p className="info-archive">
          검색에서 뺀 글까지 모두 보는 전체 목록입니다.{' '}
          <a href="/info/" onClick={(e) => spaClick(e, () => changeArchive(false))}>검색에 남긴 글만 보기</a>
        </p>
      )}
    </section>
  )
}

export default InfoPage
