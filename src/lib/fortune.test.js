import { describe, test, expect } from 'vitest'
import { branchRelationScore, elementScore, gradeOf, dailyFortune, allFortunes, GRADES } from './fortune.js'
import { ZODIACS } from './zodiac.js'

// 지지 인덱스: 0자 1축 2인 3묘 4진 5사 6오 7미 8신 9유 10술 11해

describe('branchRelationScore (명리 관계 규칙)', () => {
  test('삼합: 신자진 → 신(8)일에 자(0)·진(4)은 +3', () => {
    expect(branchRelationScore(8, 0)).toBeGreaterThanOrEqual(3)
    expect(branchRelationScore(8, 4)).toBeGreaterThanOrEqual(3)
  })

  test('육합: 자축합 → 자(0)일에 축(1)은 +2', () => {
    expect(branchRelationScore(0, 1)).toBe(2)
  })

  test('충: 자오충 → 자(0)일에 오(6)은 -3', () => {
    expect(branchRelationScore(0, 6)).toBe(-3)
  })

  test('충: 인신충 → 인(2)일에 신(8)은 음수 (형·파 중첩 포함)', () => {
    expect(branchRelationScore(2, 8)).toBeLessThan(0)
  })

  test('형: 자묘형 → 자(0)일에 묘(3)은 -2', () => {
    expect(branchRelationScore(0, 3)).toBe(-2)
  })

  test('관계없는 지지는 0 (자일의 인)', () => {
    expect(branchRelationScore(0, 2)).toBe(0)
  })
})

describe('elementScore (오행 상생상극)', () => {
  test('갑(木)일은 사(火)를 생 → +1', () => {
    expect(elementScore(0, 5)).toBe(1)
  })

  test('갑(木)일은 축(土)을 극 → -1', () => {
    expect(elementScore(0, 1)).toBe(-1)
  })

  test('갑(木)일과 신(金)은 생극 아님 → 0', () => {
    expect(elementScore(0, 8)).toBe(0)
  })
})

describe('gradeOf', () => {
  test('점수 구간별 등급', () => {
    expect(gradeOf(4)).toBe('대길')
    expect(gradeOf(3)).toBe('대길')
    expect(gradeOf(2)).toBe('길')
    expect(gradeOf(1)).toBe('길')
    expect(gradeOf(0)).toBe('보통')
    expect(gradeOf(-1)).toBe('보통')
    expect(gradeOf(-2)).toBe('주의')
    expect(gradeOf(-4)).toBe('주의')
  })
})

describe('dailyFortune', () => {
  // 2019-01-27 = 갑자일: 용(진4)·원숭이(신8) 삼합, 소(축1) 육합, 말(오6) 충
  test('갑자일에 원숭이띠는 삼합으로 상위 등급', () => {
    const f = dailyFortune('monkey', '2019-01-27')
    expect(['대길', '길']).toContain(f.grade)
    expect(f.iljin.name).toBe('갑자')
  })

  test('갑자일에 말띠는 충으로 주의', () => {
    expect(dailyFortune('horse', '2019-01-27').grade).toBe('주의')
  })

  test('결정적: 같은 날 같은 띠는 같은 결과', () => {
    expect(dailyFortune('rat', '2026-09-02')).toEqual(dailyFortune('rat', '2026-09-02'))
  })

  test('재물/건강/사랑 키워드와 길방을 돌려준다', () => {
    const f = dailyFortune('pig', '2026-09-02')
    expect(f.keywords.money.length).toBeGreaterThan(0)
    expect(f.keywords.health.length).toBeGreaterThan(0)
    expect(f.keywords.love.length).toBeGreaterThan(0)
    expect(['東', '西', '南', '北', '南西']).toContain(f.direction)
  })

  test('길방은 오행 규칙: 쥐(水)=西, 말(火)=東', () => {
    expect(dailyFortune('rat', '2026-09-02').direction).toBe('西')
    expect(dailyFortune('horse', '2026-09-02').direction).toBe('東')
  })

  test('년생별 한 줄: 쥐띠는 36년생부터 6줄, 문장 중복 없음', () => {
    const f = dailyFortune('rat', '2026-09-02')
    expect(f.yearLines).toHaveLength(6)
    expect(f.yearLines.map((l) => l.year)).toEqual([1936, 1948, 1960, 1972, 1984, 1996])
    expect(f.yearLines[0].label).toBe('36년생')
    const texts = f.yearLines.map((l) => l.text)
    expect(new Set(texts).size).toBe(6)
    for (const t of texts) expect(t.length).toBeGreaterThan(3)
  })
})

describe('allFortunes', () => {
  test('12띠 전부, 유효한 등급', () => {
    const all = allFortunes('2026-09-02')
    expect(all).toHaveLength(12)
    for (const f of all) expect(GRADES).toContain(f.grade)
    expect(all.map((f) => f.zodiac.id)).toEqual(ZODIACS.map((z) => z.id))
  })
})
