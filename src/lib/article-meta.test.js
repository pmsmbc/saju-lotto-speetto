import { test, expect } from 'vitest'
import { articleDates, dotDate } from './article-meta.js'

test('날짜를 점 표기로 바꾼다', () => {
  expect(dotDate('2026-09-03')).toBe('2026.09.03')
  expect(dotDate(undefined)).toBe(null)
})

test('작성일과 수정일을 나열하고, 수정일이 같거나 없으면 작성일만 쓴다', () => {
  expect(articleDates({ date: '2026-09-03', updated: '2026-10-06' })).toEqual(['2026.09.03 작성', '2026.10.06 수정'])
  expect(articleDates({ date: '2026-09-03', updated: '2026-09-03' })).toEqual(['2026.09.03 작성'])
  expect(articleDates({ date: '2026-09-03' })).toEqual(['2026.09.03 작성'])
  expect(articleDates({})).toEqual([])
})
