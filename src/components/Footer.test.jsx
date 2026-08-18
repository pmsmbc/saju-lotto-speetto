import { render, screen } from '@testing-library/react'
import Footer from './Footer.jsx'

test('푸터에 고정 카피라이트와 출처 문구를 렌더링', () => {
  render(<Footer />)
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  expect(screen.getByText('© 2026 사또 (satto.kr). All rights reserved.')).toBeInTheDocument()
  expect(screen.getByText(/동행복권/)).toBeInTheDocument()
})
