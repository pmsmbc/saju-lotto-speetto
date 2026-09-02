import { describe, test, expect } from 'vitest'
import { lunarDateKorean } from './lunar.js'

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
