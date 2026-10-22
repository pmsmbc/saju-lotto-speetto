import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleDirectory } from './ArticleDirectory.jsx'
import { ARTICLES } from '../lib/articles.js'

// 홈은 구글이 가장 최근에 크롤한 페이지라, 홈 한 번 크롤로 검색에 남긴 글 전부를 발견하게 한다.
test('검색에 남긴 글 전부로 가는 링크가 있고, 검색에서 뺀 글로는 링크하지 않는다', () => {
  render(<ArticleDirectory />)
  const hrefs = [...document.querySelectorAll('.article-directory a')].map((a) => a.getAttribute('href'))
  for (const a of ARTICLES.filter((x) => !x.noindex)) expect(hrefs, a.slug).toContain(`/info/${a.slug}/`)
  for (const a of ARTICLES.filter((x) => x.noindex)) expect(hrefs, a.slug).not.toContain(`/info/${a.slug}/`)
})

test('주제별 소제목 아래 짧은 이름으로 묶어 보여준다', () => {
  render(<ArticleDirectory />)
  expect(screen.getByRole('heading', { level: 2, name: /글 모아보기/ })).toBeInTheDocument()
  const h3s = [...document.querySelectorAll('.article-directory h3')].map((h) => h.textContent)
  expect(h3s.some((t) => t.startsWith('동물'))).toBe(true)
  expect(h3s.at(-1)).toMatch(/^사주·로또 상식/)
  const pig = document.querySelector('.article-directory a[href="/info/pig/"]')
  expect(pig.textContent).toBe('돼지꿈')
  expect(pig.getAttribute('title')).toContain('돼지꿈 해몽')
})
