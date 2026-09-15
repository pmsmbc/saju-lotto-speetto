import { describe, test, expect } from 'vitest'
import { TAGS, tagById, parseTags, tagsWithCount } from './tags.js'

describe('TAGS', () => {
  test('id는 URL에 쓸 수 있는 소문자 영문', () => {
    for (const t of TAGS) expect(t.id).toMatch(/^[a-z]+$/)
  })
  test('id와 label이 중복되지 않는다', () => {
    expect(new Set(TAGS.map((t) => t.id)).size).toBe(TAGS.length)
    expect(new Set(TAGS.map((t) => t.label)).size).toBe(TAGS.length)
  })
  test('태그마다 설명 문장이 있다', () => {
    for (const t of TAGS) expect(t.desc.length).toBeGreaterThan(20)
  })
})

describe('tagById', () => {
  test('있는 id는 태그를, 없는 id는 null', () => {
    expect(tagById('animal').label).toBe('동물')
    expect(tagById('nope')).toBe(null)
  })
})

describe('parseTags', () => {
  test('쉼표로 나누고 공백을 없앤다', () => {
    expect(parseTags('animal, money')).toEqual(['animal', 'money'])
    expect(parseTags('animal,money')).toEqual(['animal', 'money'])
  })
  test('빈 값은 빈 배열', () => {
    expect(parseTags('')).toEqual([])
    expect(parseTags(undefined)).toEqual([])
  })
  test('모르는 태그는 버린다', () => {
    expect(parseTags('animal, 없는태그')).toEqual(['animal'])
  })
  test('중복은 한 번만', () => {
    expect(parseTags('animal, animal')).toEqual(['animal'])
  })
})

describe('tagsWithCount', () => {
  const articles = [
    { slug: 'a', tags: ['animal', 'money'] },
    { slug: 'b', tags: ['animal'] },
    { slug: 'c', tags: [] },
    { slug: 'd' },
  ]
  test('쓰인 태그만 개수와 함께 돌려준다', () => {
    expect(tagsWithCount(articles)).toEqual([
      { ...tagById('animal'), count: 2 },
      { ...tagById('money'), count: 1 },
    ])
  })
  test('TAGS에 정의된 순서를 지킨다', () => {
    const ids = tagsWithCount(articles).map((t) => t.id)
    expect(ids).toEqual(['animal', 'money'])
  })
})
