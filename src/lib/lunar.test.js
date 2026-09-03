import { describe, test, expect } from 'vitest'
import { lunarDateKorean, lunarToSolar } from './lunar.js'

describe('lunarDateKorean', () => {
  test('2026년 설날(2026-02-17)은 음력 1월 1일', () => {
    expect(lunarDateKorean('2026-02-17')).toBe('음력 1월 1일')
  })

  test('윤달을 표기한다 (2025-07-25 = 음력 윤6월 1일)', () => {
    expect(lunarDateKorean('2025-07-25')).toBe('음력 윤6월 1일')
  })

  test('2026-09-02는 음력 7월 21일', () => {
    expect(lunarDateKorean('2026-09-02')).toBe('음력 7월 21일')
  })
})

describe('lunarToSolar', () => {
  test('음력 2026년 1월 1일(설날) → 양력 2026-02-17', () => {
    expect(lunarToSolar(2026, 1, 1)).toBe('2026-02-17')
  })

  test('왕복 변환: 양력→음력→양력이 일치한다', () => {
    for (const solar of ['1990-05-15', '1984-11-02', '2000-01-30', '2015-06-20']) {
      const parts = new Intl.DateTimeFormat('ko-KR-u-ca-dangi', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric',
      }).formatToParts(new Date(`${solar}T12:00:00+09:00`))
      const get = (t) => parts.find((p) => p.type === t)?.value
      if (get('month').startsWith('윤')) continue // 윤달은 미지원
      expect(lunarToSolar(Number(get('relatedYear')), Number(get('month')), Number(get('day')))).toBe(solar)
    }
  })

  test('존재하지 않는 음력 날짜는 null', () => {
    expect(lunarToSolar(2026, 13, 1)).toBeNull()
    expect(lunarToSolar(2026, 1, 31)).toBeNull()
  })
})
