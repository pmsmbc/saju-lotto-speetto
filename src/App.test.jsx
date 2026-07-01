import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

test('기본으로 스피또 페이지를 보여준다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ updatedAt: '2026-06-29T03:00:00Z', stores: [] }),
  }))
  render(<App />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('준비중 메뉴 클릭 시 안내 표시', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, stores: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '오늘의 띠별 번호' }))
  expect(screen.getByText('준비중입니다')).toBeInTheDocument()
})
