import { describe, test, expect } from 'vitest'
import { extractEpisodes, normalizeStores, resolveRegion, GAME_CODES, isCompleteScrape } from './normalize.js'

test('GAME_CODES는 세 게임을 가진다', () => {
  expect(GAME_CODES.map((g) => g.name)).toEqual(['스피또2000', '스피또1000', '스피또500'])
})

describe('extractEpisodes', () => {
  test('ltEpsd 목록 추출', () => {
    const json = { data: { list: [{ ltEpsd: 107 }, { ltEpsd: 106 }] } }
    expect(extractEpisodes(json)).toEqual([107, 106])
  })
  test('list 없으면 빈 배열', () => {
    expect(extractEpisodes({ data: { list: [] } })).toEqual([])
    expect(extractEpisodes({})).toEqual([])
  })
})

describe('resolveRegion', () => {
  test('region 필드 우선', () => {
    expect(resolveRegion({ region: '서울', shpAddr: '경기 ...' })).toBe('서울')
  })
  test('region 없으면 주소 첫 어절로 매핑', () => {
    expect(resolveRegion({ shpAddr: '경기도 수원시 ...' })).toBe('경기')
    expect(resolveRegion({ shpAddr: '서울특별시 강남구 ...' })).toBe('서울')
  })
  test('매핑 실패 시 기타', () => {
    expect(resolveRegion({ shpAddr: '외국 어딘가' })).toBe('기타')
    expect(resolveRegion({})).toBe('기타')
  })
})

describe('normalizeStores', () => {
  test('API 항목을 store 형식으로 변환', () => {
    const json = {
      data: {
        list: [
          { shpNm: '영등포역 복권방', shpAddr: '서울 영등포구', region: '서울', wnShpRnk: 1 },
        ],
      },
    }
    expect(normalizeStores(json, '스피또1000', 107)).toEqual([
      {
        game: '스피또1000',
        round: 107,
        rank: 1,
        store: '영등포역 복권방',
        address: '서울 영등포구',
        region: '서울',
      },
    ])
  })
  test('list 없으면 빈 배열', () => {
    expect(normalizeStores({ data: { list: null } }, '스피또1000', 1)).toEqual([])
  })
})

describe('isCompleteScrape', () => {
  const EXPECTED = ['스피또2000', '스피또1000', '스피또500']
  const validRow = (game) => ({
    game,
    round: 1,
    rank: 1,
    store: '테스트 복권방',
    address: '서울 강남구',
    region: '서울',
  })

  test('(a) 모든 게임 존재 + 유효한 행 → true', () => {
    const stores = EXPECTED.map(validRow)
    expect(isCompleteScrape(stores, EXPECTED)).toBe(true)
  })

  test('(b) 빈 배열 → false', () => {
    expect(isCompleteScrape([], EXPECTED)).toBe(false)
  })

  test('(c) 게임 누락 → false', () => {
    const stores = ['스피또2000', '스피또1000'].map(validRow)
    expect(isCompleteScrape(stores, EXPECTED)).toBe(false)
  })

  test('(d) store가 빈 문자열 또는 undefined인 행 → false', () => {
    const stores = [
      ...EXPECTED.map(validRow),
      { game: '스피또2000', round: 1, rank: 2, store: '', address: '서울', region: '서울' },
    ]
    expect(isCompleteScrape(stores, EXPECTED)).toBe(false)

    const storesUndef = [
      ...EXPECTED.map(validRow),
      { game: '스피또1000', round: 1, rank: 2, store: undefined, address: '서울', region: '서울' },
    ]
    expect(isCompleteScrape(storesUndef, EXPECTED)).toBe(false)
  })

  test('(e) rank가 NaN인 행 → false', () => {
    const stores = [
      ...EXPECTED.map(validRow),
      { game: '스피또500', round: 1, rank: NaN, store: '복권방', address: '서울', region: '서울' },
    ]
    expect(isCompleteScrape(stores, EXPECTED)).toBe(false)
  })
})
