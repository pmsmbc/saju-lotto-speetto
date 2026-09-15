import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ZodiacPage } from './ZodiacPage.jsx'
import { ZODIACS, dailyLuckyPair } from '../lib/zodiac.js'

test('12개 띠를 모두 보여준다', () => {
  render(<ZodiacPage />)
  // 설명 섹션에도 띠 이름이 나오므로 띠 격자 안에서 확인한다
  const grid = document.querySelector('.zodiac-grid')
  for (const z of ZODIACS) {
    expect(grid.textContent, `${z.label}이 격자에 없다`).toContain(z.label)
  }
  expect(document.querySelectorAll('.zodiac-item')).toHaveLength(ZODIACS.length)
})

test('각 띠 박스에 오늘의 번호 2개를 바로 보여준다', () => {
  render(<ZodiacPage today="2026-08-21" />)
  const items = document.querySelectorAll('.zodiac-item')
  expect(items).toHaveLength(12)
  items.forEach((item, i) => {
    const balls = item.querySelectorAll('.lotto-ball')
    const expected = dailyLuckyPair(ZODIACS[i].id, '2026-08-21')
    expect([...balls].map((b) => Number(b.textContent))).toEqual(expected)
  })
})

test('날짜를 요일·음력과 함께 한국어로 표시한다', () => {
  render(<ZodiacPage today="2026-08-21" />)
  expect(screen.getByText(/2026년 8월 21일/)).toBeInTheDocument()
  expect(screen.getByText('금요일')).toBeInTheDocument()
  expect(screen.getByText(/음력 7월 9일/)).toBeInTheDocument()
})

test('토요일은 파랑, 일요일은 빨강 클래스가 붙는다', () => {
  const { unmount } = render(<ZodiacPage today="2026-09-05" />)
  expect(screen.getByText('토요일').classList.contains('sat')).toBe(true)
  unmount()
  render(<ZodiacPage today="2026-09-06" />)
  expect(screen.getByText('일요일').classList.contains('sun')).toBe(true)
})
