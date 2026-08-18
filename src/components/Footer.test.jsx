import { render, screen } from '@testing-library/react'
import Footer, { copyrightText } from './Footer.jsx'

test('시작 연도와 같으면 단일 연도로 표시', () => {
  expect(copyrightText(2026)).toBe('© 2026 사주로또 사또 (satto.kr). All rights reserved.')
})

test('시작 연도 이후면 범위로 표시', () => {
  expect(copyrightText(2028)).toBe('© 2026–2028 사주로또 사또 (satto.kr). All rights reserved.')
})

test('푸터에 카피라이트와 출처 문구를 렌더링', () => {
  render(<Footer />)
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  expect(screen.getByText(/© 2026/)).toBeInTheDocument()
  expect(screen.getByText(/동행복권/)).toBeInTheDocument()
})
