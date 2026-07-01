import { describe, test, expect } from 'vitest'
import { parseRnkRate, parseRecord, buildStatus, isCompleteSpeettoStatus } from './speetto-normalize.js'

const raw2000 = { ntslStatus: '판매중', stGmTypeCd: 'SP2000', stGmTypeNm: '스피또2000', stEpsd: 68, stRnk1Rt: '7매/8매' }
const raw1000 = { ntslStatus: '판매중', stGmTypeCd: 'SP1000', stGmTypeNm: '스피또1000', stEpsd: 107, stRnk1Rt: '9매/12매' }
const raw500 = { ntslStatus: '판매종료', stGmTypeCd: 'SP500', stGmTypeNm: '스피또500', stEpsd: 47, stRnk1Rt: '0매/5매' }

describe('parseRnkRate', () => {
  test('"7매/8매" → {remaining:7,total:8}', () => {
    expect(parseRnkRate('7매/8매')).toEqual({ remaining: 7, total: 8 })
  })
  test('형식 이상은 {0,0}', () => {
    expect(parseRnkRate('')).toEqual({ remaining: 0, total: 0 })
    expect(parseRnkRate(undefined)).toEqual({ remaining: 0, total: 0 })
    expect(parseRnkRate('없음')).toEqual({ remaining: 0, total: 0 })
  })
})

describe('parseRecord', () => {
  test('원시 레코드를 정규화', () => {
    expect(parseRecord(raw2000)).toEqual({
      game: '스피또2000', gameCode: 'SP2000', round: 68,
      status: '판매중', rank1Remaining: 7, rank1Total: 8,
    })
  })
})

describe('buildStatus', () => {
  test('round 내림차순 정렬', () => {
    const { rounds } = buildStatus([raw2000, raw1000, raw500])
    expect(rounds.map((r) => r.round)).toEqual([107, 68, 47])
  })
})

describe('isCompleteSpeettoStatus', () => {
  test('세 게임 모두 있고 값이 유효하면 true', () => {
    expect(isCompleteSpeettoStatus(buildStatus([raw2000, raw1000, raw500]))).toBe(true)
  })
  test('빈 목록은 false', () => {
    expect(isCompleteSpeettoStatus(buildStatus([]))).toBe(false)
  })
  test('게임 종류가 부족하면 false', () => {
    expect(isCompleteSpeettoStatus(buildStatus([raw2000, raw1000]))).toBe(false)
  })
  test('잔여>총 역전 값이면 false', () => {
    const bad = { ...raw2000, stRnk1Rt: '9매/8매' }
    expect(isCompleteSpeettoStatus(buildStatus([bad, raw1000, raw500]))).toBe(false)
  })
})
