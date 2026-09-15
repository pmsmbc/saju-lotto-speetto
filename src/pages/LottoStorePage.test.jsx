import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LottoStorePage } from './LottoStorePage.jsx'

const store = (i, over = {}) => ({
  rank: i, name: `가게${i}`, address: `서울 중구 ${i}`, region: i % 2 ? '서울' : '부산',
  count: 60 - i, auto: 40 - i, manual: 10, firstDraw: 300, lastDraw: 1200 + i, ...over,
})
const data = {
  updatedAt: '2026-09-15T00:00:00Z',
  fromDraw: 262, throughDraw: 1241, coveredDraws: 977, missingDraws: [],
  totalRecords: 9263, storeCount: 4589,
  online: { count: 125, auto: 58, manual: 64 },
  top: Array.from({ length: 30 }, (_, i) => store(i + 1)),
}

function mockFetch(payload = data, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => payload }))
}
afterEach(() => vi.restoreAllMocks())

test('집계 범위와 상위 20곳을 보여준다', async () => {
  mockFetch()
  render(<LottoStorePage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  expect(screen.getByText(/262회부터 1241회까지/)).toBeInTheDocument()
  expect(document.querySelectorAll('.store-item')).toHaveLength(20)
  expect(screen.getByText('가게1')).toBeInTheDocument()
})

test('모두 보기를 누르면 나머지가 펼쳐진다', async () => {
  mockFetch()
  render(<LottoStorePage />)
  await waitFor(() => expect(document.querySelectorAll('.store-item')).toHaveLength(20))
  fireEvent.click(screen.getByRole('button', { name: /모두 보기/ }))
  expect(document.querySelectorAll('.store-item')).toHaveLength(30)
})

test('지역 버튼으로 걸러낸다', async () => {
  mockFetch()
  render(<LottoStorePage />)
  await waitFor(() => expect(document.querySelectorAll('.store-item')).toHaveLength(20))
  const seoul = [...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('서울'))
  fireEvent.click(seoul)
  const items = [...document.querySelectorAll('.store-addr')].map((e) => e.textContent)
  expect(items.every((a) => a.startsWith('서울'))).toBe(true)
})

test('온라인 1등 횟수를 따로 알려준다', async () => {
  mockFetch()
  render(<LottoStorePage />)
  await waitFor(() => expect(screen.getByText(/인터넷에서 나왔습니다/)).toBeInTheDocument())
  expect(screen.getByText(/1등 125회/)).toBeInTheDocument()
})

test('설명 섹션을 함께 보여준다', async () => {
  mockFetch()
  render(<LottoStorePage />)
  await waitFor(() => expect(document.querySelector('.page-intro')).toBeInTheDocument())
  expect(document.querySelector('.page-intro').textContent).toMatch(/확률이 올라가는 것이 아닙니다/)
})

test('데이터를 못 받으면 오류를 알린다', async () => {
  mockFetch(null, false)
  render(<LottoStorePage />)
  await waitFor(() => expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument())
})
