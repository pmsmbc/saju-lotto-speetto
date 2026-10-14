import { test, expect, vi } from 'vitest'
import { spaClick } from './spa-link.js'

const ev = (over = {}) => ({ button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false, preventDefault: vi.fn(), ...over })

test('보통 클릭은 기본 이동을 막고 SPA 전환을 실행한다', () => {
  const e = ev(); const go = vi.fn()
  spaClick(e, go)
  expect(e.preventDefault).toHaveBeenCalled()
  expect(go).toHaveBeenCalled()
})

test('⌘·Ctrl·Shift·Alt 클릭과 가운데 버튼은 브라우저에 맡긴다', () => {
  for (const over of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const e = ev(over); const go = vi.fn()
    spaClick(e, go)
    expect(e.preventDefault, JSON.stringify(over)).not.toHaveBeenCalled()
    expect(go).not.toHaveBeenCalled()
  }
})

test('이미 기본 동작이 막힌 이벤트는 건드리지 않는다', () => {
  const e = ev({ defaultPrevented: true }); const go = vi.fn()
  spaClick(e, go)
  expect(go).not.toHaveBeenCalled()
})
