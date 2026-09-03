import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GunghapPage } from './GunghapPage.jsx'
import { compatibility } from '../lib/gunghap.js'

function type(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

test('입력 전에는 안내 문구를 보여준다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  expect(screen.getByText(/생년월일을 입력하면 궁합/)).toBeInTheDocument()
})

test('두 생년월일 입력 시 점수·등급·네 항목을 보여준다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  type('나', '2020-06-01')
  type('상대', '2016-06-01')
  const r = compatibility('2020-06-01', '2016-06-01', 'lover')
  expect(screen.getByText(String(r.score))).toBeInTheDocument()
  expect(screen.getByText(r.grade)).toBeInTheDocument()
  expect(screen.getByText(/겉궁합/)).toBeInTheDocument()
  expect(document.querySelectorAll('.fortune-lucky .lotto-ball')).toHaveLength(2)
})

test('관계 유형 변경 시 결과가 갱신된다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  type('나', '2020-06-01')
  type('상대', '2016-06-01')
  fireEvent.click(screen.getByRole('button', { name: '직장' }))
  const r = compatibility('2020-06-01', '2016-06-01', 'work')
  expect(screen.getByText(String(r.score))).toBeInTheDocument()
})

test('사주 페이지의 내 생일을 기본값으로 불러온다', () => {
  localStorage.clear()
  localStorage.setItem('satto.saju', JSON.stringify({ birth: '1990-05-15', hour: '' }))
  render(<GunghapPage />)
  expect(screen.getByLabelText('나').value).toBe('1990-05-15')
})
