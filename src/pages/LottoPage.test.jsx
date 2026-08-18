import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LottoPage } from './LottoPage.jsx'

const stats = {
  latestRound: 1230,
  latestDraw: {
    round: 1230,
    numbers: [3, 8, 9, 22, 28, 42],
    bonus: 45,
    date: '2026-06-27',
    firstPrize: { winners: 9, amount: 3090961625 },
  },
  totalDraws: 1230,
  frequencies: (() => { const f = {}; for (let n = 1; n <= 45; n++) f[n] = n; return f })(),
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// 순차 공개 타이머는 콜백 안에서 다음 setTimeout을 다시 예약하는 연쇄 구조라
// advanceTimersByTime/runAllTimers 한 번으로는 끝까지 못 돌아 틱 단위로 진행시킨다
function advanceAllReveals(ticks = 5, stepMs = 350) {
  for (let i = 0; i < ticks; i++) {
    act(() => vi.advanceTimersByTime(stepMs))
  }
}

test('랜덤 모드는 통계 로딩 실패와 무관하게 순차적으로 5세트를 만든다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<LottoPage />)
  await waitFor(() => expect(screen.getByRole('button', { name: '랜덤' })).toBeInTheDocument())

  vi.useFakeTimers()
  fireEvent.click(screen.getByRole('button', { name: '✨ 5세트 추천받기' }))
  // 클릭 직후에는 아직 완성된 세트가 없고 생성 중 표시만 있음
  expect(screen.getByText('생성 중...')).toBeInTheDocument()

  advanceAllReveals()
  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  expect(screen.queryByText('생성 중...')).toBeNull()
})

test('통계 데이터 없으면 통계 기반 모드 비활성', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<LottoPage />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '통계 기반' })).toBeDisabled(),
  )
})

test('통계 로드 시 지난 회차 표시 + 통계 기반 모드 선택 후 추천 시 순차적으로 5세트', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
  render(<LottoPage />)
  await waitFor(() => expect(screen.getByText(/지난 1230회/)).toBeInTheDocument())
  expect(screen.getByText('1등 9명 · 1인당 30억 9,096만원')).toBeInTheDocument()
  const modeBtn = screen.getByRole('button', { name: '통계 기반' })
  expect(modeBtn).toBeEnabled()
  fireEvent.click(modeBtn)

  vi.useFakeTimers()
  fireEvent.click(screen.getByRole('button', { name: '✨ 5세트 추천받기' }))
  advanceAllReveals()
  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})
