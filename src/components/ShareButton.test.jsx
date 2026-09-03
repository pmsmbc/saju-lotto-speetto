import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShareButton from './ShareButton.jsx'

afterEach(() => vi.restoreAllMocks())

test('navigator.share가 있으면 공유 시트를 연다', async () => {
  const share = vi.fn().mockResolvedValue()
  vi.stubGlobal('navigator', { ...navigator, share })
  render(<ShareButton title="t" text="x" url="https://satto.kr/unse?ddi=rat" />)
  fireEvent.click(screen.getByRole('button', { name: /공유하기/ }))
  await waitFor(() => expect(share).toHaveBeenCalledWith({ title: 't', text: 'x', url: 'https://satto.kr/unse?ddi=rat' }))
})

test('share가 없으면 클립보드 복사 후 안내 표시', async () => {
  const writeText = vi.fn().mockResolvedValue()
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  render(<ShareButton title="t" text="x" url="https://satto.kr/gunghap?m=a&p=b" />)
  fireEvent.click(screen.getByRole('button', { name: /공유하기/ }))
  await waitFor(() => expect(screen.getByText('링크 복사됨!')).toBeInTheDocument())
  expect(writeText).toHaveBeenCalledWith('https://satto.kr/gunghap?m=a&p=b')
})
