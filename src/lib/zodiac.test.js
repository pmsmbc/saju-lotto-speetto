import { describe, test, expect } from 'vitest'
import { ZODIACS, zodiacForYear, dailyLuckyPair } from './zodiac.js'

describe('ZODIACS', () => {
  test('12개 띠가 정의되어 있다', () => {
    expect(ZODIACS).toHaveLength(12)
    const ids = new Set(ZODIACS.map((z) => z.id))
    expect(ids.size).toBe(12)
    for (const z of ZODIACS) {
      expect(z.label).toMatch(/띠$/)
      expect(z.emoji).toBeTruthy()
    }
  })
})

describe('zodiacForYear', () => {
  test('2020년생과 1996년생은 쥐띠', () => {
    expect(zodiacForYear(2020).label).toBe('쥐띠')
    expect(zodiacForYear(1996).label).toBe('쥐띠')
  })

  test('2021년생은 소띠, 2026년생은 말띠', () => {
    expect(zodiacForYear(2021).label).toBe('소띠')
    expect(zodiacForYear(2026).label).toBe('말띠')
  })
})

describe('dailyLuckyPair', () => {
  test('1~45 사이 서로 다른 2개 번호를 오름차순으로 돌려준다', () => {
    for (const z of ZODIACS) {
      const pair = dailyLuckyPair(z.id, '2026-08-21')
      expect(pair).toHaveLength(2)
      expect(pair[0]).not.toBe(pair[1])
      expect(pair[0]).toBeLessThan(pair[1])
      for (const n of pair) {
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(45)
      }
    }
  })

  test('같은 날 같은 띠는 항상 같은 번호', () => {
    expect(dailyLuckyPair('rat', '2026-08-21')).toEqual(dailyLuckyPair('rat', '2026-08-21'))
  })

  test('날짜가 다르면 번호가 달라질 수 있다 (시드 반영)', () => {
    const days = ['2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24']
    const uniq = new Set(days.map((d) => dailyLuckyPair('rat', d).join(',')))
    expect(uniq.size).toBeGreaterThan(1)
  })
})
