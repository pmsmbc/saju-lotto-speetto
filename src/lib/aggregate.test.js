import { describe, test, expect } from 'vitest'
import { listRounds, filterByRound, aggregateByRegion, filterByRegion } from './aggregate.js'

const sample = [
  { game: '스피또1000', round: 107, rank: 1, store: 'A', address: '서울 ...', region: '서울' },
  { game: '스피또1000', round: 106, rank: 1, store: 'B', address: '경기 ...', region: '경기' },
  { game: '스피또1000', round: 106, rank: 2, store: 'C', address: '서울 ...', region: '서울' },
  { game: '스피또2000', round: 68, rank: 1, store: 'D', address: '부산 ...', region: '부산' },
]

describe('listRounds', () => {
  test('게임/회차 목록을 회차 내림차순으로 반환', () => {
    const rounds = listRounds(sample)
    expect(rounds).toEqual([
      { game: '스피또2000', round: 68, label: '스피또2000 68회' },
      { game: '스피또1000', round: 107, label: '스피또1000 107회' },
      { game: '스피또1000', round: 106, label: '스피또1000 106회' },
    ])
  })
})

describe('filterByRound', () => {
  test('게임+회차로 필터', () => {
    expect(filterByRound(sample, '스피또1000', 106)).toHaveLength(2)
  })
  test('null,null이면 전체', () => {
    expect(filterByRound(sample, null, null)).toHaveLength(4)
  })
})

describe('aggregateByRegion', () => {
  test('지역별 건수를 내림차순으로', () => {
    expect(aggregateByRegion(sample)).toEqual([
      { region: '서울', count: 2 },
      { region: '경기', count: 1 },
      { region: '부산', count: 1 },
    ])
  })
})

describe('filterByRegion', () => {
  test('지역으로 필터', () => {
    expect(filterByRegion(sample, '서울')).toHaveLength(2)
  })
  test('null이면 전체', () => {
    expect(filterByRegion(sample, null)).toHaveLength(4)
  })
})
