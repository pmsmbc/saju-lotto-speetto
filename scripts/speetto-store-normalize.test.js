import { describe, test, expect } from 'vitest'
import {
  extractEpisodes,
  normalizeStores,
  resolveRegion,
  resolveStoreName,
  resolveAddress,
  GAME_CODES,
  isCompleteScrape,
} from './speetto-store-normalize.js'

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
  test('주소가 region 필드보다 우선 (폐점 건의 잘못된 region 방어)', () => {
    expect(resolveRegion({ region: '서울', shpAddr: '경기 이천시 장감로 1' })).toBe('경기')
    expect(resolveRegion({ region: '전남광주', shpAddr: '광주 서구 상무대로 1' })).toBe('광주')
  })
  test('주소로 알 수 없으면 region 필드 사용', () => {
    expect(resolveRegion({ region: '전남광주', shpAddr: '' })).toBe('전남광주')
  })
  test('폐점 건은 당첨 당시 주소(shpAddrAsis/befRdnm)로 판단', () => {
    expect(resolveRegion({ region: '서울', shpAddr: null, shpAddrAsis: '대구광역시 남구 대명동' })).toBe('대구')
    expect(resolveRegion({ region: '서울', shpAddr: null, befRdnm: '(당첨 당시 주소) 경기 이천시 장감로 1' })).toBe('경기')
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

describe('resolveStoreName / resolveAddress', () => {
  test('정상 판매점은 shpNm/shpAddr 사용', () => {
    expect(resolveStoreName({ shpNm: '명당 복권방', shpNmAsis: '옛이름' })).toBe('명당 복권방')
    expect(resolveAddress({ shpAddr: '서울 성북구 보국문로 74', shpAddrAsis: '서울특별시 성북구' })).toBe('서울 성북구 보국문로 74')
  })
  test('폐점 판매점(shpNm null)은 당첨 당시 상호/주소로 대체', () => {
    const closed = {
      shpNm: null, shpNmAsis: '장원급제로또복권방', befConmNm: '(당첨 당시 상호) 장원급제로또복권방',
      shpAddr: null, shpAddrAsis: '경기도 이천시 장감로 1 1호', befRdnm: '(당첨 당시 주소) 경기 이천시 장감로 1 1호',
    }
    expect(resolveStoreName(closed)).toBe('장원급제로또복권방')
    expect(resolveAddress(closed)).toBe('경기도 이천시 장감로 1 1호')
  })
  test('Asis도 없으면 bef* 필드의 안내 접두문을 벗겨서 사용', () => {
    expect(resolveStoreName({ shpNm: null, befConmNm: '(당첨 당시 상호) 미확인 판매점 ' })).toBe('미확인 판매점')
    expect(resolveAddress({ shpAddr: null, befRdnm: '(당첨 당시 주소) 대구 남구 대명동' })).toBe('대구 남구 대명동')
  })
  test('아무 이름도 없으면 미확인 판매점', () => {
    expect(resolveStoreName({ shpNm: null })).toBe('미확인 판매점')
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
  test('폐점 판매점도 버리지 않고 당첨 당시 정보로 변환한다', () => {
    const json = {
      data: {
        list: [
          {
            shpNm: null, shpNmAsis: '장원급제로또복권방', shpAddr: null, shpAddrAsis: '경기도 이천시 장감로 1 1호',
            region: '서울', status: '폐점', wnShpRnk: 1,
          },
        ],
      },
    }
    expect(normalizeStores(json, '스피또2000', 40)).toEqual([
      { game: '스피또2000', round: 40, rank: 1, store: '장원급제로또복권방', address: '경기도 이천시 장감로 1 1호', region: '경기' },
    ])
  })
  test('등수를 알 수 없는 행만 제외한다', () => {
    const json = { data: { list: [
      { shpNm: 'A', shpAddr: '서울 강남구', wnShpRnk: 1 },
      { shpNm: 'B', shpAddr: '서울 강남구', wnShpRnk: null },
    ] } }
    expect(normalizeStores(json, '스피또1000', 1).map((s) => s.store)).toEqual(['A'])
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
