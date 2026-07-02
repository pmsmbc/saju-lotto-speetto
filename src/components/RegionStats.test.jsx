import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionStats } from './RegionStats.jsx'

const stats = [
  { region: '서울', count: 2 },
  { region: '경기', count: 1 },
]

test('지역과 건수를 렌더링', () => {
  render(<RegionStats stats={stats} selectedRegion={null} onSelectRegion={() => {}} />)
  expect(screen.getByText('서울')).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
})

test('지역 클릭 시 해당 지역으로 콜백', () => {
  const onSelect = vi.fn()
  render(<RegionStats stats={stats} selectedRegion={null} onSelectRegion={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: /서울/ }))
  expect(onSelect).toHaveBeenCalledWith('서울')
})

test('선택된 지역 다시 클릭 시 해제(null)', () => {
  const onSelect = vi.fn()
  render(<RegionStats stats={stats} selectedRegion="서울" onSelectRegion={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: /서울/ }))
  expect(onSelect).toHaveBeenCalledWith(null)
})

test('빈 배열이면 안내 문구', () => {
  render(<RegionStats stats={[]} selectedRegion={null} onSelectRegion={() => {}} />)
  expect(screen.getByText('현재 표시할 당첨 정보가 없습니다')).toBeInTheDocument()
})
