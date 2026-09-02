import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ZodiacPage } from './ZodiacPage.jsx'
import { ZODIACS, dailyLuckyPair } from '../lib/zodiac.js'

test('12개 띠를 모두 보여준다', () => {
  render(<ZodiacPage />)
  for (const z of ZODIACS) {
    expect(screen.getByText(z.label)).toBeInTheDocument()
  }
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

test('날짜를 한국어로 표시한다', () => {
  render(<ZodiacPage today="2026-08-21" />)
  expect(screen.getByText(/2026년 8월 21일/)).toBeInTheDocument()
  expect(screen.getByText(/음력 7월 9일/)).toBeInTheDocument()
})
