// 빌드 시 라우트별 정적 HTML(제목·설명·본문)을 만든다. 크롤러가 JS 없이도 내용을 읽게 하기 위함.
// React가 마운트되면 #root 안의 이 내용은 실제 앱으로 대체된다. 순수 함수만 두어 테스트 가능하게 유지.
import { GAME_TABS, sellingWithRank1, recentFinished } from '../src/lib/speetto.js'
import { aggregateByArea } from '../src/lib/aggregate.js'
import { ZODIACS } from '../src/lib/zodiac.js'
import { TAGS } from '../src/lib/tags.js'
import { PAGE_CONTENT } from '../src/lib/page-content.js'

export const SITE = 'https://satto.kr'

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const GAME_SLUG = { SP2000: '2000', SP1000: '1000', SP500: '500' }
export const gameSlug = (code) => GAME_SLUG[code]
export const gameCodeOfSlug = (slug) => Object.keys(GAME_SLUG).find((k) => GAME_SLUG[k] === slug) ?? null

export const kstDate = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d) // YYYY-MM-DD
}

const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`
const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

// 기능 페이지 설명. React <PageIntro />가 화면에 그리는 것과 같은 문자열을 쓴다.
export function introHtml(id) {
  const c = PAGE_CONTENT[id]
  return c ? `<h2>${esc(c.heading)}</h2>${c.html}` : ''
}

// 모든 페이지 아래에 붙는 푸터. React <Footer />와 같은 링크를 담아
// 자바스크립트 없이도 개인정보처리방침·소개에 닿을 수 있게 한다.
export function footerHtml() {
  const links = [
    ['/', '오늘의 운세'], ['/gunghap/', '궁합'], ['/zodiac/', '띠별 번호'], ['/saju/', '사주 번호'],
    ['/lotto/', '로또 추천'], ['/speetto/', '스피또 당첨 지역'], ['/info/', '꿈해몽·상식'],
  ]
  return `<footer><nav>${links.map(([h, l]) => link(h, l)).join(' · ')}</nav>
<p>${link('/about/', '사이트 소개')} · ${link('/privacy/', '개인정보처리방침')}</p>
<p>© 2026 사또 (satto.kr). All rights reserved.</p></footer>`
}

// ---------- 스피또 ----------
function rank1StoresOf(data, gameName, round) {
  return (data.stores ?? []).filter((s) => s.game === gameName && s.round === round && s.rank === 1)
}

function areaSummary(stores) {
  // '서울 성북구 1곳' 형태. 1곳이면 수 생략
  return aggregateByArea(stores).map((a) => (a.count > 1 ? `${a.region} ${a.count}곳` : a.region))
}

function roundLine(r, stores, gameCode) {
  const areas = areaSummary(stores)
  const remain = r.status === '판매종료' ? '판매종료' : `1등 ${r.rank1Total}장 중 ${r.rank1Remaining}장 남음`
  const stock = r.status !== '판매종료' && Number.isFinite(r.stockRate) ? ` · 판매점 입고율 ${r.stockRate}%` : ''
  const where = areas.length ? `1등 당첨 지역: ${areas.join(', ')} (${stores.length}곳)` : '아직 1등 당첨 지역이 없습니다'
  return `${link(`/speetto/${gameSlug(gameCode)}/${r.round}/`, `${r.round}회`)} — ${esc(remain)}${esc(stock)}<br>${esc(where)}`
}

export function speettoGuideHtml() {
  return `<h2>이렇게 활용하세요</h2>
<p>스피또는 회차마다 1등이 정해진 수량만 인쇄되어 전국 판매점에 배포됩니다. <strong>1등 남음</strong>은 아직 판매되지 않은 1등 매수, <strong>당첨 지역</strong>은 이미 1등이 나온 지역·판매점입니다. 남은 1등은 아직 팔리지 않은 다른 판매점의 재고에 있을 가능성이 있습니다.</p>
<p>※ 같은 지역·판매점에서 한 회차에 1등이 여러 번 나온 사례도 있습니다. 본 정보는 당첨 확률을 보장하지 않는 참고용입니다. 자료 출처: 동행복권.</p>`
}

export function speettoOverview(data) {
  const date = kstDate(data.updatedAt)
  const sections = GAME_TABS.map((g) => {
    const selling = sellingWithRank1(data.rounds, g.code)
    const finished = recentFinished(data.rounds, g.code, 2)
    const lines = [...selling, ...finished].map((r) => roundLine(r, rank1StoresOf(data, g.name, r.round), g.code))
    return `<h2>${esc(g.name)} 1등 남은 회차와 당첨 지역</h2>${lines.length ? list(lines) : '<p>현재 1등이 남은 판매중 회차가 없습니다.</p>'}`
  })
  const headline = GAME_TABS.map((g) => {
    const r = sellingWithRank1(data.rounds, g.code)[0]
    return r ? `${g.name} ${r.round}회 1등 ${r.rank1Remaining}/${r.rank1Total}장` : null
  }).filter(Boolean)
  return {
    title: '스피또 1등 당첨 지역·남은 1등 현황 (스피또2000·1000·500) | 사또',
    description: `스피또 회차별 1등 남은 매수와 1등 당첨 판매점 지역을 하루 3번 갱신합니다. ${headline.join(', ')}. 기준 ${date ?? ''}`.trim(),
    lastmod: date,
    html: `<h1>스피또 1등 당첨 지역·남은 1등 현황</h1>
<p>스피또2000·스피또1000·스피또500의 판매중 회차마다 1등이 몇 장 남았는지, 1등이 이미 나온 지역과 판매점은 어디인지 정리했습니다. 동행복권 자료를 하루 3번 자동 갱신합니다.${date ? ` 마지막 업데이트: ${esc(date)}` : ''}</p>
${sections.join('\n')}
${speettoGuideHtml()}`,
  }
}

export function speettoRoundPages(data) {
  const date = kstDate(data.updatedAt)
  return (data.rounds ?? []).map((r) => {
    const g = GAME_TABS.find((t) => t.code === r.gameCode)
    if (!g) return null
    const stores = rank1StoresOf(data, g.name, r.round)
    const areas = areaSummary(stores)
    const ended = r.status === '판매종료'
    const remainText = ended ? '판매종료' : `1등 ${r.rank1Total}장 중 ${r.rank1Remaining}장 남음`
    const others = (data.rounds ?? [])
      .filter((o) => o.gameCode === r.gameCode && o.round !== r.round)
      .sort((a, b) => b.round - a.round)
      .slice(0, 6)
    const storeRows = stores
      .map((s) => `<tr><td>${esc(s.region)}</td><td>${esc(s.store)}</td><td>${esc(s.address)}</td></tr>`)
      .join('')
    return {
      path: `speetto/${gameSlug(r.gameCode)}/${r.round}/`,
      title: `${g.name} ${r.round}회 1등 당첨 지역·판매점 (${remainText}) | 사또`,
      description: `${g.name} ${r.round}회 1등 당첨 판매점 ${stores.length}곳${areas.length ? ` (${areas.join(', ')})` : ''}. ${remainText}${!ended && Number.isFinite(r.stockRate) ? `, 판매점 입고율 ${r.stockRate}%` : ''}. 기준 ${date ?? ''}`.trim(),
      lastmod: date,
      changefreq: ended ? 'monthly' : 'daily',
      html: `<h1>${esc(g.name)} ${r.round}회 1등 당첨 지역</h1>
<p><strong>${esc(remainText)}</strong>${!ended && Number.isFinite(r.stockRate) ? ` · 판매점 입고율 ${r.stockRate}%` : ''}${date ? ` · 기준 ${esc(date)}` : ''}</p>
<h2>1등 당첨 지역 요약</h2>
<p>${areas.length ? esc(`${areas.join(', ')} — 총 ${stores.length}곳`) : '아직 1등 당첨 지역이 없습니다.'}</p>
${stores.length ? `<h2>1등 당첨 판매점</h2><table><thead><tr><th>지역</th><th>판매점</th><th>주소</th></tr></thead><tbody>${storeRows}</tbody></table>` : ''}
<h2>${esc(g.name)} 다른 회차</h2>
${list(others.map((o) => `${link(`/speetto/${gameSlug(o.gameCode)}/${o.round}/`, `${g.name} ${o.round}회`)} — ${esc(o.status === '판매종료' ? '판매종료' : `1등 ${o.rank1Total}장 중 ${o.rank1Remaining}장 남음`)}`))}
<p>${link('/speetto/', '스피또 전체 1등 남은 현황 보기')}</p>
${speettoGuideHtml()}`,
    }
  }).filter(Boolean)
}

// ---------- 로또 ----------
export function lottoOverview(stats) {
  const d = stats?.latestDraw
  const date = kstDate(stats?.updatedAt)
  const freq = Object.entries(stats?.frequencies ?? {}).map(([n, c]) => [Number(n), c])
  const byCount = (dir) => [...freq].sort((a, b) => dir * (b[1] - a[1]) || a[0] - b[0]).slice(0, 6).map(([n]) => n)
  const hot = byCount(1), cold = byCount(-1)
  const won = (v) => `${Math.round(v / 1e8) / 10}억원`
  return {
    title: d ? `로또 번호 추천 - ${d.round}회 당첨번호와 통계 기반 추천 | 사또` : '로또 번호 추천 | 사또',
    description: d
      ? `로또 ${d.round}회(${d.date}) 당첨번호 ${d.numbers.join(' ')} + 보너스 ${d.bonus}. 1~${d.round}회 출현 빈도로 뽑는 통계 기반 추천과 무작위 추천, 띠별·사주 행운 번호.`
      : '역대 로또 당첨번호 통계로 뽑는 추천 번호와 무작위 추천, 띠별·사주 행운 번호.',
    lastmod: date,
    html: `<h1>로또 번호 추천</h1>
${introHtml('lotto')}
${d ? `<h2>로또 ${d.round}회 당첨번호 (${esc(d.date)})</h2>
<p><strong>${d.numbers.map(esc).join(' · ')}</strong> + 보너스 <strong>${esc(d.bonus)}</strong></p>
${d.firstPrize ? `<p>1등 ${esc(d.firstPrize.winners)}명, 1인당 약 ${esc(won(d.firstPrize.amount))}</p>` : ''}` : ''}
${freq.length ? `<h2>역대 출현 빈도 (1~${esc(stats.totalDraws ?? d?.round ?? '')}회)</h2>
<p>가장 많이 나온 번호: ${hot.map(esc).join(', ')}<br>가장 적게 나온 번호: ${cold.map(esc).join(', ')}</p>` : ''}
`,
  }
}

// ---------- 공통 정적 페이지 ----------
const zodiacLinks = () => list(ZODIACS.map((z) => link(`/unse/?ddi=${z.id}`, `${z.label} 오늘의 운세`)))

export function articleLinks(articles, category, limit) {
  const items = articles.filter((a) => (a.category ?? 'dream') === category)
  return list((limit ? items.slice(0, limit) : items).map((a) => link(`/info/${a.slug}/`, a.title)))
}

// 글 제목에서 소재 이름만 뽑는다. '뱀꿈 해몽 — 길몽일까' → '뱀꿈', '죽는 꿈 해몽 — …' → '죽는 꿈'
export function shortName(title) {
  const head = String(title ?? '').split(/\s*[\u2014,-]\s*/)[0]
  return head.replace(/\s*해몽.*$/, '').trim() || head.trim()
}

// ---------- 태그별 글 모음 ----------
export function tagPages(articles) {
  const dreams = articles.filter((a) => (a.category ?? 'dream') === 'dream')
  return TAGS.map((t) => {
    const items = dreams.filter((a) => (a.tags ?? []).includes(t.id))
    if (items.length === 0) return null
    const names = [...new Set(items.map((a) => shortName(a.title)))].slice(0, 4)
    const latest = items.map((a) => a.date).filter(Boolean).sort().at(-1)
    return {
      path: `info/tag/${t.id}/`,
      title: `${t.label} 꿈 해몽 모음 ${items.length}편 — ${names.join(', ')} | 사또`,
      description: `${t.label} 관련 꿈해몽 ${items.length}편을 모았습니다. ${names.join(', ')} 등 상황별 풀이와 심리학적 해석.`,
      lastmod: latest,
      changefreq: 'weekly',
      html: `<h1>${esc(t.label)} 꿈 해몽 모음</h1>
<p>${esc(t.desc)}</p>
<h2>${esc(t.label)} 꿈 ${items.length}편</h2>
${list(items.map((a) => `${link(`/info/${a.slug}/`, a.title)} — ${esc(a.description)}`))}
<h2>다른 주제</h2>
${list(TAGS.filter((o) => o.id !== t.id && dreams.some((a) => (a.tags ?? []).includes(o.id)))
  .map((o) => link(`/info/tag/${o.id}/`, `${o.label} 꿈 해몽`)))}
<p>${link('/info/', '전체 글 목록 보기')}</p>`,
    }
  }).filter(Boolean)
}

// React <LatestArticles />가 화면에 그리는 것과 같은 목록
function latestHtml(newest) {
  return `<h2>새로 올라온 글</h2>
${list(newest.map((a) => link(`/info/${a.slug}/`, a.title)))}
<p>${link('/info/', '꿈해몽·상식 글 전체 보기')}</p>`
}

export function staticPages({ articles, speetto, lotto, today }) {
  const dreams = articles.filter((a) => (a.category ?? 'dream') === 'dream')
  const guides = articles.filter((a) => a.category === 'guide')
  const newest = [...articles].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.order - a.order).slice(0, 8)
  const latestArticleDate = articles.map((a) => a.date).filter(Boolean).sort().at(-1) ?? today
  const speettoLines = GAME_TABS.map((g) => {
    const r = sellingWithRank1(speetto?.rounds, g.code)[0]
    if (!r) return null
    const areas = areaSummary(rank1StoresOf(speetto, g.name, r.round))
    return `${link(`/speetto/${gameSlug(g.code)}/${r.round}/`, `${g.name} ${r.round}회`)} — 1등 ${r.rank1Total}장 중 ${r.rank1Remaining}장 남음${areas.length ? ` · 당첨 지역 ${esc(areas.join(', '))}` : ''}`
  }).filter(Boolean)
  const ld = lotto?.latestDraw

  return [
    {
      path: '',
      title: '사또 - 오늘의 운세, 로또 번호 추천, 스피또 1등 당첨 지역',
      description: '오늘의 띠별 운세와 궁합, 띠별·사주 행운 번호, 로또 번호 추천, 스피또 1등 남은 현황과 당첨 지역, 꿈해몽까지 한곳에서. 회원가입 없이 무료.',
      lastmod: today, changefreq: 'daily',
      html: `<h1>사또 - 사주 로또 스피또</h1>
${introHtml('unse')}
<h2>띠별로 바로 보기</h2>
${zodiacLinks()}
${latestHtml(newest)}`,
    },
    {
      path: 'unse/',
      // 홈(/)과 같은 화면이라 내용이 같다. 중복으로 잡히지 않게 대표 주소를 홈으로 지정하고
      // sitemap에는 홈만 싣는다.
      canonical: `${SITE}/`,
      noSitemap: true,
      title: '오늘의 운세 - 12띠 오늘 운세 (대길·길·보통·주의) | 사또',
      description: '오늘의 일진과 띠의 합충 관계로 보는 12띠 오늘의 운세. 총운·금전운과 재물·건강·사랑 키워드, 길방, 년생별 한 줄 운세를 매일 갱신합니다.',
      lastmod: today, changefreq: 'daily',
      html: `<h1>오늘의 운세</h1>
${introHtml('unse')}
<h2>띠별로 바로 보기</h2>
${zodiacLinks()}
${latestHtml(newest)}`,
    },
    {
      path: 'gunghap/',
      title: '궁합 보기 - 생년월일로 보는 띠 궁합·사주 궁합 | 사또',
      description: '두 사람의 생년월일로 겉궁합(띠)과 속궁합(일주), 오행 상생상극을 계산해 연인·부부·동료·친구 관계별 궁합 점수와 근거를 보여드립니다.',
      lastmod: '2026-09-15', changefreq: 'monthly',
      html: `<h1>궁합 보기</h1>
${introHtml('gunghap')}`,
    },
    {
      path: 'zodiac/',
      title: '오늘의 띠별 행운 번호 - 12띠 로또 번호 | 사또',
      description: '쥐띠부터 돼지띠까지 12띠별 오늘의 행운 번호 2개. 날짜와 띠로 매일 새로 정해지며 로또 번호 고를 때 참고할 수 있습니다.',
      lastmod: today, changefreq: 'daily',
      html: `<h1>오늘의 띠별 행운 번호</h1>
${introHtml('zodiac')}`,
    },
    {
      path: 'saju/',
      title: '사주 행운 번호 - 생년월일시로 뽑는 오늘의 로또 번호 | 사또',
      description: '생년월일과 태어난 시로 사주팔자 네 기둥을 세우고, 사주와 오늘 날짜로 정해지는 행운 번호 6개를 뽑아드립니다. 음력 생일도 지원합니다.',
      lastmod: today, changefreq: 'daily',
      html: `<h1>사주 행운 번호</h1>
${introHtml('saju')}`,
    },
    {
      path: 'info/',
      title: '꿈해몽·사주·로또 상식 글 모음 | 사또',
      description: `뱀꿈·돼지꿈·똥꿈 등 꿈해몽 ${dreams.length}편과 사주·로또·스피또 상식 ${guides.length}편. 상황별 해몽과 심리학적 풀이, 꿈꾼 날의 행운 번호까지.`,
      lastmod: latestArticleDate, changefreq: 'weekly',
      html: `<h1>꿈해몽·사주·로또 상식</h1>
<p>꿈해몽 ${dreams.length}편과 사주·로또·스피또 상식 ${guides.length}편을 모았습니다. 꿈해몽은 상황별 풀이와 심리학적 해석, 꿈을 꾼 날의 행운 번호를 함께 담았습니다.</p>
<h2>주제별로 보기</h2>
${list(TAGS.filter((t) => dreams.some((a) => (a.tags ?? []).includes(t.id)))
  .map((t) => link(`/info/tag/${t.id}/`, `${t.label} 꿈 해몽 ${dreams.filter((a) => (a.tags ?? []).includes(t.id)).length}편`)))}
<h2>꿈해몽</h2>
${list(dreams.map((a) => link(`/info/${a.slug}/`, a.title)))}
<h2>사주·로또 상식</h2>
${list(guides.map((a) => link(`/info/${a.slug}/`, a.title)))}`,
    },
  ]
}
