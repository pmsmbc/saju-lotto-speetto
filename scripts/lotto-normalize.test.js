import { describe, test, expect } from 'vitest'
import { parseDraw, computeFrequencies, buildStats, isCompleteLottoStats } from './lotto-normalize.js'

const item1230 = { ltEpsd: 1230, tm1WnNo: 42, tm2WnNo: 3, tm3WnNo: 28, tm4WnNo: 9, tm5WnNo: 8, tm6WnNo: 22, bnsWnNo: 45, ltRflYmd: '20260627' }
const item1229 = { ltEpsd: 1229, tm1WnNo: 12, tm2WnNo: 13, tm3WnNo: 29, tm4WnNo: 34, tm5WnNo: 37, tm6WnNo: 42, bnsWnNo: 16, ltRflYmd: '20260620' }

describe('parseDraw', () => {
  test('번호를 오름차순 정렬하고 날짜를 포맷', () => {
    expect(parseDraw(item1230)).toEqual({
      round: 1230, numbers: [3, 8, 9, 22, 28, 42], bonus: 45, date: '2026-06-27',
    })
  })
})

describe('computeFrequencies', () => {
  test('1~45 모든 키가 존재하고 출현 횟수를 센다', () => {
    const f = computeFrequencies([parseDraw(item1230), parseDraw(item1229)])
    expect(Object.keys(f)).toHaveLength(45)
    expect(f[42]).toBe(2) // 두 회차 모두 42
    expect(f[3]).toBe(1)
    expect(f[1]).toBe(0)
  })
})

describe('buildStats', () => {
  test('최신 회차/총 회차/빈도 구성', () => {
    const s = buildStats([parseDraw(item1229), parseDraw(item1230)])
    expect(s.latestRound).toBe(1230)
    expect(s.latestDraw.numbers).toEqual([3, 8, 9, 22, 28, 42])
    expect(s.totalDraws).toBe(2)
    expect(s.frequencies[42]).toBe(2)
  })
})

describe('isCompleteLottoStats', () => {
  test('빈도 합계가 totalDraws*6이면 true', () => {
    const s = buildStats([parseDraw(item1230), parseDraw(item1229)])
    expect(isCompleteLottoStats(s)).toBe(true)
  })
  test('빈 데이터는 false', () => {
    expect(isCompleteLottoStats(buildStats([]))).toBe(false)
  })
  test('합계가 안 맞으면 false', () => {
    const s = buildStats([parseDraw(item1230)])
    s.frequencies[3] = 5 // 합계 깨뜨림
    expect(isCompleteLottoStats(s)).toBe(false)
  })
})
