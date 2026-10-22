import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoPage } from './InfoPage.jsx'
import { ARTICLES } from '../lib/articles.js'
import { searchArticles } from '../lib/search.js'

test('카테고리별 글 목록을 보여준다 (기본 꿈해몽, 탭으로 상식 전환)', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  for (const a of ARTICLES.filter((x) => x.category === 'dream' && !x.noindex)) {
    expect(screen.getByText(a.title)).toBeInTheDocument()
  }
  fireEvent.click(screen.getByRole('button', { name: '사주·로또 상식' }))
  for (const a of ARTICLES.filter((x) => x.category === 'guide' && !x.noindex)) {
    expect(screen.getByText(a.title)).toBeInTheDocument()
  }
  expect(screen.queryByText('돼지꿈 해몽 — 세 가지 질문으로 가려 보는 길몽과 흉몽')).toBeNull()
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

// 꿈 글 본문은 "꿈과 당첨은 무관하다"고 말한다. 그 아래에 로또 번호를 붙이면 말과 행동이
// 어긋나고, 애드센스 심사에서 꿈해몽을 복권 유도 수단으로 보게 된다.
test('꿈 글에도 로또 행운 번호 위젯을 붙이지 않는다', () => {
  window.history.pushState({}, '', '/info/pig/')
  render(<InfoPage />)
  expect(document.querySelector('.dream-lucky')).toBeNull()
  expect(document.querySelector('.lotto-ball')).toBeNull()
  expect(document.body.textContent).not.toContain('행운 번호')
  window.history.pushState({}, '', '/')
})

test('글을 클릭하면 본문·공유 버튼을 보여주고 주소가 바뀐다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  fireEvent.click(screen.getByText('돼지꿈 해몽 — 세 가지 질문으로 가려 보는 길몽과 흉몽'))
  expect(window.location.pathname).toBe('/info/pig/')
  expect(screen.getByText(/살림이 불어나는 상징/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /공유하기/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: '← 글 목록' }))
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
  fireEvent.click(items[0].querySelector('a'))
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
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: '꿈' } })
  // 검색은 검색에서 뺀 글까지 뒤지므로 보이는 수는 늘 수 있지만, 결과는 모두 동물 태그 글이어야 한다
  const shown = [...document.querySelectorAll('.info-card')].map((a) => a.getAttribute('href').split('/')[2])
  expect(shown.length).toBeGreaterThan(0)
  for (const slug of shown) expect(ARTICLES.find((a) => a.slug === slug).tags, slug).toContain('animal')
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

// 생활 태그 글에는 없고 다른 글에는 있는 검색어. 글 내용이 바뀌어도 깨지지 않게
// 고정 낱말 대신 실제 글 제목의 첫 낱말 가운데서 고른다.
function termOutsideTag(tag) {
  const inTag = ARTICLES.filter((a) => a.tags?.includes(tag))
  return ARTICLES.filter((a) => !a.tags?.includes(tag))
    .map((a) => a.title.split(' ')[0])
    .find((w) => w.length >= 2 && searchArticles(inTag, w).length === 0)
}

test('태그 안에 결과가 없으면 전체에서 찾기를 안내한다', () => {
  const term = termOutsideTag('life')
  expect(term).toBeTruthy()
  window.history.pushState({}, '', '/info/tag/life/')
  render(<InfoPage today="2026-09-03" />)
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: term } })
  expect(document.querySelectorAll('.info-list li')).toHaveLength(0)
  const clear = screen.getByRole('button', { name: '전체에서 찾기' })
  fireEvent.click(clear)
  expect(window.location.pathname).toBe('/info/')
  expect(document.querySelectorAll('.info-list li').length).toBeGreaterThan(0)
  window.history.pushState({}, '', '/')
})

// 글 카드·태그 칩·관련 글·목록으로 가기는 모두 고유 URL이 있으므로 <a href>로 둔다.
// 버튼이면 React가 그린 DOM에서 크롤러가 글과 태그 페이지로 갈 길이 없다.
test('글 카드와 태그 칩은 href가 있는 링크다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  const cards = [...document.querySelectorAll('.info-card')]
  expect(cards.length).toBeGreaterThan(0)
  expect(cards.every((el) => el.tagName === 'A' && /^\/info\/[a-z-]+\/$/.test(el.getAttribute('href')))).toBe(true)
  const chips = [...document.querySelectorAll('.tag-chip')]
  expect(chips[0].tagName).toBe('A')
  expect(chips[0].getAttribute('href')).toBe('/info/')
  expect(chips.slice(1).every((el) => el.tagName === 'A' && /^\/info\/tag\/[a-z]+\/$/.test(el.getAttribute('href')))).toBe(true)
  window.history.pushState({}, '', '/')
})

test('글 안의 관련 글과 글 목록으로 가기는 href가 있는 링크다', () => {
  window.history.pushState({}, '', '/info/pig/')
  render(<InfoPage />)
  expect(screen.getByRole('link', { name: '← 글 목록' }).getAttribute('href')).toBe('/info/')
  const related = [...document.querySelectorAll('.related-list a')]
  expect(related).toHaveLength(3)
  expect(related.every((el) => /^\/info\/[a-z-]+\/$/.test(el.getAttribute('href')))).toBe(true)
  window.history.pushState({}, '', '/')
})

test('글 카드를 클릭하면 전체 페이지 이동 없이 글을 연다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  const card = document.querySelector('.info-card')
  expect(fireEvent.click(card)).toBe(false)
  expect(window.location.pathname).toBe(card.getAttribute('href'))
  expect(document.querySelector('.article')).toBeInTheDocument()
  window.history.pushState({}, '', '/')
})

// 누가 언제 쓴 글인지 보여야 신뢰 신호가 된다. 작성일·수정일은 frontmatter(date, updated)에서 온다.
test('글 머리에 작성일·수정일과 운영 주체(소개 페이지 링크)가 보인다', () => {
  window.history.pushState({}, '', '/info/pig/')
  render(<InfoPage />)
  const meta = document.querySelector('.article-meta')
  expect(meta).toBeInTheDocument()
  expect(meta.textContent).toContain('2026.09.03 작성')
  expect(meta.textContent).toContain('2026.10.06 수정')
  expect(meta.querySelector('a[href="/about/"]').textContent).toBe('북한산쌍문철학원')
  window.history.pushState({}, '', '/')
})

// 구글이 크롤을 거의 하지 않는 동안 크롤 요청이 검색에서 뺀 글로 새지 않게, 목록·태그·관련 글은
// 색인할 글로만 잇는다. 뺀 글은 사이트에 그대로 있고 검색창과 /info/all/ 로 찾아갈 수 있다.
const NOINDEXED = ARTICLES.filter((a) => a.noindex)
const KEPT_DREAMS = ARTICLES.filter((a) => a.category === 'dream' && !a.noindex)

test('목록에는 검색에서 뺀 글이 보이지 않고, 전체 칩도 남긴 글만 센다', () => {
  expect(NOINDEXED.length).toBeGreaterThan(0)
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  const hrefs = [...document.querySelectorAll('.info-card')].map((a) => a.getAttribute('href'))
  expect(hrefs).toHaveLength(KEPT_DREAMS.length)
  for (const a of NOINDEXED) expect(hrefs).not.toContain(`/info/${a.slug}/`)
  const all = [...document.querySelectorAll('.tag-chip')].find((c) => c.textContent.startsWith('전체'))
  expect(all.textContent).toBe(`전체 ${KEPT_DREAMS.length}`)
  window.history.pushState({}, '', '/')
})

test('목록 아래 전체 글 링크는 /info/all/ 로 가는 nofollow 링크다', () => {
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  const link = screen.getByRole('link', { name: /전체 .*편 보기/ })
  expect(link.getAttribute('href')).toBe('/info/all/')
  expect(link.getAttribute('rel')).toBe('nofollow')
  expect(fireEvent.click(link)).toBe(false)
  expect(window.location.pathname).toBe('/info/all/')
  expect(document.querySelectorAll('.info-card')).toHaveLength(ARTICLES.filter((a) => a.category === 'dream').length)
  window.history.pushState({}, '', '/')
})

test('/info/all/ 로 들어가면 검색에서 뺀 글까지 전부 보인다', () => {
  window.history.pushState({}, '', '/info/all/')
  render(<InfoPage />)
  expect(document.querySelector('.article')).toBeNull()
  const hrefs = [...document.querySelectorAll('.info-card')].map((a) => a.getAttribute('href'))
  for (const a of ARTICLES.filter((x) => x.category === 'dream')) expect(hrefs).toContain(`/info/${a.slug}/`)
  expect(screen.getByRole('link', { name: /남긴 글만 보기/ }).getAttribute('href')).toBe('/info/')
  window.history.pushState({}, '', '/')
})

test('검색은 검색에서 뺀 글도 찾는다', () => {
  const target = NOINDEXED.find((a) => a.category === 'dream')
  const word = target.title.split(' ')[0]
  window.history.pushState({}, '', '/info')
  render(<InfoPage />)
  fireEvent.change(screen.getByLabelText('글 검색'), { target: { value: word } })
  const hrefs = [...document.querySelectorAll('.info-card')].map((a) => a.getAttribute('href'))
  expect(hrefs).toContain(`/info/${target.slug}/`)
  window.history.pushState({}, '', '/')
})

test('관련 글은 검색에 남긴 글로만 잇는다', () => {
  // 순서상 바로 다음 글이 검색에서 뺀 글인 경우를 고른다
  const dreams = ARTICLES.filter((a) => a.category === 'dream')
  const before = dreams.find((a, i) => !a.noindex && dreams[i + 1]?.noindex)
  expect(before).toBeTruthy()
  window.history.pushState({}, '', `/info/${before.slug}/`)
  render(<InfoPage />)
  const hrefs = [...document.querySelectorAll('.related-list a')].map((a) => a.getAttribute('href'))
  expect(hrefs).toHaveLength(3)
  for (const a of NOINDEXED) expect(hrefs).not.toContain(`/info/${a.slug}/`)
  window.history.pushState({}, '', '/')
})
