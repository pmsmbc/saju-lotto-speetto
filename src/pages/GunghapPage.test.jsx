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

test('두 생년월일 입력 시 점수·등급·항목을 보여준다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  type('나 생년월일', '2020-06-01')
  type('상대 생년월일', '2016-06-01')
  const r = compatibility('2020-06-01', '2016-06-01', 'lover')
  expect(screen.getByText(String(r.score))).toBeInTheDocument()
  expect(screen.getByText(r.grade)).toBeInTheDocument()
  expect(document.querySelector('.gunghap-parts')).toHaveTextContent('겉궁합')
  expect(screen.queryByText(/시궁합/)).toBeNull() // 시 미입력
})

test('두 사람 모두 태어난 시 선택 시 시궁합 표시', () => {
  localStorage.clear()
  render(<GunghapPage />)
  type('나 생년월일', '2020-06-01')
  type('상대 생년월일', '2016-06-01')
  const selects = screen.getAllByLabelText('태어난 시')
  fireEvent.change(selects[0], { target: { value: '0' } })
  fireEvent.change(selects[1], { target: { value: '4' } })
  expect(screen.getByText(/시궁합/)).toBeInTheDocument()
})

test('음력 선택 시 양력으로 변환해 계산하고 변환 결과를 보여준다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  // 나: 음력 2026-01-01 → 양력 2026-02-17
  const calGroups = screen.getAllByRole('group', { name: /달력 구분/ })
  fireEvent.click(calGroups[0].querySelector('button:nth-child(2)')) // 음력
  type('나 생년월일', '2026-01-01')
  type('상대 생년월일', '2016-06-01')
  expect(screen.getByText(/양력 2026-02-17으로 계산합니다/)).toBeInTheDocument()
  const r = compatibility('2026-02-17', '2016-06-01', 'lover')
  expect(screen.getByText(String(r.score))).toBeInTheDocument()
})

test('관계 유형 변경 시 결과가 갱신된다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  type('나 생년월일', '2020-06-01')
  type('상대 생년월일', '2016-06-01')
  fireEvent.click(screen.getByRole('button', { name: '직장' }))
  const r = compatibility('2020-06-01', '2016-06-01', 'work')
  expect(screen.getByText(String(r.score))).toBeInTheDocument()
})

test('사주 페이지의 내 생일을 기본값으로 불러온다', () => {
  localStorage.clear()
  localStorage.setItem('satto.saju', JSON.stringify({ birth: '1990-05-15', hour: '' }))
  render(<GunghapPage />)
  expect(screen.getByLabelText('나 생년월일').value).toBe('1990-05-15')
})

test('겉궁합·속궁합 접이식 안내를 보여준다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  expect(screen.getByText('겉궁합·속궁합이란?')).toBeInTheDocument()
  expect(screen.getByText(/배우자 자리\(배우자궁\)/)).toBeInTheDocument()
  expect(document.querySelector('details.gunghap-info')).not.toBeNull()
})

test('오행 분포 접이식 안내를 하단에 항상 보여준다', () => {
  localStorage.clear()
  render(<GunghapPage />)
  expect(screen.getByText('오행 분포란?')).toBeInTheDocument()
  expect(screen.getByText(/다섯 기운으로/)).toBeInTheDocument()
  expect(document.querySelectorAll('details.gunghap-info')).toHaveLength(2)
})
