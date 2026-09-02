import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

test('기본으로 오늘의 운세 페이지를 보여준다', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, rounds: [] }),
  }))
  render(<App />)
  expect(screen.getByText(/오늘의 일진/)).toBeInTheDocument()
})

test('탭 순서: 운세 → 띠별 → 사주 → 로또 → 스피또', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, rounds: [] }),
  }))
  render(<App />)
  const labels = [...document.querySelectorAll('.nav-tab')].map((b) => b.textContent)
  expect(labels).toEqual(['오늘의 운세', '띠별 번호', '사주 번호', '로또 추천', '스피또 지역'])
})

test('스피또 지역 탭 클릭 시 스피또 페이지 표시', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ updatedAt: '2026-07-01T00:00:00Z', rounds: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /스피또 지역/ }))
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('사주 번호 탭 클릭 시 입력 화면 표시', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, rounds: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /사주 번호/ }))
  expect(screen.getByText('생년월일')).toBeInTheDocument()
})
