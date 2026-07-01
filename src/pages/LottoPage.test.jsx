import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LottoPage } from './LottoPage.jsx'

const stats = {
  latestRound: 1230,
  latestDraw: { round: 1230, numbers: [3, 8, 9, 22, 28, 42], bonus: 45, date: '2026-06-27' },
  totalDraws: 1230,
  frequencies: (() => { const f = {}; for (let n = 1; n <= 45; n++) f[n] = n; return f })(),
}

afterEach(() => vi.restoreAllMocks())

test('랜덤 추천은 통계 로딩 실패와 무관하게 5세트를 만든다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<LottoPage />)
  await waitFor(() => expect(screen.getByRole('button', { name: /랜덤 추천/ })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: /랜덤 추천/ }))
  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})

test('통계 데이터 없으면 통계 버튼 비활성', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<LottoPage />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /통계 기반 추천/ })).toBeDisabled(),
  )
})

test('통계 로드 시 지난 회차 표시 + 통계 버튼 활성 + 클릭 시 5세트', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
  render(<LottoPage />)
  await waitFor(() => expect(screen.getByText(/지난 1230회/)).toBeInTheDocument())
  const btn = screen.getByRole('button', { name: /통계 기반 추천/ })
  expect(btn).toBeEnabled()
  fireEvent.click(btn)
  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})
