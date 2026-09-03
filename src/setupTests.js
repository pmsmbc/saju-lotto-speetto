import '@testing-library/jest-dom'

// Node 내장 localStorage 스텁이 jsdom 것을 가리는 경우 메모리 구현으로 대체
if (typeof globalThis.localStorage?.clear !== 'function') {
  const store = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(String(k), String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
      key: (i) => [...store.keys()][i] ?? null,
      get length() { return store.size },
    },
  })
}

// jsdom의 window.scrollTo 미구현 소음 제거
window.scrollTo = () => {}
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {})
