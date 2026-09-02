import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZodiacPage } from './ZodiacPage.jsx'
import { ZODIACS, dailyNumberSets } from '../lib/zodiac.js'

test('12개 띠 선택 버튼을 보여준다', () => {
  render(<ZodiacPage />)
  for (const z of ZODIACS) {
    expect(screen.getByRole('button', { name: new RegExp(z.label) })).toBeInTheDocument()
  }
})

test('띠 선택 전에는 안내 문구를 보여준다', () => {
  render(<ZodiacPage />)
  expect(screen.getByText(/띠를 선택/)).toBeInTheDocument()
})

test('띠를 선택하면 추천 번호 3세트를 보여준다', () => {
  render(<ZodiacPage today="2026-08-21" />)
  fireEvent.click(screen.getByRole('button', { name: /쥐띠/ }))
  expect(screen.getByText(/쥐띠 오늘의 행운 번호/)).toBeInTheDocument()
  const expected = dailyNumberSets('rat', '2026-08-21').flat()
  const balls = document.querySelectorAll('.zodiac-result .lotto-ball')
  expect([...balls].map((b) => Number(b.textContent))).toEqual(expected)
})

test('다른 띠를 선택하면 번호가 바뀐다', () => {
  render(<ZodiacPage today="2026-08-21" />)
  fireEvent.click(screen.getByRole('button', { name: /쥐띠/ }))
  fireEvent.click(screen.getByRole('button', { name: /소띠/ }))
  expect(screen.getByText(/소띠 오늘의 행운 번호/)).toBeInTheDocument()
  const expected = dailyNumberSets('ox', '2026-08-21').flat()
  const balls = document.querySelectorAll('.zodiac-result .lotto-ball')
  expect([...balls].map((b) => Number(b.textContent))).toEqual(expected)
})
