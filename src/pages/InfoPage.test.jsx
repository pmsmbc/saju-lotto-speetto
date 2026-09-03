import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoPage } from './InfoPage.jsx'
import { ARTICLES } from '../lib/articles.js'

test('글 목록에 모든 글 제목을 보여준다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  for (const a of ARTICLES) {
    expect(screen.getByText(a.title)).toBeInTheDocument()
  }
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
