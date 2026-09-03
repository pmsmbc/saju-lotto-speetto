import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoPage } from './InfoPage.jsx'
import { ARTICLES } from '../lib/articles.js'

test('카테고리별 글 목록을 보여준다 (기본 꿈해몽, 탭으로 상식 전환)', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  for (const a of ARTICLES.filter((x) => x.category === 'dream')) {
    expect(screen.getByText(a.title)).toBeInTheDocument()
  }
  fireEvent.click(screen.getByRole('button', { name: '사주·로또 상식' }))
  for (const a of ARTICLES.filter((x) => x.category === 'guide')) {
    expect(screen.getByText(a.title)).toBeInTheDocument()
  }
  expect(screen.queryByText('돼지꿈 해몽 완전 정리')).toBeNull()
  window.history.pushState({}, '', '/')
})

test('상식 글에는 행운 번호가 없고 꿈 글에는 있다', () => {
  window.history.pushState({}, '', '/info/odds/')
  const { unmount } = render(<InfoPage today="2026-09-03" />)
  expect(document.querySelector('.dream-lucky')).toBeNull()
  unmount()
  window.history.pushState({}, '', '/info/pig/')
  render(<InfoPage today="2026-09-03" />)
  expect(document.querySelectorAll('.dream-lucky .lotto-ball')).toHaveLength(6)
  window.history.pushState({}, '', '/')
})

test('글을 클릭하면 본문·행운 번호 6개·공유 버튼을 보여주고 주소가 바뀐다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.click(screen.getByText('돼지꿈 해몽 완전 정리'))
  expect(window.location.pathname).toBe('/info/pig/')
  expect(screen.getByText(/다산과 풍요의 상징/)).toBeInTheDocument()
  expect(document.querySelectorAll('.dream-lucky .lotto-ball')).toHaveLength(6)
  expect(screen.getByRole('button', { name: /공유하기/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '← 글 목록' }))
  expect(window.location.pathname).toBe('/info')
  window.history.pushState({}, '', '/')
})

test('/info/snake/ 주소로 직접 접속하면 해당 글을 보여준다', () => {
  window.history.pushState({}, '', '/info/snake/')
  render(<InfoPage />)
  expect(screen.getByRole('heading', { level: 1, name: /뱀꿈/ })).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})
