import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FloatingShare from './FloatingShare.jsx'

afterEach(() => vi.restoreAllMocks())

test('사이트 공유 플로팅 버튼: share 시트 호출', async () => {
  const share = vi.fn().mockResolvedValue()
  vi.stubGlobal('navigator', { ...navigator, share })
  render(<FloatingShare />)
  fireEvent.click(screen.getByRole('button', { name: '사이트 공유' }))
  await waitFor(() => expect(share).toHaveBeenCalled())
  expect(share.mock.calls[0][0].url).toBe(window.location.href)
})

test('share 없으면 현재 주소를 클립보드에 복사', async () => {
  const writeText = vi.fn().mockResolvedValue()
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  render(<FloatingShare />)
  fireEvent.click(screen.getByRole('button', { name: '사이트 공유' }))
  await waitFor(() => expect(screen.getByText('복사됨!')).toBeInTheDocument())
  expect(writeText).toHaveBeenCalledWith(window.location.href)
})
