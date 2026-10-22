import { describe, test, expect } from 'vitest'
import { directoryGroups, shortName } from './directory.js'

const sample = [
  { slug: 'pig', title: '돼지꿈 해몽 — 길몽', category: 'dream', tags: ['animal', 'money'], order: 1 },
  { slug: 'poop', title: '똥꿈 해몽 — 재물', category: 'dream', tags: ['money'], order: 2 },
  { slug: 'affair', title: '바람피우는 꿈 해몽', category: 'dream', tags: ['people'], order: 3, noindex: true },
  { slug: 'teeth', title: '이빨 빠지는 꿈 — 위치별', category: 'dream', tags: ['body'], order: 4 },
  { slug: 'odds', title: '로또 당첨 확률 — 계산', category: 'guide', tags: [], order: 101 },
  { slug: 'tax', title: '로또 세금 — 33%', category: 'guide', tags: [], order: 102, noindex: true },
]

describe('directoryGroups', () => {
  const groups = directoryGroups(sample)
  const ids = groups.map((g) => g.id)

  test('첫 태그 기준으로 TAGS 순서대로 묶고, 상식 글은 맨 뒤에 둔다', () => {
    expect(ids).toEqual(['animal', 'money', 'body', 'guide'])
  })
  test('검색에서 뺀 글(noindex)은 어느 묶음에도 넣지 않는다', () => {
    const slugs = groups.flatMap((g) => g.items.map((a) => a.slug))
    expect(slugs).not.toContain('affair')
    expect(slugs).not.toContain('tax')
  })
  test('글 하나는 한 묶음에만 들어간다 (돼지꿈은 animal에만)', () => {
    const slugs = groups.flatMap((g) => g.items.map((a) => a.slug))
    expect(slugs).toEqual(['pig', 'poop', 'teeth', 'odds'])
  })
  test('묶음마다 화면용 이름이 있다', () => {
    expect(groups.find((g) => g.id === 'animal').label).toBe('동물')
    expect(groups.find((g) => g.id === 'guide').label).toBe('사주·로또 상식')
  })
  test('글이 하나도 없으면 빈 배열', () => {
    expect(directoryGroups([])).toEqual([])
  })
})

test('shortName은 제목에서 소재 이름만 뽑는다', () => {
  expect(shortName('돼지꿈 해몽 — 세 가지 질문')).toBe('돼지꿈')
  expect(shortName('이빨 빠지는 꿈 — 정말 나쁜 꿈일까')).toBe('이빨 빠지는 꿈')
  expect(shortName('로또 당첨 확률 — 계산')).toBe('로또 당첨 확률')
})
