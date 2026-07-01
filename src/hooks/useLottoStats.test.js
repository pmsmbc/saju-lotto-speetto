import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLottoStats } from './useLottoStats.js'

describe('useLottoStats', () => {
  afterEach(() => vi.restoreAllMocks())

  test('성공 시 stats 반환', async () => {
    const data = { latestRound: 1230, totalDraws: 1230, frequencies: { 1: 10 } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
    const { result } = renderHook(() => useLottoStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats).toEqual(data)
    expect(result.current.error).toBeNull()
  })

  test('실패 시 에러 메시지, stats=null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useLottoStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('통계 데이터를 불러올 수 없습니다')
    expect(result.current.stats).toBeNull()
  })
})
