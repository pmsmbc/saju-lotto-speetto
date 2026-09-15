import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LatestArticles, latestArticles } from './LatestArticles.jsx'

const sample = [
  { slug: 'a', title: 'A', date: '2026-09-01', order: 1 },
  { slug: 'b', title: 'B', date: '2026-09-10', order: 2 },
  { slug: 'c', title: 'C', date: '2026-09-05', order: 3 },
]

test('최신 날짜 순으로 고른다', () => {
  expect(latestArticles(sample, 2).map((a) => a.slug)).toEqual(['b', 'c'])
})

test('날짜가 같으면 나중에 추가된(order 큰) 글이 앞', () => {
  const same = [
    { slug: 'x', title: 'X', date: '2026-09-01', order: 1 },
    { slug: 'y', title: 'Y', date: '2026-09-01', order: 2 },
  ]
  expect(latestArticles(same, 2).map((a) => a.slug)).toEqual(['y', 'x'])
})

test('글 목록과 전체 보기 링크를 그린다', () => {
  render(<LatestArticles limit={5} />)
  expect(screen.getByText('새로 올라온 글')).toBeInTheDocument()
  expect(document.querySelectorAll('.latest-list li')).toHaveLength(5)
  expect(document.querySelector('.latest-list a').getAttribute('href')).toMatch(/^\/info\/[a-z-]+\/$/)
  expect(screen.getByText(/글 전체 보기/)).toBeInTheDocument()
})
