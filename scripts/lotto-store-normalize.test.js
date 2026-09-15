import { describe, test, expect } from 'vitest'
import { isOnline, resolveRegion, aggregateStores, onlineSummary, buildStorePayload } from './lotto-store-normalize.js'

const row = (o) => ({ ltShpId: 'A', shpNm: '가게', shpAddr: '서울 중구 1', region: '서울', atmtPsvYnTxt: '자동', _draw: 100, ...o })

describe('isOnline', () => {
  test('인터넷 판매를 가려낸다', () => {
    expect(isOnline({ region: '인터넷' })).toBe(true)
    expect(isOnline({ shpNm: '인터넷 복권판매사이트' })).toBe(true)
    expect(isOnline({ region: '서울', shpNm: '가게' })).toBe(false)
  })
})

describe('resolveRegion', () => {
  test('전남광주 접두어를 시·군·구로 가른다', () => {
    expect(resolveRegion({ shpAddr: '전남광주 광산구 1', region: '전남광주' })).toBe('광주')
    expect(resolveRegion({ shpAddr: '전남광주 여수시 1', region: '전남광주' })).toBe('전남')
  })
  test('그 외는 region 필드를 쓴다', () => {
    expect(resolveRegion({ shpAddr: '서울 중구 1', region: '서울' })).toBe('서울')
    expect(resolveRegion({ shpAddr: '', region: '' })).toBe('기타')
  })
})

describe('aggregateStores', () => {
  const rows = [
    row({ ltShpId: 'A', _draw: 100, atmtPsvYnTxt: '자동' }),
    row({ ltShpId: 'A', _draw: 200, atmtPsvYnTxt: '수동', shpNm: '새이름', shpAddr: '서울 중구 2' }),
    row({ ltShpId: 'B', _draw: 150, shpNm: '비', shpAddr: '부산 동구 1', region: '부산' }),
    { region: '인터넷', shpNm: '인터넷 복권판매사이트', _draw: 300, atmtPsvYnTxt: '자동' },
  ]
  const agg = aggregateStores(rows)

  test('판매점별로 묶고 온라인은 뺀다', () => {
    expect(agg).toHaveLength(2)
    expect(agg.map((s) => s.name)).not.toContain('인터넷 복권판매사이트')
  })
  test('횟수 많은 순으로 순위를 매긴다', () => {
    expect(agg[0].count).toBe(2)
    expect(agg[0].rank).toBe(1)
    expect(agg[1].rank).toBe(2)
  })
  test('이름·주소는 가장 최근 회차 값을 쓴다', () => {
    expect(agg[0].name).toBe('새이름')
    expect(agg[0].address).toBe('서울 중구 2')
  })
  test('자동·수동과 처음·마지막 회차를 센다', () => {
    expect(agg[0]).toMatchObject({ auto: 1, manual: 1, firstDraw: 100, lastDraw: 200 })
  })
  test('회차 번호가 없는 행은 버린다', () => {
    expect(aggregateStores([row({ _draw: undefined })])).toEqual([])
  })
})

describe('onlineSummary', () => {
  test('인터넷 판매 건수를 자동·수동으로 나눠 센다', () => {
    const rows = [
      { region: '인터넷', atmtPsvYnTxt: '자동' },
      { region: '인터넷', atmtPsvYnTxt: '수동' },
      row({}),
    ]
    expect(onlineSummary(rows)).toEqual({ count: 2, auto: 1, manual: 1 })
  })
})

describe('buildStorePayload', () => {
  const many = Array.from({ length: 200 }, (_, i) => row({ ltShpId: `S${i}`, _draw: 300 + i }))
  test('정상 수집이면 메타와 상위 목록을 만든다', () => {
    const p = buildStorePayload({ rows: many, draws: [299, 300, 301], missingDraws: [299], now: 'T', limit: 5 })
    expect(p.fromDraw).toBe(300)
    expect(p.throughDraw).toBe(301)
    expect(p.coveredDraws).toBe(2)
    expect(p.missingDraws).toEqual([299])
    expect(p.storeCount).toBe(200)
    expect(p.top).toHaveLength(5)
    expect(p.top[0].rank).toBe(1)
    expect(p.top[0]).not.toHaveProperty('key')
  })
  test('수집이 불완전하면 null (기존 데이터 보존)', () => {
    expect(buildStorePayload({ rows: [row({})], draws: [100], missingDraws: [], now: 'T' })).toBe(null)
  })
})
