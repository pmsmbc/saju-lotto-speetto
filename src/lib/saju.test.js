import { describe, test, expect } from 'vitest'
import { yearPillar, monthPillar, dayPillar, hourPillar, fourPillars, sajuNumbers, HOUR_OPTIONS } from './saju.js'

describe('yearPillar (설날 기준)', () => {
  test('2024년은 갑진년, 2026년은 병오년', () => {
    expect(yearPillar('2024-06-01').name).toBe('갑진')
    expect(yearPillar('2026-09-02').name).toBe('병오')
  })

  test('설날 전날은 전년도 간지 (2026-02-16 → 을사)', () => {
    expect(yearPillar('2026-02-16').name).toBe('을사')
    expect(yearPillar('2026-02-17').name).toBe('병오')
  })
})

describe('dayPillar (JDN 60갑자)', () => {
  test('2019-01-27은 갑자일 (앵커)', () => {
    expect(dayPillar('2019-01-27').name).toBe('갑자')
  })

  test('2000-01-01은 무오일', () => {
    expect(dayPillar('2000-01-01').name).toBe('무오')
  })
})

describe('monthPillar (오호둔)', () => {
  test('병오년 9월 2일은 병신월', () => {
    expect(monthPillar('2026-09-02').name).toBe('병신')
  })

  test('입춘 전 1월은 전년 기준 축월', () => {
    expect(monthPillar('2026-01-20').branch.ko).toBe('축')
  })
})

describe('hourPillar (오서둔)', () => {
  test('갑자일 자시는 갑자시', () => {
    expect(hourPillar('2019-01-27', 0).name).toBe('갑자')
  })

  test('시를 모르면 null', () => {
    expect(hourPillar('2019-01-27', '')).toBeNull()
    expect(hourPillar('2019-01-27', null)).toBeNull()
  })
})

describe('fourPillars / sajuNumbers', () => {
  test('네 기둥을 돌려준다', () => {
    const p = fourPillars('1990-05-15', 3)
    expect(p.year.name).toHaveLength(2)
    expect(p.month.name).toHaveLength(2)
    expect(p.day.name).toHaveLength(2)
    expect(p.hour.name).toHaveLength(2)
  })

  test('추천 번호는 1~45 서로 다른 6개 오름차순, 같은 입력이면 동일', () => {
    const nums = sajuNumbers('1990-05-15', 3, '2026-09-02')
    expect(nums).toHaveLength(6)
    expect(new Set(nums).size).toBe(6)
    for (const n of nums) {
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(45)
    }
    expect([...nums].sort((a, b) => a - b)).toEqual(nums)
    expect(sajuNumbers('1990-05-15', 3, '2026-09-02')).toEqual(nums)
  })

  test('날짜가 바뀌면 번호도 바뀐다', () => {
    const days = ['2026-09-01', '2026-09-02', '2026-09-03']
    const uniq = new Set(days.map((d) => sajuNumbers('1990-05-15', 3, d).join(',')))
    expect(uniq.size).toBeGreaterThan(1)
  })
})

test('HOUR_OPTIONS는 12개, 자시부터', () => {
  expect(HOUR_OPTIONS).toHaveLength(12)
  expect(HOUR_OPTIONS[0].label).toMatch(/^자시/)
})
