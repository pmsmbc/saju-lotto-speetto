import { describe, test, expect } from 'vitest'
import { ARTICLES, articleBySlug } from './articles.js'
import { mdToHtml, parseArticle } from './markdown.js'

describe('markdown', () => {
  test('제목/리스트/굵게/문단 변환', () => {
    const html = mdToHtml('## 제목\n\n- 하나 **강조**\n- 둘\n\n문단입니다')
    expect(html).toContain('<h2>제목</h2>')
    expect(html).toContain('<li>하나 <strong>강조</strong></li>')
    expect(html).toContain('<p>문단입니다</p>')
  })

  test('HTML 특수문자 이스케이프', () => {
    expect(mdToHtml('<script>x</script>')).not.toContain('<script>')
  })

  test('frontmatter 파싱', () => {
    const a = parseArticle('---\ntitle: 제목\nslug: t\norder: 3\n---\n본문')
    expect(a.title).toBe('제목')
    expect(a.order).toBe(3)
    expect(a.html).toContain('본문')
  })
})

describe('articles', () => {
  test('글이 10개 이상 로드되고 필수 필드가 있다', () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(31)
    for (const a of ARTICLES) {
      expect(a.title.length).toBeGreaterThan(3)
      expect(a.slug).toMatch(/^[a-z]+$/)
      expect(a.description.length).toBeGreaterThan(10)
      expect(a.body.length).toBeGreaterThan(300)
      expect(a.icon).toMatch(/^[0-9a-f-]+$/)
    }
  })

  test('slug가 중복되지 않고 order 순으로 정렬', () => {
    const slugs = ARTICLES.map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(ARTICLES[0].slug).toBe('pig')
  })

  test('articleBySlug', () => {
    expect(articleBySlug('snake').title).toContain('뱀꿈')
    expect(articleBySlug('nope')).toBeNull()
  })
})
