import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: '2026-07-01T00:00:00Z', rounds: [] }),
  }))
}

test('기본으로 사주 > 오늘의 운세를 보여준다', () => {
  mockFetch()
  render(<App />)
  // .fortune-iljin 위젯을 지목한다 (설명 섹션에도 '오늘의 일진'이 나온다)
  expect(document.querySelector('.fortune-iljin').textContent).toMatch(/오늘의 일진/)
})

test('대메뉴는 사주/로또/스피또/꿈해몽·상식 4개', () => {
  mockFetch()
  render(<App />)
  const labels = [...document.querySelectorAll('.nav-tab')].map((b) => b.textContent)
  expect(labels).toEqual(['사주', '로또', '스피또', '꿈해몽·상식'])
})

test('사주 대메뉴의 하위: 오늘의 운세, 궁합', () => {
  mockFetch()
  render(<App />)
  const subs = [...document.querySelectorAll('.sub-tab')].map((b) => b.textContent)
  expect(subs).toEqual(['오늘의 운세', '궁합'])
})

test('궁합 하위 탭 클릭 시 궁합 입력 화면 표시', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '궁합' }))
  expect(screen.getByText(/생년월일을 입력하면 궁합/)).toBeInTheDocument()
})

test('로또 대메뉴의 하위: 띠별/사주/로또 추천/1등 배출점, 기본은 띠별 번호', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  const subs = [...document.querySelectorAll('.sub-tab')].map((b) => b.textContent)
  expect(subs).toEqual(['띠별 번호', '사주 번호', '로또 추천', '1등 배출점'])
  // 설명 섹션에도 띠 이름이 나오므로 띠 격자를 지목한다
  expect(document.querySelector('.zodiac-grid').textContent).toContain('쥐띠')
})

test('로또 > 사주 번호 클릭 시 입력 화면 표시', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  fireEvent.click(screen.getByRole('button', { name: '사주 번호' }))
  expect(screen.getByText('생년월일')).toBeInTheDocument()
})

test('스피또 대메뉴는 하위 탭 없이 바로 당첨 지역 표시', async () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '스피또' }))
  expect(document.querySelectorAll('.sub-tab')).toHaveLength(0)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('대메뉴를 오가도 하위 선택을 기억한다', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  fireEvent.click(screen.getByRole('button', { name: '로또 추천' }))
  fireEvent.click(screen.getByRole('button', { name: '사주' }))
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  expect(screen.getByRole('button', { name: '5세트 추천받기' })).toBeInTheDocument()
})

test('/gunghap 경로로 접속하면 궁합 화면을 보여준다', () => {
  mockFetch()
  window.history.pushState({}, '', '/gunghap')
  render(<App />)
  expect(screen.getByText(/생년월일을 입력하면 궁합/)).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('탭 이동 시 주소가 바뀐다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  expect(window.location.pathname).toBe('/zodiac')
  fireEvent.click(screen.getByRole('button', { name: '로또 추천' }))
  expect(window.location.pathname).toBe('/lotto')
  window.history.pushState({}, '', '/')
})

test('꿈해몽·상식 메뉴 클릭 시 꿈해몽 글 목록 표시', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '꿈해몽·상식' }))
  expect(window.location.pathname).toBe('/info')
  expect(screen.getByText('정보 이야기')).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('/privacy 경로로 접속하면 개인정보처리방침을 보여준다', () => {
  mockFetch()
  window.history.pushState({}, '', '/privacy/')
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: '개인정보처리방침' })).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('기능 페이지마다 설명 섹션이 화면에 보인다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  // 기본 화면(오늘의 운세)
  expect(document.querySelector('.page-intro')).toBeInTheDocument()
  for (const [tab, keyword] of [['궁합', '겉궁합'], ['로또', '띠'], ['스피또', '스피또']]) {
    fireEvent.click(screen.getByRole('button', { name: tab }))
    if (keyword !== '스피또') {
      expect(document.querySelector('.page-intro'), `${tab}에 설명 섹션이 없다`).toBeInTheDocument()
    }
  }
  window.history.pushState({}, '', '/')
})

test('1등 배출점 탭으로 이동하면 주소가 바뀐다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또' }))
  fireEvent.click(screen.getByRole('button', { name: '1등 배출점' }))
  expect(window.location.pathname).toBe('/lotto-stores')
  window.history.pushState({}, '', '/')
})

test('/lotto-stores 로 들어가면 배출점 화면으로 시작한다', () => {
  mockFetch()
  window.history.pushState({}, '', '/lotto-stores')
  render(<App />)
  const subs = [...document.querySelectorAll('.sub-tab')].map((b) => b.textContent)
  expect(subs).toContain('1등 배출점')
  expect(document.querySelector('.sub-tab.active').textContent).toBe('1등 배출점')
  window.history.pushState({}, '', '/')
})
