import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpeettoData } from './useSpeettoData.js'

describe('useSpeettoData', () => {
  afterEach(() => vi.restoreAllMocks())

  test('성공 시 stores와 updatedAt 반환', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updatedAt: '2026-06-29T03:00:00Z', stores: [{ region: '서울' }] }),
    }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stores).toHaveLength(1)
    expect(result.current.updatedAt).toBe('2026-06-29T03:00:00Z')
    expect(result.current.error).toBeNull()
  })

  test('실패 시 에러 메시지', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('데이터를 불러올 수 없습니다')
    expect(result.current.stores).toEqual([])
  })
})
