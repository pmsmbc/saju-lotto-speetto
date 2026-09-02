import { describe, test, expect } from 'vitest'
import { ZODIACS, zodiacForYear, dailyNumberSets } from './zodiac.js'

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


describe('dailyNumberSets', () => {
  test('기본 3세트, 각 세트는 1~45 사이 서로 다른 6개 오름차순', () => {
    const sets = dailyNumberSets('rat', '2026-08-21')
    expect(sets).toHaveLength(3)
    for (const nums of sets) {
      expect(nums).toHaveLength(6)
      expect(new Set(nums).size).toBe(6)
      for (const n of nums) {
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(45)
      }
      expect([...nums].sort((a, b) => a - b)).toEqual(nums)
    }
  })

  test('같은 날 같은 띠는 항상 같은 세트', () => {
    expect(dailyNumberSets('rat', '2026-08-21')).toEqual(dailyNumberSets('rat', '2026-08-21'))
  })

  test('띠가 다르면 세트가 다르다', () => {
    expect(dailyNumberSets('rat', '2026-08-21')).not.toEqual(dailyNumberSets('ox', '2026-08-21'))
  })

  test('날짜가 다르면 세트가 다르다', () => {
    expect(dailyNumberSets('rat', '2026-08-21')).not.toEqual(dailyNumberSets('rat', '2026-08-22'))
  })
})
