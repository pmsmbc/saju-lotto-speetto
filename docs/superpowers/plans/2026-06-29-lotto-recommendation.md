# 로또 번호 추천 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동행복권 로또 전회차 당첨번호로 번호별 출현 빈도표를 주간 수집해 JSON으로 저장하고, 정적 React 사이트에서 "랜덤 추천"과 "통계 기반(빈도 가중) 추천"을 5세트씩 보여준다.

**Architecture:** Node 스크래퍼(주 1회 GitHub Action)가 로또 API를 페이징하며 전 회차를 모아 빈도표를 계산해 `public/data/lotto-stats.json`을 생성한다. React 앱은 그 작은 JSON을 읽어 브라우저에서 추첨한다(랜덤은 데이터 불필요, 통계는 빈도 가중). 기존 스피또 기능과 같은 패턴/도구를 따른다.

**Tech Stack:** Node 20, Vite 5, React 18, Vitest + @testing-library/react (jsdom), GitHub Actions, GitHub Pages. (기존 프로젝트에 추가)

## Global Constraints

- 기존 프로젝트(스피또 기능 완성본)에 **추가**한다. 도구/패턴은 기존을 따른다: Vite 5, React 18, Vitest, 상태 기반 탭(라우터 없음), 가벼운 CSS(App.css).
- ES 모듈(`"type": "module"`). Node 20 (스크래퍼는 내장 `fetch`).
- 데이터 fetch 경로: `` `${import.meta.env.BASE_URL}data/lotto-stats.json` `` (Vite base `'./'`).
- 로또 풀: 번호 **1~45**, 한 세트 **6개**, 추천 세트 수 **5**.
- 번호 공 색상(번호대별): 1–10 `yellow`, 11–20 `blue`, 21–30 `red`, 31–40 `gray`, 41–45 `green`.
- 동행복권 로또 API (모두 GET, 헤더: `User-Agent` 브라우저 문자열 + `X-Requested-With: XMLHttpRequest` + `Referer: https://www.dhlottery.co.kr/lt645/result` + 세션 `Cookie`; 쿠키는 먼저 `GET /lt645/result`로 획득):
  - 최신 회차: `/lt645/selectLtEpsdInfo.do?ltGmTypeCd=lt645` → `{data:{list:[{ltEpsd:Number, ltRflYmd, ...}]}}`
  - 당첨번호(시작): `/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=<N>`
  - 당첨번호(과거 페이징): `/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=<가장오래된회차>`
  - 각 항목 필드: `ltEpsd`(회차), `tm1WnNo`..`tm6WnNo`(당첨번호 6개), `bnsWnNo`(보너스), `ltRflYmd`(YYYYMMDD).
- `lotto-stats.json` 형식: `{ updatedAt:ISO, latestRound:Number, latestDraw:{round,numbers:[6 asc],bonus,date:"YYYY-MM-DD"}, totalDraws:Number, frequencies:{ "1":n, ..., "45":n } }`. `frequencies` 값은 해당 번호가 당첨번호(보너스 제외)로 나온 누적 횟수, 합계 = `totalDraws*6`.
- 통계 추천/지난회차/hot·cold는 stats가 있을 때만. **랜덤 추천은 stats 없이도 항상 동작.**
- 커밋 메시지 끝에: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- 작업 브랜치: `feature/lotto` (이미 생성됨). 브랜치 전환 금지.

---

### Task 1: 추천 로직 라이브러리 (`src/lib/lotto.js`)

번호 추천의 순수 함수들을 RNG 주입식으로 TDD한다.

**Files:**
- Create: `src/lib/lotto.js`
- Test: `src/lib/lotto.test.js`

**Interfaces:**
- Produces:
  - `randomSet(rng=Math.random) → number[6]` — 1~45 균등 무작위, 서로 다른 6개, 오름차순.
  - `weightedSet(frequencies, rng=Math.random) → number[6]` — 빈도 비례 비복원 추출 6개, 오름차순. `frequencies`는 `{ "1":n,... }` 객체 또는 배열. 모든 가중치 0이면 균등으로 폴백.
  - `recommendSets({ count, mode, frequencies, rng=Math.random }) → number[][]` — `mode` `'random'|'weighted'`, `count`세트.
  - `hotCold(frequencies, n) → { hot:number[], cold:number[] }` — 빈도 상위/하위 n개(동률 시 번호 오름차순).
  - 상수 export: `POOL_MIN=1`, `POOL_MAX=45`, `SET_SIZE=6`.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/lib/lotto.test.js`)**

```js
import { describe, test, expect } from 'vitest'
import {
  randomSet, weightedSet, recommendSets, hotCold,
  POOL_MIN, POOL_MAX, SET_SIZE,
} from './lotto.js'

// 결정적 RNG: 주어진 값들을 순환 반환
function seqRng(values) {
  let i = 0
  return () => values[i++ % values.length]
}

function isValidSet(s) {
  return (
    Array.isArray(s) &&
    s.length === SET_SIZE &&
    new Set(s).size === SET_SIZE &&
    s.every((n) => Number.isInteger(n) && n >= POOL_MIN && n <= POOL_MAX) &&
    s.every((n, i) => i === 0 || s[i - 1] < n)
  )
}

describe('randomSet', () => {
  test('항상 1~45 범위의 서로 다른 6개를 오름차순으로 반환', () => {
    const rng = seqRng([0.01, 0.5, 0.99, 0.2, 0.7, 0.4, 0.3, 0.9, 0.1, 0.6])
    const s = randomSet(rng)
    expect(isValidSet(s)).toBe(true)
  })
  test('같은 rng 시퀀스는 같은 결과(결정적)', () => {
    const a = randomSet(seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]))
    const b = randomSet(seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]))
    expect(a).toEqual(b)
  })
})

describe('weightedSet', () => {
  test('가중치가 0인 번호는 뽑지 않는다 (6개만 양수면 그 6개)', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = 0
    for (const n of [1, 2, 3, 4, 5, 6]) freq[n] = 100
    const s = weightedSet(freq, seqRng([0.05, 0.05, 0.05, 0.05, 0.05, 0.05]))
    expect(s).toEqual([1, 2, 3, 4, 5, 6])
  })
  test('모든 가중치 0이면 균등 폴백으로도 유효한 세트', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = 0
    const s = weightedSet(freq, seqRng([0.01, 0.5, 0.99, 0.2, 0.7, 0.4]))
    expect(isValidSet(s)).toBe(true)
  })
})

describe('recommendSets', () => {
  test('count개의 유효한 세트를 만든다 (random)', () => {
    const sets = recommendSets({ count: 5, mode: 'random', rng: Math.random })
    expect(sets).toHaveLength(5)
    expect(sets.every(isValidSet)).toBe(true)
  })
  test('weighted 모드는 frequencies를 사용', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = n // 큰 번호일수록 가중치 큼
    const sets = recommendSets({ count: 3, mode: 'weighted', frequencies: freq, rng: Math.random })
    expect(sets).toHaveLength(3)
    expect(sets.every(isValidSet)).toBe(true)
  })
})

describe('hotCold', () => {
  test('빈도 상위/하위 n개', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = 0
    freq[10] = 50; freq[20] = 40; freq[30] = 30 // 핫
    freq[1] = 1; freq[2] = 2; freq[3] = 3       // 콜드(낮은 양수) — 0인 번호가 더 많아 하위는 0짜리들
    const { hot, cold } = hotCold(freq, 3)
    expect(hot).toEqual([10, 20, 30])
    // 0인 번호가 다수 → 하위 3개는 가장 작은 번호의 0짜리들
    expect(cold).toEqual([4, 5, 6])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/lotto.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/lib/lotto.js`)**

```js
export const POOL_MIN = 1
export const POOL_MAX = 45
export const SET_SIZE = 6

function poolNumbers() {
  const arr = []
  for (let n = POOL_MIN; n <= POOL_MAX; n++) arr.push(n)
  return arr
}

function freqWeight(frequencies, n) {
  if (!frequencies) return 0
  const v = Array.isArray(frequencies) ? frequencies[n] : frequencies[n] ?? frequencies[String(n)]
  const num = Number(v)
  return Number.isFinite(num) && num > 0 ? num : 0
}

export function randomSet(rng = Math.random) {
  const pool = poolNumbers()
  // 부분 Fisher-Yates
  for (let i = pool.length - 1; i > pool.length - 1 - SET_SIZE; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = pool[i]
    pool[i] = pool[j]
    pool[j] = t
  }
  return pool.slice(pool.length - SET_SIZE).sort((a, b) => a - b)
}

export function weightedSet(frequencies, rng = Math.random) {
  let pool = poolNumbers().map((n) => ({ n, w: freqWeight(frequencies, n) }))
  const picked = []
  for (let k = 0; k < SET_SIZE; k++) {
    const total = pool.reduce((s, c) => s + c.w, 0)
    let idx
    if (total <= 0) {
      idx = Math.floor(rng() * pool.length)
    } else {
      let r = rng() * total
      idx = 0
      while (idx < pool.length - 1) {
        r -= pool[idx].w
        if (r < 0) break
        idx++
      }
    }
    picked.push(pool[idx].n)
    pool = pool.slice(0, idx).concat(pool.slice(idx + 1))
  }
  return picked.sort((a, b) => a - b)
}

export function recommendSets({ count, mode, frequencies, rng = Math.random }) {
  const make = mode === 'weighted' ? () => weightedSet(frequencies, rng) : () => randomSet(rng)
  const sets = []
  for (let i = 0; i < count; i++) sets.push(make())
  return sets
}

export function hotCold(frequencies, n) {
  const entries = poolNumbers().map((num) => ({ num, w: freqWeight(frequencies, num) }))
  const hot = [...entries].sort((a, b) => b.w - a.w || a.num - b.num).slice(0, n).map((e) => e.num)
  const cold = [...entries].sort((a, b) => a.w - b.w || a.num - b.num).slice(0, n).map((e) => e.num)
  return { hot, cold }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/lotto.test.js`
Expected: PASS (모든 케이스).

주의: `weightedSet`의 0-가중치 테스트는 `seqRng`가 0.05를 반환 → 매 단계 `total`의 5% 지점 = 항상 가장 작은 양수 번호부터 선택되어 `[1,2,3,4,5,6]`이 된다. `randomSet`은 불변식만 검증한다.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/lotto.js src/lib/lotto.test.js
git commit -m "feat: add lotto number recommendation helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 데이터 로딩 훅 (`src/hooks/useLottoStats.js`)

`lotto-stats.json`을 fetch하는 훅. 스피또의 `useSpeettoData`와 동일 패턴.

**Files:**
- Create: `src/hooks/useLottoStats.js`
- Test: `src/hooks/useLottoStats.test.js`

**Interfaces:**
- Produces: `useLottoStats() → { loading:boolean, error:string|null, stats:object|null }`
  - fetch 경로: `` `${import.meta.env.BASE_URL}data/lotto-stats.json` ``
  - 성공: `loading=false, error=null, stats=<data>`
  - 실패(네트워크/!ok): `loading=false, error='통계 데이터를 불러올 수 없습니다', stats=null`

- [ ] **Step 1: 실패하는 테스트 작성 (`src/hooks/useLottoStats.test.js`)**

```js
import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLottoStats } from './useLottoStats.js'

describe('useLottoStats', () => {
  afterEach(() => vi.restoreAllMocks())

  test('성공 시 stats 반환', async () => {
    const data = { latestRound: 1230, totalDraws: 1230, frequencies: { 1: 10 } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
    const { result } = renderHook(() => useLottoStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats).toEqual(data)
    expect(result.current.error).toBeNull()
  })

  test('실패 시 에러 메시지, stats=null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useLottoStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('통계 데이터를 불러올 수 없습니다')
    expect(result.current.stats).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/hooks/useLottoStats.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/hooks/useLottoStats.js`)**

```js
import { useEffect, useState } from 'react'

export function useLottoStats() {
  const [state, setState] = useState({ loading: true, error: null, stats: null })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/lotto-stats.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, stats: data })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: '통계 데이터를 불러올 수 없습니다', stats: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/hooks/useLottoStats.test.js`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useLottoStats.js src/hooks/useLottoStats.test.js
git commit -m "feat: add useLottoStats fetch hook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: LottoBall 컴포넌트 (`src/components/LottoBall.jsx`)

번호 공 1개. 번호대별 색상 클래스를 붙인다.

**Files:**
- Create: `src/components/LottoBall.jsx`
- Test: `src/components/LottoBall.test.jsx`

**Interfaces:**
- Produces: `<LottoBall number={n} />` — `<span class="lotto-ball ball-<color>">n</span>`.
  - 색: 1–10 yellow, 11–20 blue, 21–30 red, 31–40 gray, 41–45 green.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/components/LottoBall.test.jsx`)**

```jsx
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LottoBall } from './LottoBall.jsx'

test('번호를 표시한다', () => {
  render(<LottoBall number={7} />)
  expect(screen.getByText('7')).toBeInTheDocument()
})

test('번호대별 색상 클래스', () => {
  const cases = [
    [5, 'ball-yellow'],
    [15, 'ball-blue'],
    [25, 'ball-red'],
    [35, 'ball-gray'],
    [45, 'ball-green'],
  ]
  for (const [n, cls] of cases) {
    const { container, unmount } = render(<LottoBall number={n} />)
    expect(container.querySelector('.lotto-ball')).toHaveClass(cls)
    unmount()
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/LottoBall.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/components/LottoBall.jsx`)**

```jsx
function ballColor(n) {
  if (n <= 10) return 'yellow'
  if (n <= 20) return 'blue'
  if (n <= 30) return 'red'
  if (n <= 40) return 'gray'
  return 'green'
}

export function LottoBall({ number }) {
  return <span className={`lotto-ball ball-${ballColor(number)}`}>{number}</span>
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/LottoBall.test.jsx`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/LottoBall.jsx src/components/LottoBall.test.jsx
git commit -m "feat: add LottoBall component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: NumberSet 컴포넌트 (`src/components/NumberSet.jsx`)

공 6개 한 세트(선택적 라벨).

**Files:**
- Create: `src/components/NumberSet.jsx`
- Test: `src/components/NumberSet.test.jsx`

**Interfaces:**
- Consumes: `LottoBall`.
- Produces: `<NumberSet label="A" numbers={number[]} />` — 라벨(있으면) + 공들.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/components/NumberSet.test.jsx`)**

```jsx
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NumberSet } from './NumberSet.jsx'

test('라벨과 6개 번호를 렌더링', () => {
  const { container } = render(<NumberSet label="A" numbers={[1, 11, 21, 31, 41, 45]} />)
  expect(screen.getByText('A')).toBeInTheDocument()
  expect(container.querySelectorAll('.lotto-ball')).toHaveLength(6)
  expect(screen.getByText('11')).toBeInTheDocument()
})

test('라벨 없으면 공만', () => {
  const { container } = render(<NumberSet numbers={[1, 2, 3, 4, 5, 6]} />)
  expect(container.querySelectorAll('.lotto-ball')).toHaveLength(6)
  expect(container.querySelector('.set-label')).toBeNull()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/NumberSet.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/components/NumberSet.jsx`)**

```jsx
import { LottoBall } from './LottoBall.jsx'

export function NumberSet({ label, numbers }) {
  return (
    <div className="number-set">
      {label ? <span className="set-label">{label}</span> : null}
      <div className="set-balls">
        {numbers.map((n) => (
          <LottoBall key={n} number={n} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/NumberSet.test.jsx`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/NumberSet.jsx src/components/NumberSet.test.jsx
git commit -m "feat: add NumberSet component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: LottoPage 조립 + App 탭 연결 + CSS

훅·추천 로직·컴포넌트를 묶어 페이지를 만들고, App의 `lotto` 탭을 연결하며, 로또 관련 CSS를 추가한다.

**Files:**
- Create: `src/pages/LottoPage.jsx`
- Test: `src/pages/LottoPage.test.jsx`
- Modify: `src/App.jsx` (lotto 탭 렌더 연결)
- Modify: `src/App.test.jsx` (준비중 검증 탭을 lotto → 띠별로 변경)
- Modify: `src/App.css` (로또 공/세트 스타일 추가)

**Interfaces:**
- Consumes: `useLottoStats`, `recommendSets`, `hotCold` (from `../lib/lotto.js`), `NumberSet`, `LottoBall`.
- Produces: `LottoPage` (named + default export), props 없음.
- 동작:
  - 버튼 **[랜덤 추천 5세트]** — 항상 활성. 클릭 시 `recommendSets({count:5, mode:'random'})` → 5세트 표시(라벨 A~E).
  - 버튼 **[통계 기반 추천 5세트]** — `stats`가 있을 때만 활성(없으면 `disabled`). 클릭 시 `recommendSets({count:5, mode:'weighted', frequencies: stats.frequencies})`.
  - `stats` 있으면 상단에 "지난 N회 당첨번호"(`latestDraw.numbers` 6개 + 보너스 공) + "자주 나온 번호 / 안 나온 번호"(`hotCold(stats.frequencies, 5)`).
  - 로딩 중에는 통계 버튼 `disabled`, "통계 불러오는 중..." 표시. 에러여도 랜덤은 동작.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/pages/LottoPage.test.jsx`)**

```jsx
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LottoPage } from './LottoPage.jsx'

const stats = {
  latestRound: 1230,
  latestDraw: { round: 1230, numbers: [3, 8, 9, 22, 28, 42], bonus: 45, date: '2026-06-27' },
  totalDraws: 1230,
  frequencies: (() => { const f = {}; for (let n = 1; n <= 45; n++) f[n] = n; return f })(),
}

afterEach(() => vi.restoreAllMocks())

test('랜덤 추천은 통계 로딩 실패와 무관하게 5세트를 만든다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<LottoPage />)
  await waitFor(() => expect(screen.getByRole('button', { name: /랜덤 추천/ })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: /랜덤 추천/ }))
  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})

test('통계 데이터 없으면 통계 버튼 비활성', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<LottoPage />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /통계 기반 추천/ })).toBeDisabled(),
  )
})

test('통계 로드 시 지난 회차 표시 + 통계 버튼 활성 + 클릭 시 5세트', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
  render(<LottoPage />)
  await waitFor(() => expect(screen.getByText(/지난 1230회/)).toBeInTheDocument())
  const btn = screen.getByRole('button', { name: /통계 기반 추천/ })
  expect(btn).toBeEnabled()
  fireEvent.click(btn)
  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/pages/LottoPage.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/pages/LottoPage.jsx`)**

```jsx
import { useState } from 'react'
import { useLottoStats } from '../hooks/useLottoStats.js'
import { recommendSets, hotCold } from '../lib/lotto.js'
import { NumberSet } from '../components/NumberSet.jsx'
import { LottoBall } from '../components/LottoBall.jsx'

const SET_LABELS = ['A', 'B', 'C', 'D', 'E']

export function LottoPage() {
  const { loading, error, stats } = useLottoStats()
  const [sets, setSets] = useState([])

  const recommend = (mode) => {
    setSets(
      recommendSets({
        count: 5,
        mode,
        frequencies: stats ? stats.frequencies : null,
      }),
    )
  }

  const hc = stats ? hotCold(stats.frequencies, 5) : null

  return (
    <section className="lotto-page">
      {stats && stats.latestDraw ? (
        <div className="latest-draw">
          <h2>지난 {stats.latestRound}회 당첨번호</h2>
          <div className="latest-balls">
            <NumberSet numbers={stats.latestDraw.numbers} />
            <span className="plus">+</span>
            <LottoBall number={stats.latestDraw.bonus} />
          </div>
        </div>
      ) : null}

      <div className="lotto-actions">
        <button type="button" onClick={() => recommend('random')}>
          랜덤 추천 5세트
        </button>
        <button type="button" onClick={() => recommend('weighted')} disabled={!stats}>
          통계 기반 추천 5세트
        </button>
      </div>
      {loading ? <p className="status">통계 불러오는 중...</p> : null}
      {error ? <p className="hint">{error} (랜덤 추천은 사용할 수 있어요)</p> : null}

      {sets.length > 0 ? (
        <div className="lotto-sets">
          {sets.map((s, i) => (
            <NumberSet key={i} label={SET_LABELS[i]} numbers={s} />
          ))}
        </div>
      ) : null}

      {hc ? (
        <div className="hotcold">
          <div>
            <h3>자주 나온 번호</h3>
            <div className="set-balls">
              {hc.hot.map((n) => (
                <LottoBall key={n} number={n} />
              ))}
            </div>
          </div>
          <div>
            <h3>안 나온 번호</h3>
            <div className="set-balls">
              {hc.cold.map((n) => (
                <LottoBall key={n} number={n} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default LottoPage
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/pages/LottoPage.test.jsx`
Expected: PASS (3 케이스).

- [ ] **Step 5: App에 lotto 탭 연결 (`src/App.jsx`)**

기존 main 렌더 부분을 찾는다:
```jsx
      <main className="app-main">
        {tab === 'speetto' ? <SpeettoPage /> : <p className="status">준비중입니다</p>}
      </main>
```
다음으로 교체:
```jsx
      <main className="app-main">
        {tab === 'speetto' && <SpeettoPage />}
        {tab === 'lotto' && <LottoPage />}
        {tab !== 'speetto' && tab !== 'lotto' && <p className="status">준비중입니다</p>}
      </main>
```
그리고 import 추가 (기존 `import SpeettoPage ...` 아래):
```jsx
import LottoPage from './pages/LottoPage.jsx'
```

- [ ] **Step 6: App 테스트의 준비중 검증 탭 변경 (`src/App.test.jsx`)**

기존 테스트는 "로또 번호 추천" 클릭 시 "준비중입니다"를 기대한다 — 이제 로또는 페이지가 뜨므로 깨진다. 해당 테스트에서 클릭 대상을 아직 준비중인 탭으로 바꾼다:
```jsx
  fireEvent.click(screen.getByRole('button', { name: '오늘의 띠별 번호' }))
  expect(screen.getByText('준비중입니다')).toBeInTheDocument()
```
(기존 `name: '로또 번호 추천'` 한 줄만 위처럼 변경. 나머지 테스트는 그대로.)

- [ ] **Step 7: 로또 CSS 추가 (`src/App.css` 끝에 append)**

```css
/* --- Lotto --- */
.lotto-page h2 { font-size: 16px; margin: 8px 0 10px; }
.lotto-page h3 { font-size: 14px; margin: 8px 0 6px; color: #4a5568; }
.lotto-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.lotto-actions button { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: 8px; padding: 10px 14px; font-size: 14px; cursor: pointer; }
.lotto-actions button:disabled { background: #cbd5e0; border-color: #cbd5e0; cursor: not-allowed; }
.lotto-sets { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.number-set { display: flex; align-items: center; gap: 8px; }
.set-label { width: 18px; font-weight: 700; color: #718096; }
.set-balls { display: flex; flex-wrap: wrap; gap: 6px; }
.lotto-ball { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; font-size: 13px; font-weight: 700; color: #1a202c; }
.ball-yellow { background: #fbc400; }
.ball-blue { background: #69c8f2; }
.ball-red { background: #ff7272; color: #fff; }
.ball-gray { background: #aaaaaa; color: #fff; }
.ball-green { background: #b0d840; }
.latest-draw { margin-bottom: 12px; }
.latest-balls { display: flex; align-items: center; gap: 8px; }
.plus { font-weight: 700; color: #718096; }
.hotcold { display: flex; gap: 24px; margin-top: 20px; flex-wrap: wrap; }
.hint { color: #c05621; font-size: 13px; }
```

- [ ] **Step 8: 전체 테스트 + 빌드 확인**

Run: `npm test && npm run build`
Expected: 모든 테스트 PASS(로또 페이지/훅/컴포넌트/라이브러리 포함, App 테스트 갱신됨), `dist/` 생성.

- [ ] **Step 9: 커밋**

```bash
git add src/pages/LottoPage.jsx src/pages/LottoPage.test.jsx src/App.jsx src/App.test.jsx src/App.css
git commit -m "feat: add LottoPage and wire lotto tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 로또 응답 정규화 순수 함수 (`scripts/lotto-normalize.js`)

API 응답을 회차/번호로 바꾸고 빈도표·통계를 만드는 순수 함수를 TDD한다.

**Files:**
- Create: `scripts/lotto-normalize.js`
- Test: `scripts/lotto-normalize.test.js`

**Interfaces:**
- Produces:
  - `parseDraw(item) → { round, numbers:number[6] asc, bonus, date:"YYYY-MM-DD" }`.
  - `computeFrequencies(draws) → { 1:n, ..., 45:n }` (모든 1~45 키 존재, 0 포함).
  - `buildStats(draws) → { latestRound, latestDraw|null, totalDraws, frequencies }`.
  - `isCompleteLottoStats(stats) → boolean` — `totalDraws>0`, 1~45 모두 유한수, 합계 `=== totalDraws*6`.

- [ ] **Step 1: 실패하는 테스트 작성 (`scripts/lotto-normalize.test.js`)**

```js
import { describe, test, expect } from 'vitest'
import { parseDraw, computeFrequencies, buildStats, isCompleteLottoStats } from './lotto-normalize.js'

const item1230 = { ltEpsd: 1230, tm1WnNo: 42, tm2WnNo: 3, tm3WnNo: 28, tm4WnNo: 9, tm5WnNo: 8, tm6WnNo: 22, bnsWnNo: 45, ltRflYmd: '20260627' }
const item1229 = { ltEpsd: 1229, tm1WnNo: 12, tm2WnNo: 13, tm3WnNo: 29, tm4WnNo: 34, tm5WnNo: 37, tm6WnNo: 42, bnsWnNo: 16, ltRflYmd: '20260620' }

describe('parseDraw', () => {
  test('번호를 오름차순 정렬하고 날짜를 포맷', () => {
    expect(parseDraw(item1230)).toEqual({
      round: 1230, numbers: [3, 8, 9, 22, 28, 42], bonus: 45, date: '2026-06-27',
    })
  })
})

describe('computeFrequencies', () => {
  test('1~45 모든 키가 존재하고 출현 횟수를 센다', () => {
    const f = computeFrequencies([parseDraw(item1230), parseDraw(item1229)])
    expect(Object.keys(f)).toHaveLength(45)
    expect(f[42]).toBe(2) // 두 회차 모두 42
    expect(f[3]).toBe(1)
    expect(f[1]).toBe(0)
  })
})

describe('buildStats', () => {
  test('최신 회차/총 회차/빈도 구성', () => {
    const s = buildStats([parseDraw(item1229), parseDraw(item1230)])
    expect(s.latestRound).toBe(1230)
    expect(s.latestDraw.numbers).toEqual([3, 8, 9, 22, 28, 42])
    expect(s.totalDraws).toBe(2)
    expect(s.frequencies[42]).toBe(2)
  })
})

describe('isCompleteLottoStats', () => {
  test('빈도 합계가 totalDraws*6이면 true', () => {
    const s = buildStats([parseDraw(item1230), parseDraw(item1229)])
    expect(isCompleteLottoStats(s)).toBe(true)
  })
  test('빈 데이터는 false', () => {
    expect(isCompleteLottoStats(buildStats([]))).toBe(false)
  })
  test('합계가 안 맞으면 false', () => {
    const s = buildStats([parseDraw(item1230)])
    s.frequencies[3] = 5 // 합계 깨뜨림
    expect(isCompleteLottoStats(s)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run scripts/lotto-normalize.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`scripts/lotto-normalize.js`)**

```js
function formatYmd(ymd) {
  const s = String(ymd)
  if (s.length !== 8) return s
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

export function parseDraw(item) {
  const numbers = [item.tm1WnNo, item.tm2WnNo, item.tm3WnNo, item.tm4WnNo, item.tm5WnNo, item.tm6WnNo]
    .map(Number)
    .sort((a, b) => a - b)
  return {
    round: Number(item.ltEpsd),
    numbers,
    bonus: Number(item.bnsWnNo),
    date: formatYmd(item.ltRflYmd),
  }
}

export function computeFrequencies(draws) {
  const freq = {}
  for (let n = 1; n <= 45; n++) freq[n] = 0
  for (const d of draws) {
    for (const n of d.numbers) {
      if (n >= 1 && n <= 45) freq[n] += 1
    }
  }
  return freq
}

export function buildStats(draws) {
  const sorted = [...draws].sort((a, b) => b.round - a.round)
  const latest = sorted[0] ?? null
  return {
    latestRound: latest ? latest.round : 0,
    latestDraw: latest
      ? { round: latest.round, numbers: latest.numbers, bonus: latest.bonus, date: latest.date }
      : null,
    totalDraws: draws.length,
    frequencies: computeFrequencies(draws),
  }
}

export function isCompleteLottoStats(stats) {
  if (!stats || stats.totalDraws <= 0 || !stats.frequencies) return false
  let sum = 0
  for (let n = 1; n <= 45; n++) {
    const v = stats.frequencies[n]
    if (!Number.isFinite(v)) return false
    sum += v
  }
  return sum === stats.totalDraws * 6
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run scripts/lotto-normalize.test.js`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add scripts/lotto-normalize.js scripts/lotto-normalize.test.js
git commit -m "feat: add lotto response normalization helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 로또 스크래퍼 본체 + 시드 데이터 (`scripts/scrape-lotto.js`)

API를 페이징하며 전 회차를 모아 `lotto-stats.json`을 생성하고, 실행해 시드 데이터를 커밋한다.

**Files:**
- Create: `scripts/scrape-lotto.js`
- Modify: `package.json` (scripts에 `"scrape:lotto"` 추가)
- Create: `public/data/lotto-stats.json` (스크래퍼 실행 결과)

**Interfaces:**
- Consumes: `parseDraw, buildStats, isCompleteLottoStats` (from `./lotto-normalize.js`).
- 동작:
  1. `GET /lt645/result`로 쿠키 확보.
  2. `selectLtEpsdInfo.do`로 최신 회차 `latest` 파악.
  3. `selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=latest`로 시작, 이후 `srchDir=older&srchCursorLtEpsd=<현재 페이지 최소 회차>`로 빈 list가 나오거나 더 과거로 못 갈 때까지 페이징. 회차 중복은 `Set`으로 제거.
  4. 요청 사이 `SLEEP_MS`(기본 250ms) 대기.
  5. `buildStats` → 모든 회차 수집 검증(`draws.length === latest` 그리고 `isCompleteLottoStats`) 통과 시에만 `{updatedAt, ...stats}`를 `public/data/lotto-stats.json`에 저장(2-space + 개행). 아니면 exit(1)로 기존 JSON 보존.

- [ ] **Step 1: `package.json`에 스크립트 추가**

기존 `"scripts"`의 `"scrape": "node scripts/scrape-speetto.js",` 아래에 추가:
```json
    "scrape:lotto": "node scripts/scrape-lotto.js",
```

- [ ] **Step 2: 구현 작성 (`scripts/scrape-lotto.js`)**

```js
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDraw, buildStats, isCompleteLottoStats } from './lotto-normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 250)
const OUT = fileURLToPath(new URL('../public/data/lotto-stats.json', import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getCookie() {
  const res = await fetch(`${BASE}/lt645/result`, { headers: { 'User-Agent': UA } })
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function getJson(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE}/lt645/result`,
      Cookie: cookie,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

async function getLatestRound(cookie) {
  const j = await getJson(`/lt645/selectLtEpsdInfo.do?ltGmTypeCd=lt645`, cookie)
  const list = j?.data?.list ?? []
  return list.length ? Math.max(...list.map((x) => Number(x.ltEpsd))) : 0
}

async function main() {
  const cookie = await getCookie()
  const latest = await getLatestRound(cookie)
  if (!latest) {
    console.error('최신 회차를 가져오지 못함 — 비정상 종료')
    process.exit(1)
  }

  const seen = new Set()
  const draws = []

  let json = await getJson(
    `/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${latest}`,
    cookie,
  )
  let list = json?.data?.list ?? []

  while (list.length) {
    for (const item of list) {
      const d = parseDraw(item)
      if (!seen.has(d.round)) {
        seen.add(d.round)
        draws.push(d)
      }
    }
    const oldest = Math.min(...list.map((x) => Number(x.ltEpsd)))
    console.log(`수집 ${draws.length}회 (현재 최소 ${oldest})`)
    if (oldest <= 1) break
    await sleep(SLEEP_MS)
    json = await getJson(
      `/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${oldest}`,
      cookie,
    )
    list = json?.data?.list ?? []
    const newOldest = list.length ? Math.min(...list.map((x) => Number(x.ltEpsd))) : 0
    if (newOldest >= oldest) break // 진전 없음 — 무한루프 방지
  }

  const stats = buildStats(draws)

  if (draws.length !== latest || !isCompleteLottoStats(stats)) {
    console.error(
      `불완전한 수집 (수집 ${draws.length}회 / 최신 ${latest}회) — 기존 JSON 보존을 위해 비정상 종료`,
    )
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), ...stats }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`총 ${stats.totalDraws}회차 저장 (최신 ${stats.latestRound}) → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: 스크래퍼 실행해 시드 생성**

Run: `npm run scrape:lotto`
Expected: "수집 N회..." 로그가 진행되고 `총 <latest>회차 저장` 출력. `public/data/lotto-stats.json` 생성.

- [ ] **Step 4: 생성된 JSON 검증**

Run: `node -e "const d=require('./public/data/lotto-stats.json'); const ks=Object.keys(d.frequencies); const sum=ks.reduce((s,k)=>s+d.frequencies[k],0); console.log('latestRound',d.latestRound,'totalDraws',d.totalDraws,'freqKeys',ks.length,'sumOK',sum===d.totalDraws*6,'latestDraw',JSON.stringify(d.latestDraw))"`
Expected: `freqKeys 45`, `sumOK true`, `latestDraw`에 6개 번호+보너스+날짜, `totalDraws === latestRound`.

- [ ] **Step 5: 전체 테스트 재실행(회귀 확인)**

Run: `npm test`
Expected: 모든 테스트 PASS.

- [ ] **Step 6: 커밋**

```bash
git add scripts/scrape-lotto.js package.json public/data/lotto-stats.json
git commit -m "feat: add lotto scraper and seed stats data

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 로또 수집 워크플로 + 배포 트리거 연결

주간 로또 수집 워크플로를 추가하고, 수집 후 자동 재배포되도록 `deploy.yml`에 트리거를 연결한다.

**Files:**
- Create: `.github/workflows/scrape-lotto.yml`
- Modify: `.github/workflows/deploy.yml` (`workflow_run.workflows`에 `"Scrape Lotto"` 추가)

**Interfaces:**
- `scrape-lotto.yml`: name `"Scrape Lotto"`; cron 매주 일요일 + `workflow_dispatch`; 변경 시 `public/data/lotto-stats.json` 커밋·푸시.
- `deploy.yml`: 기존 `workflow_run.workflows: ["Scrape Speetto"]` → `["Scrape Speetto", "Scrape Lotto"]`.

- [ ] **Step 1: `.github/workflows/scrape-lotto.yml` 작성**

```yaml
name: Scrape Lotto

on:
  schedule:
    - cron: '0 0 * * 0'   # 매주 일요일 09:00 KST
  workflow_dispatch:

permissions:
  contents: write

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/scrape-lotto.js
      - name: Commit updated data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data/lotto-stats.json
          if git diff --staged --quiet; then
            echo "변경 없음"
          else
            git commit -m "data: update lotto stats"
            git push
          fi
```

- [ ] **Step 2: `deploy.yml`의 workflow_run 목록에 추가**

기존:
```yaml
  workflow_run:
    workflows: ["Scrape Speetto"]
    types: [completed]
```
다음으로 변경:
```yaml
  workflow_run:
    workflows: ["Scrape Speetto", "Scrape Lotto"]
    types: [completed]
```

- [ ] **Step 3: 워크플로 YAML 점검**

Run: `node -e "const fs=require('fs'); const a=fs.readFileSync('.github/workflows/scrape-lotto.yml','utf8'); if(!a.includes('name: Scrape Lotto')||!a.includes('runs-on: ubuntu-latest'))throw new Error('scrape-lotto bad'); const d=fs.readFileSync('.github/workflows/deploy.yml','utf8'); if(!d.includes('\"Scrape Lotto\"'))throw new Error('deploy not wired'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/scrape-lotto.yml .github/workflows/deploy.yml
git commit -m "ci: add weekly lotto scrape workflow and wire redeploy

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- 랜덤 + 통계(빈도 가중) 추천, 5세트 → Task 1, 5. ✅
- 데이터 형식 `lotto-stats.json`(updatedAt/latestRound/latestDraw/totalDraws/frequencies) → Task 6, 7. ✅
- 데이터 소스/페이징(selectLtEpsdInfo, selectPstLt645InfoNew center/older) → Task 7. ✅
- 빈도표 계산 + 가드(합계 검증, 전회차 수집) → Task 6, 7. ✅
- 화면(지난 회차, 두 버튼, 5세트, hot/cold, 공 색상) → Task 3, 4, 5. ✅
- 랜덤은 stats 없이 항상 동작 / 통계 버튼 비활성 처리 → Task 5. ✅
- 데이터 로딩 훅 → Task 2. ✅
- 주간 워크플로 + 재배포 트리거 연결 → Task 8. ✅
- 컴포넌트 분리(LottoPage/LottoBall/NumberSet/useLottoStats/lib) → Task 1–5. ✅

**Placeholder scan:** TBD/TODO 없음. 모든 코드/명령 구체화됨. ✅

**Type consistency:**
- store/draw/stats 키(`round/numbers/bonus/date`, `latestRound/latestDraw/totalDraws/frequencies`)가 Task 5/6/7 전반에서 일치. ✅
- `recommendSets({count,mode,frequencies,rng})` 시그니처가 Task 1 정의와 Task 5 호출에서 일치. ✅
- `frequencies` 키는 숫자 1~45(객체 접근 시 문자열 키로 직렬화) — `freqWeight`가 둘 다 처리(Task 1), `isCompleteLottoStats`는 `stats.frequencies[n]`(숫자 n) 접근(Task 6) — JSON 로드 후 문자열 키여도 숫자 인덱싱 정상. ✅
- App.test의 준비중 검증 탭 변경(Task 5 Step 6)으로 기존 테스트 깨짐 방지. ✅

## 범위 밖 (이번 작업 아님)

- 띠별 추천 번호, 사주 기반 번호(별도 메뉴, 추후).
- 당첨 예측 정확도 주장(로또는 무작위).
