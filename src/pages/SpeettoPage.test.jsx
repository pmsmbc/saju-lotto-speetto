import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpeettoPage } from './SpeettoPage.jsx'

const data = {
  updatedAt: '2026-07-01T00:00:00Z',
  rounds: [
    { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
    { game: '스피또2000', gameCode: 'SP2000', round: 67, status: '판매중', rank1Remaining: 0, rank1Total: 6 },
    { game: '스피또1000', gameCode: 'SP1000', round: 107, status: '판매중', rank1Remaining: 9, rank1Total: 12 },
    { game: '스피또500', gameCode: 'SP500', round: 47, status: '판매종료', rank1Remaining: 3, rank1Total: 5 },
  ],
  stores: [
    { game: '스피또2000', round: 68, rank: 1, store: '금강복권', address: '경기 김포시', region: '경기' },
    { game: '스피또2000', round: 68, rank: 2, store: '행운복권', address: '서울 강남구', region: '서울' },
    { game: '스피또2000', round: 67, rank: 1, store: '대박복권', address: '서울 마포구', region: '서울' },
    { game: '스피또1000', round: 107, rank: 1, store: '영등포역 복권방', address: '서울 영등포구', region: '서울' },
  ],
}

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
}

afterEach(() => vi.restoreAllMocks())

test('기본은 당첨 지역 모드 — 선택 게임(2000)의 판매점과 지역 집계 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  // 2000 판매점 표시, 다른 게임(1000)의 판매점은 미표시
  expect(screen.getByText('금강복권')).toBeInTheDocument()
  expect(screen.queryByText('영등포역 복권방')).toBeNull()
  // 지역 집계: 서울 2, 경기 1
  expect(screen.getByRole('button', { name: /서울/ })).toBeInTheDocument()
})

test('지역 막대 클릭 시 해당 지역 판매점만 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /경기/ }))
  expect(screen.getByText('금강복권')).toBeInTheDocument()
  expect(screen.queryByText('행운복권')).toBeNull()
})

test('회차 선택 시 해당 회차 판매점만 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '스피또2000#67' } })
  expect(screen.getByText('대박복권')).toBeInTheDocument()
  expect(screen.queryByText('금강복권')).toBeNull()
})

test('게임 탭 전환 시 해당 게임 판매점 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또1000' }))
  expect(screen.getByText('영등포역 복권방')).toBeInTheDocument()
  expect(screen.queryByText('금강복권')).toBeNull()
})

test('1등 잔여 모드 — 판매중&잔여>0 회차 카드, 잔여0 제외', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '1등 잔여' }))
  expect(screen.getByText('68회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 7매/8매')).toBeInTheDocument()
  expect(screen.queryByText('67회')).toBeNull()
})

test('1등 잔여 모드에서 조건 맞는 회차 없으면 안내 (스피또500)', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또500' }))
  fireEvent.click(screen.getByRole('button', { name: '1등 잔여' }))
  expect(screen.getByText('현재 1등이 남은 판매중 회차가 없습니다')).toBeInTheDocument()
})

test('로드 실패 시 에러', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument())
})
