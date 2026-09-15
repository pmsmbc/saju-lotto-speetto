import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageIntro } from './PageIntro.jsx'
import { PAGE_CONTENT } from '../lib/page-content.js'

test('제목과 본문을 보여준다', () => {
  render(<PageIntro id="unse" />)
  expect(screen.getByText(PAGE_CONTENT.unse.heading)).toBeInTheDocument()
  expect(document.querySelector('.article-body').textContent).toContain('일진')
})

test('모르는 id면 아무것도 그리지 않는다', () => {
  const { container } = render(<PageIntro id="nope" />)
  expect(container).toBeEmptyDOMElement()
})

test('모든 기능 페이지 설명에 제목·본문·내부 링크가 있다', () => {
  for (const [id, c] of Object.entries(PAGE_CONTENT)) {
    expect(c.heading.length).toBeGreaterThan(4)
    const text = c.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    expect(text.length, `${id} 본문이 너무 짧다`).toBeGreaterThan(400)
    expect(c.html, `${id}에 내부 링크가 없다`).toMatch(/href="\/[a-z]/)
  }
})
