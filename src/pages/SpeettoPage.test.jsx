import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpeettoPage } from './SpeettoPage.jsx'

const data = {
  updatedAt: '2026-07-01T00:00:00Z',
  rounds: [
    // 2000: 68회만 노출(판매중&1등남음). 67회는 잔여0, 66회는 판매종료 → 제외
    { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
    { game: '스피또2000', gameCode: 'SP2000', round: 67, status: '판매중', rank1Remaining: 0, rank1Total: 6 },
    { game: '스피또2000', gameCode: 'SP2000', round: 66, status: '판매종료', rank1Remaining: 2, rank1Total: 5 },
    // 1000: 107회 노출
    { game: '스피또1000', gameCode: 'SP1000', round: 107, status: '판매중', rank1Remaining: 9, rank1Total: 12 },
    // 500: 48회 노출되지만 아직 1등 판매점 없음
    { game: '스피또500', gameCode: 'SP500', round: 48, status: '판매중', rank1Remaining: 5, rank1Total: 5 },
  ],
  stores: [
    { game: '스피또2000', round: 68, rank: 1, store: '금강복권', address: '경기 김포시 율생로 3', region: '경기' },
    { game: '스피또2000', round: 68, rank: 1, store: '대박복권', address: '경기 김포시 한강로 7', region: '경기' },
    { game: '스피또2000', round: 68, rank: 1, store: '서울복권', address: '서울 강남구 일원로 5', region: '서울' },
    { game: '스피또2000', round: 68, rank: 2, store: '행운복권', address: '서울 마포구 월드컵로 1', region: '서울' },
    { game: '스피또2000', round: 67, rank: 1, store: '옛날복권', address: '서울 종로구 종로 1', region: '서울' },
    { game: '스피또1000', round: 107, rank: 1, store: '영등포복권', address: '서울 영등포구 경인로 843', region: '서울' },
    // 500 48회: 1등 판매점 없음
  ],
}

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
}

afterEach(() => vi.restoreAllMocks())

test('선택 게임(2000)의 판매중&1등남음 회차만, 1등 남은 수와 함께 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  expect(screen.getByText('68회')).toBeInTheDocument()
  expect(screen.getByText('1등 남음 7매/8매')).toBeInTheDocument()
  // 잔여0(67회)·판매종료(66회)는 회차 헤더로 노출되지 않음
  expect(screen.queryByText('67회')).toBeNull()
  expect(screen.queryByText('66회')).toBeNull()
})

test('회차의 1등 당첨 지역 집계와 1등 판매점만 표시 (2등 제외)', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  // 1등 판매점
  expect(screen.getByText('금강복권')).toBeInTheDocument()
  expect(screen.getByText('대박복권')).toBeInTheDocument()
  expect(screen.getByText('서울복권')).toBeInTheDocument()
  // 2등 판매점은 제외
  expect(screen.queryByText('행운복권')).toBeNull()
  // 지역 집계 막대는 시/군/구 단위
  expect(screen.getByRole('button', { name: /경기 김포시/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /서울 강남구/ })).toBeInTheDocument()
})

test('지역 막대 클릭 시 그 회차의 해당 시/군/구 1등 판매점만 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /경기 김포시/ }))
  expect(screen.getByText('금강복권')).toBeInTheDocument()
  expect(screen.getByText('대박복권')).toBeInTheDocument()
  expect(screen.queryByText('서울복권')).toBeNull()
})

test('게임 탭 전환 시 해당 게임 회차 표시', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또1000' }))
  expect(screen.getByText('107회')).toBeInTheDocument()
  expect(screen.getByText('영등포복권')).toBeInTheDocument()
  expect(screen.queryByText('금강복권')).toBeNull()
})

test('1등 남았지만 아직 1등 당첨 지역이 없으면 안내', async () => {
  mockFetch()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또500' }))
  expect(screen.getByText('48회')).toBeInTheDocument()
  expect(screen.getByText('1등 남음 5매/5매')).toBeInTheDocument()
  expect(screen.getByText('아직 1등 당첨 지역이 없습니다')).toBeInTheDocument()
})

test('판매중&1등남음 회차가 없으면 안내', async () => {
  const empty = {
    ...data,
    rounds: [
      { game: '스피또2000', gameCode: 'SP2000', round: 66, status: '판매종료', rank1Remaining: 0, rank1Total: 5 },
    ],
  }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => empty }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  expect(screen.getByText('현재 1등이 남은 판매중 회차가 없습니다')).toBeInTheDocument()
})

test('로드 실패 시 에러', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument())
})
