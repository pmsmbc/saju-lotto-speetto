import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

test('기본으로 스피또 페이지를 보여준다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ updatedAt: '2026-07-01T00:00:00Z', rounds: [] }),
  }))
  render(<App />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('오늘의 띠별 번호 탭 클릭 시 띠별 번호 표시', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, rounds: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /오늘의 띠별 번호/ }))
  expect(screen.getByText('쥐띠')).toBeInTheDocument()
  expect(screen.getByText('돼지띠')).toBeInTheDocument()
})

test('사주 번호 추천 탭 클릭 시 입력 화면 표시', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, rounds: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /사주 번호 추천/ }))
  expect(screen.getByText('생년월일')).toBeInTheDocument()
})
