import { describe, test, expect } from 'vitest'
import { compatibility, gradeOfScore, RELATION_TYPES } from './gunghap.js'

// 2020-06-01=자(쥐), 2016-06-01=신(원숭이), 2014-06-01=오(말) — 모두 설날 이후 안전 날짜

describe('compatibility', () => {
  test('년지 삼합(자×신) 커플이 충(자×오) 커플보다 점수가 높다', () => {
    const samhap = compatibility('2020-06-01', '2016-06-01')
    const chung = compatibility('2020-06-01', '2014-06-01')
    expect(samhap.score).toBeGreaterThan(chung.score)
    expect(samhap.parts.year.kinds).toContain('삼합')
    expect(chung.parts.year.kinds).toContain('충')
  })

  test('점수는 0~100, 등급 문자열 존재', () => {
    const r = compatibility('1990-05-15', '1992-08-08')
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.grade.length).toBeGreaterThan(0)
  })

  test('결정적: 같은 커플은 항상 같은 결과', () => {
    expect(compatibility('1990-05-15', '1992-08-08')).toEqual(compatibility('1990-05-15', '1992-08-08'))
  })

  test('관계 유형에 따라 가중치가 달라 점수가 달라질 수 있다', () => {
    const scores = RELATION_TYPES.map((t) => compatibility('2020-06-01', '2016-06-01', t.id).score)
    expect(new Set(scores).size).toBeGreaterThan(1)
  })


  test('오행 분포: 각자 5개 오행 합이 6 (년·월·일주 6글자)', () => {
    const r = compatibility('1990-05-15', '1992-08-08')
    for (const who of ['mine', 'partner']) {
      expect(r.elements[who]).toHaveLength(5)
      expect(r.elements[who].reduce((a, b) => a + b, 0)).toBe(6)
    }
  })

  test('네 부분(겉궁합/속궁합/일간/오행)에 설명이 있다', () => {
    const r = compatibility('1990-05-15', '1992-08-08')
    for (const k of ['year', 'day', 'stem', 'complement']) {
      expect(r.parts[k].desc.length).toBeGreaterThan(3)
    }
  })
})

describe('시주 반영', () => {
  test('둘 다 시를 알면 오행 합이 8, 시궁합 항목 존재', () => {
    const r = compatibility({ birth: '1990-05-15', hour: 0 }, { birth: '1992-08-08', hour: 6 })
    expect(r.elements.mine.reduce((x, y) => x + y, 0)).toBe(8)
    expect(r.elements.partner.reduce((x, y) => x + y, 0)).toBe(8)
    expect(r.parts.hour).not.toBeNull()
    expect(r.parts.hour.desc.length).toBeGreaterThan(3)
  })

  test('한 명이라도 시를 모르면 시궁합 없음, 문자열 입력과 동일 동작', () => {
    const r = compatibility({ birth: '1990-05-15', hour: 0 }, { birth: '1992-08-08', hour: '' })
    expect(r.parts.hour).toBeNull()
    const r2 = compatibility('1990-05-15', '1992-08-08')
    expect(r2.parts.hour).toBeNull()
    expect(r2.elements.mine.reduce((x, y) => x + y, 0)).toBe(6)
  })

  test('시지가 합이면 점수가 오르고 충이면 내린다 (자시×진시 삼합 vs 자시×오시 충)', () => {
    const base = { birth: '1990-05-15', hour: 0 } // 자시
    const samhap = compatibility(base, { birth: '1992-08-08', hour: 4 }).score // 진시
    const chung = compatibility(base, { birth: '1992-08-08', hour: 6 }).score // 오시
    expect(samhap).toBeGreaterThan(chung)
  })
})

describe('gradeOfScore', () => {
  test('구간별 등급', () => {
    expect(gradeOfScore(95)).toBe('천생연분')
    expect(gradeOfScore(75)).toBe('좋은 인연')
    expect(gradeOfScore(55)).toBe('무난한 인연')
    expect(gradeOfScore(35)).toBe('노력이 필요한 인연')
    expect(gradeOfScore(10)).toMatch(/상극/)
  })
})
