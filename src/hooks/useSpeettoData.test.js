import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpeettoData } from './useSpeettoData.js'

describe('useSpeettoData', () => {
  afterEach(() => vi.restoreAllMocks())

  test('성공 시 rounds 반환', async () => {
    const data = { updatedAt: '2026-07-01T00:00:00Z', rounds: [{ gameCode: 'SP2000', round: 68 }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rounds).toEqual(data.rounds)
    expect(result.current.updatedAt).toBe('2026-07-01T00:00:00Z')
    expect(result.current.error).toBeNull()
  })

  test('실패 시 에러 메시지, rounds=[]', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('데이터를 불러올 수 없습니다')
    expect(result.current.rounds).toEqual([])
  })
})
