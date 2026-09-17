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

test('하이픈이 들어간 슬러그도 주소로 바로 열린다', () => {
  window.history.pushState({}, '', '/info/taemong-fruit/')
  render(<InfoPage today="2026-09-03" />)
  expect(document.querySelector('.article h1').textContent).toContain('과일 태몽')
  window.history.pushState({}, '', '/')
})

test('본문 안의 내부 링크가 a 태그로 렌더된다', () => {
  window.history.pushState({}, '', '/info/taemong/')
  render(<InfoPage today="2026-09-03" />)
  const links = [...document.querySelectorAll('.article-body a')].map((a) => a.getAttribute('href'))
  expect(links).toContain('/info/taemong-fruit/')
  expect(links).toContain('/info/taemong-animal/')
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
  expect(window.location.pathname).toBe('/info/')
  window.history.pushState({}, '', '/')
})

test('/info/snake/ 주소로 직접 접속하면 해당 글을 보여준다', () => {
  window.history.pushState({}, '', '/info/snake/')
  render(<InfoPage />)
  expect(screen.getByRole('heading', { level: 1, name: /뱀꿈/ })).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('글 하단에 같은 카테고리 관련 글 3개를 보여준다', () => {
  window.history.pushState({}, '', '/info/pig/')
  render(<InfoPage today="2026-09-03" />)
  const items = document.querySelectorAll('.related-list li')
  expect(items).toHaveLength(3)
  expect(items[0].textContent).toContain('뱀꿈')
  fireEvent.click(items[0].querySelector('button'))
  expect(window.location.pathname).toBe('/info/snake/')
  window.history.pushState({}, '', '/')
})

test('태그 칩으로 글 목록을 걸러낸다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  const all = document.querySelectorAll('.info-list li').length
  const animal = [...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('동물'))
  expect(animal).toBeTruthy()
  fireEvent.click(animal)
  const filtered = document.querySelectorAll('.info-list li').length
  expect(filtered).toBeLessThan(all)
  expect(filtered).toBe(Number(animal.textContent.replace('동물 ', '')))
  // 한 번 더 누르면 전체로 돌아온다
  fireEvent.click(animal)
  expect(document.querySelectorAll('.info-list li')).toHaveLength(all)
  window.history.pushState({}, '', '/')
})

test('카테고리를 바꾸면 태그 선택이 풀린다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.click([...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('동물')))
  fireEvent.click(screen.getByRole('button', { name: '사주·로또 상식' }))
  // 상식 글은 태그가 없으므로 칩이 사라지고 전체가 보인다
  expect(document.querySelectorAll('.tag-chip')).toHaveLength(0)
  expect(document.querySelectorAll('.info-list li').length).toBeGreaterThan(0)
  window.history.pushState({}, '', '/')
})

test('검색창은 항상 보이고 입력하면 목록이 좁혀진다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  const input = screen.getByLabelText('글 검색')
  expect(input).toBeInTheDocument()
  const all = document.querySelectorAll('.info-list li').length
  fireEvent.change(input, { target: { value: '물고기' } })
  expect(document.querySelectorAll('.info-list li').length).toBeLessThan(all)
  expect(screen.getByText(/검색 결과/)).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('검색어를 주소에 남기고, 주소의 검색어로 시작한다', () => {
  window.history.pushState({}, '', '/info')
  const { unmount } = render(<InfoPage today="2026-09-03" />)
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: '돼지' } })
  expect(window.location.search).toContain('q=')
  unmount()
  render(<InfoPage today="2026-09-03" />)
  expect(screen.getByLabelText('글 검색')).toHaveValue('돼지')
  window.history.pushState({}, '', '/')
})

test('맞는 글이 없으면 안내 문구를 보여준다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: 'zzzz없는말' } })
  expect(document.querySelectorAll('.info-list li')).toHaveLength(0)
  expect(screen.getByText(/맞는 글이 없어요/)).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('태그와 검색어는 함께 걸린다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.click([...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('동물')))
  const animalOnly = document.querySelectorAll('.info-list li').length
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: '꿈' } })
  expect(document.querySelectorAll('.info-list li').length).toBeLessThanOrEqual(animalOnly)
  window.history.pushState({}, '', '/')
})

test('/info/tag/animal/ 로 들어가면 해당 태그가 선택된 채로 시작한다', () => {
  window.history.pushState({}, '', '/info/tag/animal/')
  render(<InfoPage today="2026-09-03" />)
  const chip = [...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('동물'))
  expect(chip.className).toContain('active')
  expect(document.querySelectorAll('.info-list li').length).toBe(Number(chip.textContent.replace('동물 ', '')))
  window.history.pushState({}, '', '/')
})

test('모르는 태그 경로는 전체 목록으로 떨어진다', () => {
  window.history.pushState({}, '', '/info/tag/zzz/')
  render(<InfoPage today="2026-09-03" />)
  expect(document.querySelector('.article')).toBeNull()
  expect([...document.querySelectorAll('.tag-chip')].some((b) => b.className.includes('active') && b.textContent.startsWith('전체'))).toBe(true)
  window.history.pushState({}, '', '/')
})

test('태그를 고르면 주소가 태그 페이지로 바뀐다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.click([...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('동물')))
  expect(window.location.pathname).toBe('/info/tag/animal/')
  fireEvent.click([...document.querySelectorAll('.tag-chip')].find((b) => b.textContent.startsWith('전체')))
  expect(window.location.pathname).toBe('/info/')
  window.history.pushState({}, '', '/')
})

test('태그 안에 결과가 없으면 전체에서 찾기를 안내한다', () => {
  window.history.pushState({}, '', '/info/tag/life/')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: '물고기' } })
  expect(document.querySelectorAll('.info-list li')).toHaveLength(0)
  const clear = screen.getByRole('button', { name: '전체에서 찾기' })
  fireEvent.click(clear)
  expect(window.location.pathname).toBe('/info/')
  expect(document.querySelectorAll('.info-list li').length).toBeGreaterThan(0)
  window.history.pushState({}, '', '/')
})
