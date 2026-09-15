import { describe, test, expect } from 'vitest'
import { normalize, searchArticles } from './search.js'

const articles = [
  { slug: 'pig', title: '돼지꿈 해몽', description: '재물의 상징', body: '돼지가 나오면', order: 1 },
  { slug: 'fish', title: '물고기꿈 해몽', description: '잡을수록 좋은 재물꿈', body: '잉어를 잡으면', order: 2 },
  { slug: 'water', title: '물꿈 해몽', description: '맑은 물과 흐린 물', body: '돼지 이야기도 잠깐 나온다', order: 3 },
]

describe('normalize', () => {
  test('공백을 없애고 소문자로 만든다', () => {
    expect(normalize(' 돼지 꿈 ')).toBe('돼지꿈')
    expect(normalize('ABC')).toBe('abc')
  })
  test('빈 값도 안전하다', () => {
    expect(normalize(null)).toBe('')
    expect(normalize(undefined)).toBe('')
  })
})

describe('searchArticles', () => {
  test('검색어가 없으면 원래 목록 그대로', () => {
    expect(searchArticles(articles, '')).toBe(articles)
    expect(searchArticles(articles, '   ')).toBe(articles)
  })
  test('제목으로 찾는다', () => {
    expect(searchArticles(articles, '물고기').map((a) => a.slug)).toEqual(['fish'])
  })
  test('띄어쓰기가 달라도 찾는다', () => {
    expect(searchArticles(articles, '돼지 꿈').map((a) => a.slug)).toEqual(['pig'])
  })
  test('제목 > 설명 > 본문 순으로 정렬한다', () => {
    // '돼지'는 pig 제목, water 본문에 있다
    expect(searchArticles(articles, '돼지').map((a) => a.slug)).toEqual(['pig', 'water'])
  })
  test('설명에만 있어도 찾는다', () => {
    expect(searchArticles(articles, '맑은물').map((a) => a.slug)).toEqual(['water'])
  })
  test('맞는 글이 없으면 빈 배열', () => {
    expect(searchArticles(articles, '없는말')).toEqual([])
  })
  test('같은 점수면 order 순서를 지킨다', () => {
    // '해몽'은 셋 다 제목에 있다
    expect(searchArticles(articles, '해몽').map((a) => a.slug)).toEqual(['pig', 'fish', 'water'])
  })
  test('body가 없으면 html로 훑는다', () => {
    const only = [{ slug: 'x', title: 'ㄱ', description: 'ㄴ', html: '<p>고양이</p>', order: 1 }]
    expect(searchArticles(only, '고양이').map((a) => a.slug)).toEqual(['x'])
  })
})
