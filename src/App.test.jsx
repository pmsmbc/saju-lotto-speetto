import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: '2026-07-01T00:00:00Z', rounds: [] }),
  }))
}

test('기본으로 사주 > 오늘의 운세를 보여준다', () => {
  mockFetch()
  render(<App />)
  expect(screen.getByText(/오늘의 일진/)).toBeInTheDocument()
})

test('대메뉴는 사주/로또/스피또/꿈해몽·상식 4개', () => {
  mockFetch()
  render(<App />)
  const labels = [...document.querySelectorAll('.nav-tab')].map((b) => b.textContent)
  expect(labels).toEqual(['사주', '로또', '스피또', '꿈해몽·상식'])
})

test('사주 대메뉴의 하위: 오늘의 운세, 궁합', () => {
  mockFetch()
  render(<App />)
  const subs = [...document.querySelectorAll('.sub-tab')].map((b) => b.textContent)
  expect(subs).toEqual(['오늘의 운세', '궁합'])
})

test('궁합 하위 탭 클릭 시 궁합 입력 화면 표시', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '궁합' }))
  expect(screen.getByText(/생년월일을 입력하면 궁합/)).toBeInTheDocument()
})

test('로또 대메뉴의 하위: 띠별/사주/로또 추천, 기본은 띠별 번호', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  const subs = [...document.querySelectorAll('.sub-tab')].map((b) => b.textContent)
  expect(subs).toEqual(['띠별 번호', '사주 번호', '로또 추천'])
  expect(screen.getByText('쥐띠')).toBeInTheDocument()
})

test('로또 > 사주 번호 클릭 시 입력 화면 표시', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  fireEvent.click(screen.getByRole('button', { name: '사주 번호' }))
  expect(screen.getByText('생년월일')).toBeInTheDocument()
})

test('스피또 대메뉴는 하위 탭 없이 바로 당첨 지역 표시', async () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '스피또' }))
  expect(document.querySelectorAll('.sub-tab')).toHaveLength(0)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('대메뉴를 오가도 하위 선택을 기억한다', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  fireEvent.click(screen.getByRole('button', { name: '로또 추천' }))
  fireEvent.click(screen.getByRole('button', { name: '사주' }))
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  expect(screen.getByRole('button', { name: '5세트 추천받기' })).toBeInTheDocument()
})

test('/gunghap 경로로 접속하면 궁합 화면을 보여준다', () => {
  mockFetch()
  window.history.pushState({}, '', '/gunghap')
  render(<App />)
  expect(screen.getByText(/생년월일을 입력하면 궁합/)).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('탭 이동 시 주소가 바뀐다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  expect(window.location.pathname).toBe('/zodiac')
  fireEvent.click(screen.getByRole('button', { name: '로또 추천' }))
  expect(window.location.pathname).toBe('/lotto')
  window.history.pushState({}, '', '/')
})

test('꿈해몽·상식 메뉴 클릭 시 꿈해몽 글 목록 표시', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '꿈해몽·상식' }))
  expect(window.location.pathname).toBe('/info')
  expect(screen.getByText('정보 이야기')).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})
