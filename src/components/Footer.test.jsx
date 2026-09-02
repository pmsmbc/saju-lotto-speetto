import { render, screen } from '@testing-library/react'
import Footer, { YOUTUBE_URL } from './Footer.jsx'

test('푸터에 카피라이트를 렌더링', () => {
  render(<Footer />)
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  expect(screen.getByText('© 2026 사또 (satto.kr). All rights reserved.')).toBeInTheDocument()
  expect(screen.queryByText(/동행복권/)).not.toBeInTheDocument()
})

test('북한산쌍문철학원 유튜브 링크를 새 탭으로 연다', () => {
  render(<Footer />)
  const link = screen.getByRole('link', { name: /북한산쌍문철학원/ })
  expect(link).toHaveAttribute('href', 'https://www.youtube.com/@ssangmun-center')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  expect(YOUTUBE_URL).toBe('https://www.youtube.com/@ssangmun-center')
})
