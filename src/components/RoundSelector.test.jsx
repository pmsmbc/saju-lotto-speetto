import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoundSelector } from './RoundSelector.jsx'

const rounds = [
  { game: '스피또2000', round: 68, label: '스피또2000 68회' },
  { game: '스피또1000', round: 107, label: '스피또1000 107회' },
]

test('전체 + 회차 옵션을 렌더링', () => {
  render(<RoundSelector rounds={rounds} value="" onChange={() => {}} />)
  expect(screen.getByRole('option', { name: '전체' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: '스피또1000 107회' })).toBeInTheDocument()
})

test('선택 시 onChange로 value 전달', () => {
  const onChange = vi.fn()
  render(<RoundSelector rounds={rounds} value="" onChange={onChange} />)
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '스피또1000#107' } })
  expect(onChange).toHaveBeenCalledWith('스피또1000#107')
})
