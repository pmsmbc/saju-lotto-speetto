import { describe, test, expect } from 'vitest'
import { PAGE_CONTENT } from '../src/lib/page-content.js'
import { esc, gameSlug, kstDate, speettoOverview, speettoRoundPages, lottoOverview, lottoStoresOverview, staticPages, tagPages, shortName, footerHtml } from './seo-pages.js'

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
  test('홈에 글 링크가 있다', () => {
    expect(byPath[''].html).toContain('/info/pig/')
    expect(byPath[''].html).toContain('/info/')
  })
  test('기능 페이지 링크는 푸터가 담당한다 (모든 페이지에 붙는다)', () => {
    for (const href of ['/gunghap/', '/zodiac/', '/saju/', '/lotto/', '/speetto/', '/info/']) {
      expect(footerHtml(), `푸터에 ${href} 링크가 없다`).toContain(`href="${href}"`)
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

describe('tagPages', () => {
  const tagged = [
    { slug: 'pig', title: '돼지꿈 해몽 완전 정리', description: 'd1', order: 1, category: 'dream', tags: ['animal', 'money'], date: '2026-09-01' },
    { slug: 'snake', title: '뱀꿈 해몽 — 길몽일까', description: 'd2', order: 2, category: 'dream', tags: ['animal'], date: '2026-09-02' },
    { slug: 'odds', title: '로또 확률', description: 'd3', order: 101, category: 'guide', tags: [] },
  ]
  const pages = tagPages(tagged)
  const byPath = Object.fromEntries(pages.map((p) => [p.path, p]))

  test('글이 있는 태그만 페이지를 만든다', () => {
    expect(Object.keys(byPath).sort()).toEqual(['info/tag/animal/', 'info/tag/money/'])
  })
  test('상식 글은 태그 페이지에 넣지 않는다', () => {
    expect(byPath['info/tag/animal/'].html).not.toContain('/info/odds/')
  })
  test('제목에 편수와 대표 소재가 들어간다', () => {
    expect(byPath['info/tag/animal/'].title).toContain('2편')
    expect(byPath['info/tag/animal/'].title).toContain('돼지꿈')
  })
  test('shortName은 제목에서 소재 이름만 뽑는다', () => {
    expect(shortName('뱀꿈 해몽 — 길몽일까 흉몽일까')).toBe('뱀꿈')
    expect(shortName('죽는 꿈 해몽 — 무섭지만 길몽인 이유')).toBe('죽는 꿈')
    expect(shortName('옛 애인 꿈 해몽 — 전 애인이 나오는 이유')).toBe('옛 애인 꿈')
    expect(shortName('돼지꿈 해몽 완전 정리')).toBe('돼지꿈')
    expect(shortName('임신꿈·태몽 해몽 — 누가 꿔도 되는 꿈')).toBe('임신꿈·태몽')
  })
  test("제목 앞머리에 '·'가 있으면 그 앞까지만 쓴다", () => {
    const mid = [
      { slug: 'a', title: '임신꿈·태몽 해몽 — 누가 꿔도 되는 꿈', description: 'd', order: 1, category: 'dream', tags: ['taemong'] },
      { slug: 'b', title: '태몽 해몽 총정리', description: 'd', order: 2, category: 'dream', tags: ['taemong'] },
    ]
    const t = tagPages(mid)[0].title
    expect(t).toContain('임신꿈·태몽')
    expect(t).not.toContain('임신꿈·태몽·태몽')
    expect(t).toContain('임신꿈·태몽, 태몽')
  })
  test('같은 소재 이름은 제목에 한 번만 넣는다', () => {
    const dup = [
      { slug: 'a', title: '태몽 해몽 총정리', description: 'd', order: 1, category: 'dream', tags: ['taemong'] },
      { slug: 'b', title: '태몽 해몽 — 다른 글', description: 'd', order: 2, category: 'dream', tags: ['taemong'] },
    ]
    // 둘 다 shortName이 '태몽' → 이름 목록에 한 번만
    expect(tagPages(dup)[0].title).toContain('2편 — 태몽 |')
  })
  test('쉼표로 이어진 제목도 앞부분만 쓴다', () => {
    expect(shortName('이빨 빠지는 꿈, 정말 나쁜 꿈일까')).toBe('이빨 빠지는 꿈')
  })
  test('해당 글 전부와 다른 태그로 가는 링크가 있다', () => {
    const html = byPath['info/tag/animal/'].html
    expect(html).toContain('/info/pig/')
    expect(html).toContain('/info/snake/')
    expect(html).toContain('/info/tag/money/')
    expect(html).toContain('/info/')
  })
  test('lastmod는 그 태그에서 가장 최근 글 날짜', () => {
    expect(byPath['info/tag/animal/'].lastmod).toBe('2026-09-02')
  })
  test('태그가 하나도 없으면 빈 배열', () => {
    expect(tagPages([{ slug: 'x', title: 't', description: 'd', order: 1, category: 'dream', tags: [] }])).toEqual([])
  })
})

describe('기능 페이지 설명 공유', () => {
  const pages = staticPages({ articles: [], speetto: null, lotto: null, today: '2026-09-15' })
  const byPath = Object.fromEntries(pages.map((p) => [p.path, p]))

  test('도구 페이지 본문에 공용 설명이 실려 있다', () => {
    for (const [path, id] of [['unse/', 'unse'], ['gunghap/', 'gunghap'], ['zodiac/', 'zodiac'], ['saju/', 'saju']]) {
      const firstPara = PAGE_CONTENT[id].html.match(/<p>([^<]{20,})</)[1].slice(0, 40)
      expect(byPath[path].html, `${path}에 공용 설명이 없다`).toContain(firstPara)
    }
  })
  test('홈도 오늘의 운세 설명을 쓴다 (React가 같은 화면을 그린다)', () => {
    expect(byPath[''].html).toContain(PAGE_CONTENT.unse.heading)
  })
  test('오늘의 운세는 홈을 대표 주소로 지정하고 sitemap에서 뺀다', () => {
    expect(byPath['unse/'].canonical).toBe('https://satto.kr/')
    expect(byPath['unse/'].noSitemap).toBe(true)
  })
  test('로또 페이지도 공용 설명을 쓴다', () => {
    const lo = lottoOverview(null)
    expect(lo.html).toContain(PAGE_CONTENT.lotto.heading)
  })
})

test('footerHtml에 개인정보처리방침·소개 링크가 있다', () => {
  expect(footerHtml()).toContain('href="/privacy/"')
  expect(footerHtml()).toContain('href="/about/"')
})

describe('lottoStoresOverview', () => {
  const data = {
    updatedAt: '2026-09-15T00:00:00Z', fromDraw: 262, throughDraw: 1241, coveredDraws: 977,
    missingDraws: [], totalRecords: 9263, storeCount: 4589,
    online: { count: 125, auto: 58, manual: 64 },
    top: Array.from({ length: 30 }, (_, i) => ({
      rank: i + 1, name: `가게${i + 1}`, address: `서울 중구 ${i + 1}`, region: '서울',
      count: 60 - i, auto: 40, manual: 10, firstDraw: 300, lastDraw: 1200,
    })),
  }
  const page = lottoStoresOverview(data)

  test('제목에 1위 판매점과 횟수가 들어간다', () => {
    expect(page.title).toContain('가게1')
    expect(page.title).toContain('60회')
  })
  test('표에 상위 20곳만 싣는다', () => {
    expect(page.html.match(/<tr><td>\d+<\/td>/g)).toHaveLength(20)
  })
  test('집계 범위와 온라인 건수를 밝힌다', () => {
    expect(page.html).toContain('262회부터 1241회까지')
    expect(page.html).toContain('인터넷 판매에서 1등 125회')
  })
  test('공용 설명을 함께 싣는다', () => {
    expect(page.html).toContain(PAGE_CONTENT.lottostore.heading)
  })
  test('데이터가 없으면 null', () => {
    expect(lottoStoresOverview(null)).toBe(null)
    expect(lottoStoresOverview({ top: [] })).toBe(null)
  })
})
