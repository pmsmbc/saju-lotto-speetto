import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NumberSet } from './NumberSet.jsx'

test('라벨과 6개 번호를 렌더링', () => {
  const { container } = render(<NumberSet label="A" numbers={[1, 11, 21, 31, 41, 45]} />)
  expect(screen.getByText('A')).toBeInTheDocument()
  expect(container.querySelectorAll('.lotto-ball')).toHaveLength(6)
  expect(screen.getByText('11')).toBeInTheDocument()
})

test('라벨 없으면 공만', () => {
  const { container } = render(<NumberSet numbers={[1, 2, 3, 4, 5, 6]} />)
  expect(container.querySelectorAll('.lotto-ball')).toHaveLength(6)
  expect(container.querySelector('.set-label')).toBeNull()
})
