import { test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

// 상단 메뉴·하위 탭 링크. 푸터에도 같은 이름의 링크가 있어 역할·이름으로는 둘이 잡힌다.
const navTab = (name) => [...document.querySelectorAll('.nav-tab, .sub-tab')].find((el) => el.textContent === name)

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
  fireEvent.click(navTab('궁합'))
  expect(screen.getByText(/생년월일을 입력하면 궁합/)).toBeInTheDocument()
})

test('로또 대메뉴의 하위: 띠별/사주/로또 추천/1등 배출점, 기본은 띠별 번호', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(navTab('로또'))
  const subs = [...document.querySelectorAll('.sub-tab')].map((b) => b.textContent)
  expect(subs).toEqual(['띠별 번호', '사주 번호', '로또 추천', '1등 배출점'])
  // 설명 섹션에도 띠 이름이 나오므로 띠 격자를 지목한다
  expect(document.querySelector('.zodiac-grid').textContent).toContain('쥐띠')
})

test('로또 > 사주 번호 클릭 시 입력 화면 표시', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(navTab('로또'))
  fireEvent.click(navTab('사주 번호'))
  expect(screen.getByText('생년월일')).toBeInTheDocument()
})

test('스피또 대메뉴는 하위 탭 없이 바로 당첨 지역 표시', async () => {
  mockFetch()
  render(<App />)
  fireEvent.click(navTab('스피또'))
  expect(document.querySelectorAll('.sub-tab')).toHaveLength(0)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('대메뉴를 오가도 하위 선택을 기억한다', () => {
  mockFetch()
  render(<App />)
  fireEvent.click(navTab('로또'))
  fireEvent.click(navTab('로또 추천'))
  fireEvent.click(navTab('사주'))
  fireEvent.click(navTab('로또'))
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
  fireEvent.click(navTab('로또'))
  expect(window.location.pathname).toBe('/zodiac/')
  fireEvent.click(navTab('로또 추천'))
  expect(window.location.pathname).toBe('/lotto/')
  window.history.pushState({}, '', '/')
})

test('꿈해몽·상식 메뉴 클릭 시 꿈해몽 글 목록 표시', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(navTab('꿈해몽·상식'))
  expect(window.location.pathname).toBe('/info/')
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
    fireEvent.click(navTab(tab))
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
  fireEvent.click(navTab('로또'))
  fireEvent.click(navTab('1등 배출점'))
  expect(window.location.pathname).toBe('/lotto-stores/')
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

test('앱이 주소창에 쓰는 경로는 모두 슬래시로 끝난다', () => {
  // 슬래시가 없으면 GitHub Pages가 301 하고, 구글이 "리디렉션이 포함된 페이지"로 색인에서 뺀다
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  const menus = ['사주', '로또', '스피또', '꿈해몽·상식']
  for (const menu of menus) {
    fireEvent.click(navTab(menu))
    expect(window.location.pathname, `${menu} 대메뉴 경로`).toMatch(/\/$/)
    for (const sub of [...document.querySelectorAll('.sub-tab')]) {
      fireEvent.click(sub)
      expect(window.location.pathname, `${menu} > ${sub.textContent} 경로`).toMatch(/\/$/)
    }
  }
  window.history.pushState({}, '', '/')
})

// 구글은 React가 그린 DOM에서 링크를 찾는다. 메뉴가 <button>이면 크롤러가 따라갈 수 없어
// 하위 페이지와 태그 페이지가 고아가 된다. 그래서 메뉴는 href가 있는 <a>여야 한다.
test('상단 메뉴와 하위 탭은 href가 있는 링크다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  const navs = [...document.querySelectorAll('.nav-tab')]
  expect(navs.every((el) => el.tagName === 'A')).toBe(true)
  expect(navs.map((el) => el.getAttribute('href'))).toEqual(['/unse/', '/zodiac/', '/speetto/', '/info/'])
  const subs = [...document.querySelectorAll('.sub-tab')]
  expect(subs.every((el) => el.tagName === 'A')).toBe(true)
  expect(subs.map((el) => el.getAttribute('href'))).toEqual(['/unse/', '/gunghap/'])
})

test('메뉴 링크를 클릭하면 전체 페이지 이동 없이 화면만 바꾼다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  // fireEvent.click은 preventDefault가 호출되면 false를 돌려준다
  expect(fireEvent.click(navTab('로또'))).toBe(false)
  expect(window.location.pathname).toBe('/zodiac/')
  expect(document.querySelector('.zodiac-grid')).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

test('새 탭으로 열기(⌘·Ctrl 클릭)는 브라우저에 맡긴다', () => {
  mockFetch()
  window.history.pushState({}, '', '/')
  render(<App />)
  expect(fireEvent.click(navTab('로또'), { metaKey: true })).toBe(true)
  expect(window.location.pathname).toBe('/')
})
