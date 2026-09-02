import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FortunePage } from './FortunePage.jsx'
import { allFortunes, dailyFortune } from '../lib/fortune.js'

test('12띠와 등급 배지를 모두 보여준다', () => {
  render(<FortunePage today="2026-09-02" />)
  const badges = document.querySelectorAll('.zodiac-grid .grade-badge')
  expect(badges).toHaveLength(12)
  const expected = allFortunes('2026-09-02').map((f) => f.grade)
  expect([...badges].map((b) => b.textContent)).toEqual(expected)
})

test('오늘의 일진을 표시한다 (2019-01-27 = 갑자일)', () => {
  render(<FortunePage today="2019-01-27" />)
  expect(screen.getByText(/갑자\(甲子\)일/)).toBeInTheDocument()
})

test('띠 선택 시 총운·금전운 문구와 행운 번호를 보여준다', () => {
  render(<FortunePage today="2026-09-02" />)
  fireEvent.click(screen.getByRole('button', { name: /쥐띠/ }))
  const f = dailyFortune('rat', '2026-09-02')
  expect(screen.getByText(f.total)).toBeInTheDocument()
  expect(screen.getByText(f.money)).toBeInTheDocument()
  expect(document.querySelectorAll('.fortune-lucky .lotto-ball')).toHaveLength(2)
})

test('선택 전에는 안내 문구를 보여준다', () => {
  render(<FortunePage today="2026-09-02" />)
  expect(screen.getByText(/띠를 선택하면 오늘의 운세/)).toBeInTheDocument()
})
