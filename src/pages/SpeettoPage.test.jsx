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
}

afterEach(() => vi.restoreAllMocks())

test('기본 게임(2000) 탭에서 판매중&1등잔여>0 회차 표시, 잔여0 회차 제외', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  expect(screen.getByText('68회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 7매/8매')).toBeInTheDocument()
  expect(screen.queryByText('67회')).toBeNull()
})

test('게임 탭 전환 시 해당 게임 회차 표시', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또1000' }))
  expect(screen.getByText('107회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 9매/12매')).toBeInTheDocument()
})

test('조건 맞는 회차 없으면 안내 (스피또500 판매종료만)', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또500' }))
  expect(screen.getByText('현재 1등이 남은 판매중 회차가 없습니다')).toBeInTheDocument()
})

test('로드 실패 시 에러', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument())
})
