import { describe, test, expect } from 'vitest'
import { extractEpisodes, normalizeStores, resolveRegion, GAME_CODES } from './normalize.js'

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
