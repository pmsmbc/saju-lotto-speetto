import { describe, test, expect } from 'vitest'
import { mdToHtml, parseArticle } from './markdown.js'

describe('mdToHtml 기본', () => {
  test('문단은 p로 감싼다', () => {
    expect(mdToHtml('안녕하세요')).toBe('<p>안녕하세요</p>')
  })
  test('한 문단 안의 줄바꿈은 br', () => {
    expect(mdToHtml('첫 줄\n둘째 줄')).toBe('<p>첫 줄<br />둘째 줄</p>')
  })
  test('## 는 h2, ### 는 h3', () => {
    expect(mdToHtml('## 제목')).toBe('<h2>제목</h2>')
    expect(mdToHtml('### 소제목')).toBe('<h3>소제목</h3>')
  })
  test('- 로 시작하는 블록은 ul', () => {
    expect(mdToHtml('- 하나\n- 둘')).toBe('<ul><li>하나</li><li>둘</li></ul>')
  })
  test('**굵게**는 strong', () => {
    expect(mdToHtml('이건 **중요**합니다')).toBe('<p>이건 <strong>중요</strong>합니다</p>')
  })
  test('HTML 특수문자는 이스케이프한다', () => {
    expect(mdToHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })
})

describe('내부 링크', () => {
  test('[글자](/경로/) 는 a 태그로 변환된다', () => {
    expect(mdToHtml('[뱀꿈](/info/snake/)을 보세요')).toBe('<p><a href="/info/snake/">뱀꿈</a>을 보세요</p>')
  })
  test('목록 안에서도 링크가 된다', () => {
    expect(mdToHtml('- [돼지꿈](/info/pig/) — 재물')).toContain('<a href="/info/pig/">돼지꿈</a>')
  })
  test('외부 URL과 javascript: 는 링크로 만들지 않는다', () => {
    expect(mdToHtml('[a](https://evil.com)')).not.toContain('<a ')
    expect(mdToHtml('[a](javascript:alert(1))')).not.toContain('<a ')
  })
  test('굵게와 함께 써도 된다', () => {
    expect(mdToHtml('**[용꿈](/info/dragon/)**')).toBe('<p><strong><a href="/info/dragon/">용꿈</a></strong></p>')
  })
})

describe('parseArticle', () => {
  const raw = `---
title: 제목
slug: test
order: 3
---
본문입니다.`
  test('frontmatter와 본문을 분리한다', () => {
    const a = parseArticle(raw)
    expect(a.title).toBe('제목')
    expect(a.slug).toBe('test')
    expect(a.order).toBe(3)
    expect(a.html).toBe('<p>본문입니다.</p>')
  })
  test('frontmatter가 없으면 null', () => {
    expect(parseArticle('그냥 글')).toBe(null)
  })
  test('order가 없으면 999', () => {
    expect(parseArticle('---\ntitle: a\n---\n본문').order).toBe(999)
  })
})
