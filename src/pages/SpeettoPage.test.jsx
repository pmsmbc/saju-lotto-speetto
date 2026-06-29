import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SpeettoPage } from './SpeettoPage.jsx'

const data = {
  updatedAt: '2026-06-29T03:00:00Z',
  stores: [
    { game: '스피또1000', round: 107, rank: 1, store: 'A', address: '서울 강남', region: '서울' },
    { game: '스피또1000', round: 106, rank: 1, store: 'B', address: '경기 수원', region: '경기' },
  ],
}

function mockFetchOk() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
}

afterEach(() => vi.restoreAllMocks())

test('로딩 후 지역 집계와 판매점을 표시', async () => {
  mockFetchOk()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
  expect(screen.getByText('B')).toBeInTheDocument()
  // 마지막 업데이트 표시(날짜 문자열 일부)
  expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument()
})

test('지역 선택 시 해당 지역만 표시', async () => {
  mockFetchOk()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /경기/ }))
  expect(screen.queryByText('A')).not.toBeInTheDocument()
  expect(screen.getByText('B')).toBeInTheDocument()
})

test('fetch 실패 시 에러 메시지', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SpeettoPage />)
  await waitFor(() =>
    expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument(),
  )
})
