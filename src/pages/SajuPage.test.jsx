import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SajuPage } from './SajuPage.jsx'
import { fourPillars, sajuNumbers } from '../lib/saju.js'

test('생년월일 입력 전에는 안내 문구를 보여준다', () => {
  localStorage.clear()
  render(<SajuPage />)
  expect(screen.getByText(/생년월일을 입력하면/)).toBeInTheDocument()
})

test('생년월일 입력 시 사주 네 기둥과 번호 6개를 보여준다', () => {
  localStorage.clear()
  render(<SajuPage today="2026-09-02" />)
  fireEvent.change(screen.getByLabelText('생년월일'), { target: { value: '1990-05-15' } })
  const p = fourPillars('1990-05-15', null)
  expect(screen.getByText(p.year.name)).toBeInTheDocument()
  expect(screen.getByText(p.day.name)).toBeInTheDocument()
  const pillarNames = [...document.querySelectorAll('.pillar-name')].map((el) => el.textContent)
  expect(pillarNames[3]).toBe('모름') // 시주 모름
  const balls = document.querySelectorAll('.saju-result .lotto-ball')
  expect([...balls].map((b) => Number(b.textContent))).toEqual(sajuNumbers('1990-05-15', null, '2026-09-02'))
})

test('태어난 시를 고르면 시주가 표시된다', () => {
  localStorage.clear()
  render(<SajuPage today="2026-09-02" />)
  fireEvent.change(screen.getByLabelText('생년월일'), { target: { value: '1990-05-15' } })
  fireEvent.change(screen.getByLabelText('태어난 시'), { target: { value: '3' } })
  const p = fourPillars('1990-05-15', 3)
  expect(screen.getByText(p.hour.name)).toBeInTheDocument()
})

test('입력한 생년월일을 localStorage에 저장한다', () => {
  localStorage.clear()
  render(<SajuPage today="2026-09-02" />)
  fireEvent.change(screen.getByLabelText('생년월일'), { target: { value: '1990-05-15' } })
  expect(JSON.parse(localStorage.getItem('satto.saju')).birth).toBe('1990-05-15')
})

test('음력 선택 시 양력으로 변환해 사주를 계산한다', () => {
  localStorage.clear()
  render(<SajuPage today="2026-09-03" />)
  fireEvent.click(screen.getByRole('button', { name: '음력' }))
  fireEvent.change(screen.getByLabelText('생년월일'), { target: { value: '2026-01-01' } })
  // 음력 2026-01-01 = 양력 2026-02-17 (병오년 설날)
  expect(screen.getByText(/양력 2026-02-17으로 계산합니다/)).toBeInTheDocument()
  const p = fourPillars('2026-02-17', null)
  expect(screen.getByText(p.year.name)).toBeInTheDocument() // 병오
})
