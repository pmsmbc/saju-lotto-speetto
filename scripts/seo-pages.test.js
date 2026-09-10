import { describe, test, expect } from 'vitest'
import { esc, gameSlug, kstDate, speettoOverview, speettoRoundPages, lottoOverview, staticPages } from './seo-pages.js'

const speetto = {
  updatedAt: '2026-09-10T06:35:28.246Z',
  rounds: [
    { game: '스피또1000', gameCode: 'SP1000', round: 109, status: '판매중', rank1Remaining: 7, rank1Total: 12, stockRate: 45 },
    { game: '스피또1000', gameCode: 'SP1000', round: 108, status: '판매종료', rank1Remaining: 1, rank1Total: 11, stockRate: 100 },
  ],
  stores: [
    { game: '스피또1000', round: 109, rank: 1, store: '명당복권', address: '서울 성북구 보국문로 74', region: '서울' },
    { game: '스피또1000', round: 109, rank: 1, store: '문구뱅크', address: '서울 은평구 서오릉로 71', region: '서울' },
    { game: '스피또1000', round: 109, rank: 2, store: '2등집', address: '서울 강남구 1', region: '서울' },
  ],
}
const lotto = {
  updatedAt: '2026-09-06T01:29:18.219Z', totalDraws: 1240,
  latestDraw: { round: 1240, numbers: [11, 13, 19, 20, 31, 44], bonus: 27, date: '2026-09-05', firstPrize: { winners: 16, amount: 1791817758 } },
  frequencies: { 1: 170, 2: 156, 3: 172 },
}
const articles = [
  { slug: 'pig', title: '돼지꿈', description: 'd', order: 1, category: 'dream', date: '2026-09-01' },
  { slug: 'odds', title: '로또 확률', description: 'd', order: 2, category: 'guide', date: '2026-09-02' },
]

test('esc는 HTML 특수문자를 이스케이프한다', () => {
  expect(esc('<b>"a"&\'b\'</b>')).toBe('&lt;b&gt;&quot;a&quot;&amp;&#39;b&#39;&lt;/b&gt;')
})

test('kstDate는 UTC 시각을 KST 날짜로 변환한다', () => {
  expect(kstDate('2026-09-09T15:35:00Z')).toBe('2026-09-10') // KST 자정 넘음
  expect(kstDate(null)).toBe(null)
  expect(kstDate('없는날짜')).toBe(null)
})

test('gameSlug는 게임코드를 URL 조각으로 바꾼다', () => {
  expect(gameSlug('SP1000')).toBe('1000')
  expect(gameSlug('SP2000')).toBe('2000')
})

describe('speettoOverview', () => {
  const ov = speettoOverview(speetto)
  test('제목·설명에 실제 잔여 수량이 들어간다', () => {
    expect(ov.title).toContain('스피또')
    expect(ov.description).toContain('스피또1000 109회 1등 7/12장')
  })
  test('본문에 h1과 회차별 링크가 있다', () => {
    expect(ov.html).toContain('<h1>')
    expect(ov.html).toContain('/speetto/1000/109/')
  })
  test('lastmod는 데이터 갱신일(KST)', () => {
    expect(ov.lastmod).toBe('2026-09-10')
  })
})

describe('speettoRoundPages', () => {
  const pages = speettoRoundPages(speetto)
  const p109 = pages.find((p) => p.path === 'speetto/1000/109/')
  test('회차마다 페이지를 만든다', () => {
    expect(pages).toHaveLength(2)
  })
  test('1등 판매점만 싣고 2등은 제외한다', () => {
    expect(p109.html).toContain('명당복권')
    expect(p109.html).toContain('문구뱅크')
    expect(p109.html).not.toContain('2등집')
  })
  test('제목에 회차와 잔여 수량이 들어간다', () => {
    expect(p109.title).toContain('스피또1000 109회')
    expect(p109.title).toContain('1등 12장 중 7장 남음')
  })
  test('판매종료 회차는 changefreq monthly', () => {
    expect(pages.find((p) => p.path === 'speetto/1000/108/').changefreq).toBe('monthly')
    expect(p109.changefreq).toBe('daily')
  })
})

describe('lottoOverview', () => {
  const lo = lottoOverview(lotto)
  test('최신 회차 당첨번호가 제목·본문에 있다', () => {
    expect(lo.title).toContain('1240회')
    expect(lo.html).toContain('11 · 13 · 19 · 20 · 31 · 44')
  })
  test('데이터가 없어도 죽지 않는다', () => {
    expect(lottoOverview(null).html).toContain('<h1>')
  })
})

describe('staticPages', () => {
  const pages = staticPages({ articles, speetto, lotto, today: '2026-09-10' })
  const byPath = Object.fromEntries(pages.map((p) => [p.path, p]))
  test('홈·운세·궁합·띠별·사주·글목록을 만든다', () => {
    expect(Object.keys(byPath).sort()).toEqual(['', 'gunghap/', 'info/', 'saju/', 'unse/', 'zodiac/'].sort())
  })
  test('모든 페이지가 고유한 제목과 설명을 가진다', () => {
    const titles = pages.map((p) => p.title)
    expect(new Set(titles).size).toBe(titles.length)
    const descs = pages.map((p) => p.description)
    expect(new Set(descs).size).toBe(descs.length)
  })
  test('모든 페이지에 h1과 본문이 있다', () => {
    for (const p of pages) {
      expect(p.html).toMatch(/<h1>.+<\/h1>/)
      expect(p.html.replace(/<[^>]*>/g, '').trim().length).toBeGreaterThan(100)
    }
  })
  test('홈에 각 기능 페이지와 글 링크가 있다', () => {
    for (const href of ['/unse/', '/gunghap/', '/zodiac/', '/saju/', '/lotto/', '/speetto/', '/info/', '/info/pig/']) {
      expect(byPath[''].html).toContain(href)
    }
  })
  test('글목록은 꿈해몽과 상식을 나눠 싣는다', () => {
    expect(byPath['info/'].html).toContain('/info/pig/')
    expect(byPath['info/'].html).toContain('/info/odds/')
  })
  test('스피또 데이터가 없어도 홈을 만든다', () => {
    const home = staticPages({ articles, speetto: null, lotto: null, today: '2026-09-10' })[0]
    expect(home.html).toContain('<h1>')
  })
})
