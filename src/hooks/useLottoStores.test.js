import { test, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLottoStores } from './useLottoStores.js'

afterEach(() => vi.restoreAllMocks())

test('데이터를 받아 돌려준다', async () => {
  const payload = { top: [{ rank: 1, name: '가게' }] }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }))
  const { result } = renderHook(() => useLottoStores())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.data).toEqual(payload)
  expect(result.current.error).toBe(null)
})

test('실패하면 오류 메시지를 준다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  const { result } = renderHook(() => useLottoStores())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.data).toBe(null)
  expect(result.current.error).toMatch(/불러올 수 없습니다/)
})
