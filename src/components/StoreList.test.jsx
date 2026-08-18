import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreList } from './StoreList.jsx'

const stores = [
  { game: '스피또1000', round: 107, rank: 1, store: '영등포역 복권방', address: '서울 영등포구', region: '서울' },
]

test('판매점 정보를 렌더링', () => {
  render(<StoreList stores={stores} />)
  expect(screen.getByText('영등포역 복권방')).toBeInTheDocument()
  expect(screen.getByText('서울 영등포구')).toBeInTheDocument()
  expect(screen.getByText('1등')).toBeInTheDocument()
  expect(screen.getByText('스피또1000 107회')).toBeInTheDocument()
})

test('빈 배열이면 안내 문구', () => {
  render(<StoreList stores={[]} />)
  expect(screen.getByText('조건에 맞는 당첨 판매점이 없습니다')).toBeInTheDocument()
})
