import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LottoBall } from './LottoBall.jsx'

test('번호를 표시한다', () => {
  render(<LottoBall number={7} />)
  expect(screen.getByText('7')).toBeInTheDocument()
})

test('번호대별 색상 클래스', () => {
  const cases = [
    [5, 'ball-yellow'],
    [15, 'ball-blue'],
    [25, 'ball-red'],
    [35, 'ball-gray'],
    [45, 'ball-green'],
  ]
  for (const [n, cls] of cases) {
    const { container, unmount } = render(<LottoBall number={n} />)
    expect(container.querySelector('.lotto-ball')).toHaveClass(cls)
    unmount()
  }
})
