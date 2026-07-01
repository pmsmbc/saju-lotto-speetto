import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpeettoRoundCard } from './SpeettoRoundCard.jsx'

test('회차와 1등 잔여/총을 표시', () => {
  render(<SpeettoRoundCard round={68} rank1Remaining={7} rank1Total={8} />)
  expect(screen.getByText('68회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 7매/8매')).toBeInTheDocument()
})
