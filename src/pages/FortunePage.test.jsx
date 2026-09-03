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

test('띠 선택 시 키워드·길방·년생별 한 줄·행운 번호를 보여준다', () => {
  render(<FortunePage today="2026-09-02" />)
  fireEvent.click(screen.getByRole('button', { name: /쥐띠/ }))
  const f = dailyFortune('rat', '2026-09-02')
  expect(screen.getByText(f.keywords.money)).toBeInTheDocument()
  expect(screen.getByText(f.direction)).toBeInTheDocument()
  const items = document.querySelectorAll('.fortune-years li')
  expect(items).toHaveLength(6)
  expect(items[0].textContent).toContain('36년생')
  expect(items[0].textContent).toContain(f.yearLines[0].text)
  expect(document.querySelectorAll('.fortune-lucky .lotto-ball')).toHaveLength(2)
})

test('선택 전에는 안내 문구를 보여준다', () => {
  render(<FortunePage today="2026-09-02" />)
  expect(screen.getByText(/띠를 선택하면 오늘의 운세/)).toBeInTheDocument()
})
