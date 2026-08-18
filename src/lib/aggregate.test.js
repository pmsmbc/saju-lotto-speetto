import { describe, test, expect } from 'vitest'
import { areaOf, aggregateByArea, filterByArea } from './aggregate.js'

const sample = [
  { game: '스피또1000', round: 107, rank: 1, store: 'A', address: '서울 강남구 일원로 1', region: '서울' },
  { game: '스피또1000', round: 106, rank: 1, store: 'B', address: '경기 김포시 율생로 3', region: '경기' },
  { game: '스피또1000', round: 106, rank: 1, store: 'C', address: '서울 강남구 강남대로 2', region: '서울' },
  { game: '스피또2000', round: 68, rank: 1, store: 'D', address: '경남 창원시 마산합포구 북성로 98', region: '경남' },
]

describe('areaOf', () => {
  test('도는 시/군까지', () => {
    expect(areaOf({ region: '경기', address: '경기 김포시 율생로 3' })).toBe('경기 김포시')
  })
  test('광역시/특별시는 구까지', () => {
    expect(areaOf({ region: '서울', address: '서울 강남구 일원로 1' })).toBe('서울 강남구')
  })
  test('시 안에 구가 있어도 시까지만', () => {
    expect(areaOf({ region: '경남', address: '경남 창원시 마산합포구 북성로 98' })).toBe('경남 창원시')
  })
  test('세종은 하위 행정구역 없이 그대로', () => {
    expect(areaOf({ region: '세종', address: '세종 다정중앙로 10' })).toBe('세종')
  })
  test('하위 어절이 없으면 지역만', () => {
    expect(areaOf({ region: '제주', address: '제주' })).toBe('제주')
  })
})

describe('aggregateByArea', () => {
  test('시/군/구 단위로 집계, 내림차순', () => {
    expect(aggregateByArea(sample)).toEqual([
      { region: '서울 강남구', count: 2 },
      { region: '경기 김포시', count: 1 },
      { region: '경남 창원시', count: 1 },
    ])
  })
})

describe('filterByArea', () => {
  test('시/군/구로 필터', () => {
    expect(filterByArea(sample, '서울 강남구')).toHaveLength(2)
  })
  test('null이면 전체', () => {
    expect(filterByArea(sample, null)).toHaveLength(4)
  })
})
