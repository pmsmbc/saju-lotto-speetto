# 스피또 당첨 지역 조회 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동행복권 스피또 당첨 판매점 데이터를 GitHub Actions로 매일 수집해 JSON으로 저장하고, 정적 React(GitHub Pages) 사이트에서 회차별 → 지역별 집계로 보여준다.

**Architecture:** Node 스크래퍼가 동행복권 JSON API를 호출해 `public/data/speetto.json`을 생성/갱신한다(GitHub Actions, 매일 + 수동 실행). React 앱은 빌드 시 함께 배포된 이 정적 JSON만 읽어 회차/지역 필터와 집계를 화면에 그린다. 서버는 없다.

**Tech Stack:** Node 20, Vite 5, React 18, Vitest + @testing-library/react (jsdom), GitHub Actions, GitHub Pages.

## Global Constraints

- Node 버전: **20 이상** (스크래퍼는 내장 `fetch` 사용 — Node 18+ 필요, CI는 20 고정).
- 빌드 도구: **Vite 5**, UI: **React 18**. 외부 UI 프레임워크/라우터 없음(상태 기반 탭 네비게이션).
- 테스트: **Vitest**. React 컴포넌트는 `@testing-library/react` + `jsdom`.
- Vite `base`: `'./'` (저장소 이름에 의존하지 않도록 상대 경로). 데이터 fetch 경로는 항상 `` `${import.meta.env.BASE_URL}data/speetto.json` `` 사용.
- 동행복권 API 베이스: `https://www.dhlottery.co.kr`
- 게임 코드(`srchLtGdsCd`): `LP35`=스피또2000, `LP34`=스피또1000, `LP33`=스피또500.
- 엔드포인트(모두 **GET**, `X-Requested-With: XMLHttpRequest` 헤더 + 세션 쿠키 필요):
  - 회차목록: `/wnprchsplcsrch/selectStEpsdInfo.do?srchLtGdsCd=<CODE>` → `{data:{list:[{ltEpsd:Number}]}}`
  - 당첨판매점: `/wnprchsplcsrch/selectStWnShp.do?srchLtGdsCd=<CODE>&srchLtEpsd=<N>` → `{data:{list:[{shpNm,shpAddr,region,wnShpRnk,...}]}}`
  - 세션 쿠키는 먼저 `/wnprchsplcsrch/home`을 GET해서 받는다.
- User-Agent 헤더는 일반 브라우저 문자열을 사용한다(아래 상수 `UA`).
- 스피또 데이터의 표준 게임명: `LP35`→`"스피또2000"`, `LP34`→`"스피또1000"`, `LP33`→`"스피또500"`.
- 커밋은 각 Task 끝에서. 커밋 메시지 끝에 다음 줄 포함:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: 프로젝트 스캐폴딩 (Vite + React + Vitest)

빈 디렉토리에 git 저장소와 Vite React 앱, Vitest 테스트 환경을 만든다. 산출물: `npm run dev`로 뜨고 `npm test`가 통과하는 빈 앱.

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/setupTests.js`
- Create: `.gitignore`
- Test: `src/smoke.test.js`

**Interfaces:**
- Produces: `App` (default export, React 컴포넌트) — 이후 Task 9에서 교체/확장.

- [ ] **Step 1: `.gitignore` 작성**

```
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 2: `package.json` 작성**

```json
{
  "name": "saju-lotto-site",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "scrape": "node scripts/scrape-speetto.js"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 3: `vite.config.js` 작성**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
```

- [ ] **Step 4: `src/setupTests.js` 작성**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: `index.html` 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>사주·로또·스피또 정보</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: `src/App.jsx` 작성 (임시 자리표시)**

```jsx
export default function App() {
  return <div>준비중</div>
}
```

- [ ] **Step 7: `src/main.jsx` 작성**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 8: 스모크 테스트 작성 (`src/smoke.test.js`)**

```js
import { render, screen } from '@testing-library/react'
import App from './App.jsx'

test('renders placeholder', () => {
  render(<App />)
  expect(screen.getByText('준비중')).toBeInTheDocument()
})
```

- [ ] **Step 9: 의존성 설치 후 테스트 실패→통과 확인**

Run: `npm install && npm test`
Expected: 1 test file, `renders placeholder` PASS.

- [ ] **Step 10: git 초기화 및 커밋**

```bash
cd "/Users/pjwmax/개인/site2"
git init
git add -A
git commit -m "chore: scaffold Vite React app with Vitest

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 집계 라이브러리 (회차/지역 순수 함수)

화면의 핵심 로직(회차 목록 추출, 회차로 필터, 지역별 집계, 지역으로 필터)을 UI와 분리된 순수 함수로 TDD한다.

**Files:**
- Create: `src/lib/aggregate.js`
- Test: `src/lib/aggregate.test.js`

**Interfaces:**
- Consumes: `speetto.json`의 `stores` 배열. 각 store 객체: `{ game: string, round: number, rank: number, store: string, address: string, region: string }`.
- Produces:
  - `listRounds(stores) → Array<{ game: string, round: number, label: string }>` — `label`은 `"스피또1000 107회"`. game명 우선, round 내림차순.
  - `filterByRound(stores, game, round) → store[]` — `game===null && round===null`이면 전체 반환.
  - `aggregateByRegion(stores) → Array<{ region: string, count: number }>` — count 내림차순, 동수면 region 가나다순.
  - `filterByRegion(stores, region) → store[]` — `region===null`이면 전체 반환.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/lib/aggregate.test.js`)**

```js
import { describe, test, expect } from 'vitest'
import { listRounds, filterByRound, aggregateByRegion, filterByRegion } from './aggregate.js'

const sample = [
  { game: '스피또1000', round: 107, rank: 1, store: 'A', address: '서울 ...', region: '서울' },
  { game: '스피또1000', round: 106, rank: 1, store: 'B', address: '경기 ...', region: '경기' },
  { game: '스피또1000', round: 106, rank: 2, store: 'C', address: '서울 ...', region: '서울' },
  { game: '스피또2000', round: 68, rank: 1, store: 'D', address: '부산 ...', region: '부산' },
]

describe('listRounds', () => {
  test('게임/회차 목록을 회차 내림차순으로 반환', () => {
    const rounds = listRounds(sample)
    expect(rounds).toEqual([
      { game: '스피또2000', round: 68, label: '스피또2000 68회' },
      { game: '스피또1000', round: 107, label: '스피또1000 107회' },
      { game: '스피또1000', round: 106, label: '스피또1000 106회' },
    ])
  })
})

describe('filterByRound', () => {
  test('게임+회차로 필터', () => {
    expect(filterByRound(sample, '스피또1000', 106)).toHaveLength(2)
  })
  test('null,null이면 전체', () => {
    expect(filterByRound(sample, null, null)).toHaveLength(4)
  })
})

describe('aggregateByRegion', () => {
  test('지역별 건수를 내림차순으로', () => {
    expect(aggregateByRegion(sample)).toEqual([
      { region: '서울', count: 2 },
      { region: '경기', count: 1 },
      { region: '부산', count: 1 },
    ])
  })
})

describe('filterByRegion', () => {
  test('지역으로 필터', () => {
    expect(filterByRegion(sample, '서울')).toHaveLength(2)
  })
  test('null이면 전체', () => {
    expect(filterByRegion(sample, null)).toHaveLength(4)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/aggregate.test.js`
Expected: FAIL — `aggregate.js` 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/lib/aggregate.js`)**

```js
// 게임명 표시 우선순위(번호 큰 게임 먼저). 목록 안정 정렬용.
const GAME_ORDER = ['스피또2000', '스피또1000', '스피또500']

export function listRounds(stores) {
  const seen = new Map()
  for (const s of stores) {
    const key = `${s.game}#${s.round}`
    if (!seen.has(key)) {
      seen.set(key, { game: s.game, round: s.round, label: `${s.game} ${s.round}회` })
    }
  }
  return [...seen.values()].sort((a, b) => {
    const g = GAME_ORDER.indexOf(a.game) - GAME_ORDER.indexOf(b.game)
    if (g !== 0) return g
    return b.round - a.round
  })
}

export function filterByRound(stores, game, round) {
  if (game === null && round === null) return stores
  return stores.filter((s) => s.game === game && s.round === round)
}

export function aggregateByRegion(stores) {
  const counts = new Map()
  for (const s of stores) {
    counts.set(s.region, (counts.get(s.region) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, 'ko'))
}

export function filterByRegion(stores, region) {
  if (region === null) return stores
  return stores.filter((s) => s.region === region)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/aggregate.test.js`
Expected: PASS (모든 케이스).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/aggregate.js src/lib/aggregate.test.js
git commit -m "feat: add round/region aggregation helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 데이터 로딩 훅 (useSpeettoData)

정적 JSON을 fetch해 로딩/에러/데이터 상태를 주는 훅. 핵심 정규화(`updatedAt`, `stores`)를 검증.

**Files:**
- Create: `src/hooks/useSpeettoData.js`
- Test: `src/hooks/useSpeettoData.test.js`

**Interfaces:**
- Produces: `useSpeettoData() → { loading: boolean, error: string|null, updatedAt: string|null, stores: store[] }`
  - fetch 경로: `` `${import.meta.env.BASE_URL}data/speetto.json` ``
  - 성공: `loading=false, stores=data.stores ?? [], updatedAt=data.updatedAt ?? null`
  - 실패(네트워크/!ok): `loading=false, error='데이터를 불러올 수 없습니다', stores=[]`

- [ ] **Step 1: 실패하는 테스트 작성 (`src/hooks/useSpeettoData.test.js`)**

```js
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpeettoData } from './useSpeettoData.js'

describe('useSpeettoData', () => {
  afterEach(() => vi.restoreAllMocks())

  test('성공 시 stores와 updatedAt 반환', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updatedAt: '2026-06-29T03:00:00Z', stores: [{ region: '서울' }] }),
    }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stores).toHaveLength(1)
    expect(result.current.updatedAt).toBe('2026-06-29T03:00:00Z')
    expect(result.current.error).toBeNull()
  })

  test('실패 시 에러 메시지', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('데이터를 불러올 수 없습니다')
    expect(result.current.stores).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/hooks/useSpeettoData.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/hooks/useSpeettoData.js`)**

```js
import { useEffect, useState } from 'react'

export function useSpeettoData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    updatedAt: null,
    stores: [],
  })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/speetto.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          updatedAt: data.updatedAt ?? null,
          stores: data.stores ?? [],
        })
      })
      .catch(() => {
        if (cancelled) return
        setState({ loading: false, error: '데이터를 불러올 수 없습니다', updatedAt: null, stores: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/hooks/useSpeettoData.test.js`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useSpeettoData.js src/hooks/useSpeettoData.test.js
git commit -m "feat: add useSpeettoData fetch hook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: RoundSelector 컴포넌트

게임/회차를 고르는 드롭다운. "전체"(`value=""`)와 각 회차 옵션.

**Files:**
- Create: `src/components/RoundSelector.jsx`
- Test: `src/components/RoundSelector.test.jsx`

**Interfaces:**
- Consumes: `listRounds` 결과 배열.
- Produces: `<RoundSelector rounds={Round[]} value={string} onChange={(value:string)=>void} />`
  - 옵션 `value` 형식: 전체는 `""`, 회차는 `` `${game}#${round}` ``(예: `"스피또1000#107"`).
  - 첫 옵션은 항상 `전체`.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/components/RoundSelector.test.jsx`)**

```jsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoundSelector } from './RoundSelector.jsx'

const rounds = [
  { game: '스피또2000', round: 68, label: '스피또2000 68회' },
  { game: '스피또1000', round: 107, label: '스피또1000 107회' },
]

test('전체 + 회차 옵션을 렌더링', () => {
  render(<RoundSelector rounds={rounds} value="" onChange={() => {}} />)
  expect(screen.getByRole('option', { name: '전체' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: '스피또1000 107회' })).toBeInTheDocument()
})

test('선택 시 onChange로 value 전달', () => {
  const onChange = vi.fn()
  render(<RoundSelector rounds={rounds} value="" onChange={onChange} />)
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '스피또1000#107' } })
  expect(onChange).toHaveBeenCalledWith('스피또1000#107')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/RoundSelector.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/components/RoundSelector.jsx`)**

```jsx
export function RoundSelector({ rounds, value, onChange }) {
  return (
    <select
      className="round-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="회차 선택"
    >
      <option value="">전체</option>
      {rounds.map((r) => (
        <option key={`${r.game}#${r.round}`} value={`${r.game}#${r.round}`}>
          {r.label}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/RoundSelector.test.jsx`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/RoundSelector.jsx src/components/RoundSelector.test.jsx
git commit -m "feat: add RoundSelector component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: RegionStats 컴포넌트

선택된 회차 기준 지역별 집계를 막대로 표시. 지역 클릭 시 필터 토글.

**Files:**
- Create: `src/components/RegionStats.jsx`
- Test: `src/components/RegionStats.test.jsx`

**Interfaces:**
- Consumes: `aggregateByRegion` 결과 `Array<{region, count}>`.
- Produces: `<RegionStats stats={...} selectedRegion={string|null} onSelectRegion={(region:string|null)=>void} />`
  - 각 지역은 버튼. 클릭 시 현재 선택된 지역이면 `null`(해제), 아니면 그 지역으로 `onSelectRegion` 호출.
  - 막대 너비는 최대 count 대비 비율(%)로 `style.width`.
  - 빈 배열이면 "현재 표시할 당첨 정보가 없습니다".

- [ ] **Step 1: 실패하는 테스트 작성 (`src/components/RegionStats.test.jsx`)**

```jsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionStats } from './RegionStats.jsx'

const stats = [
  { region: '서울', count: 2 },
  { region: '경기', count: 1 },
]

test('지역과 건수를 렌더링', () => {
  render(<RegionStats stats={stats} selectedRegion={null} onSelectRegion={() => {}} />)
  expect(screen.getByText('서울')).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
})

test('지역 클릭 시 해당 지역으로 콜백', () => {
  const onSelect = vi.fn()
  render(<RegionStats stats={stats} selectedRegion={null} onSelectRegion={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: /서울/ }))
  expect(onSelect).toHaveBeenCalledWith('서울')
})

test('선택된 지역 다시 클릭 시 해제(null)', () => {
  const onSelect = vi.fn()
  render(<RegionStats stats={stats} selectedRegion="서울" onSelectRegion={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: /서울/ }))
  expect(onSelect).toHaveBeenCalledWith(null)
})

test('빈 배열이면 안내 문구', () => {
  render(<RegionStats stats={[]} selectedRegion={null} onSelectRegion={() => {}} />)
  expect(screen.getByText('현재 표시할 당첨 정보가 없습니다')).toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/RegionStats.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/components/RegionStats.jsx`)**

```jsx
export function RegionStats({ stats, selectedRegion, onSelectRegion }) {
  if (stats.length === 0) {
    return <p className="empty">현재 표시할 당첨 정보가 없습니다</p>
  }
  const max = Math.max(...stats.map((s) => s.count))
  return (
    <ul className="region-stats">
      {stats.map((s) => {
        const active = s.region === selectedRegion
        return (
          <li key={s.region}>
            <button
              type="button"
              className={active ? 'region-bar active' : 'region-bar'}
              onClick={() => onSelectRegion(active ? null : s.region)}
            >
              <span className="region-name">{s.region}</span>
              <span className="region-track">
                <span className="region-fill" style={{ width: `${(s.count / max) * 100}%` }} />
              </span>
              <span className="region-count">{s.count}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/RegionStats.test.jsx`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/RegionStats.jsx src/components/RegionStats.test.jsx
git commit -m "feat: add RegionStats component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: StoreList 컴포넌트

필터 적용된 당첨 판매점 목록(게임/등수/판매점명/주소/회차).

**Files:**
- Create: `src/components/StoreList.jsx`
- Test: `src/components/StoreList.test.jsx`

**Interfaces:**
- Consumes: store 배열 `{ game, round, rank, store, address, region }`.
- Produces: `<StoreList stores={store[]} />`
  - 각 행: `{game} {round}회`, `{rank}등`, `store`, `address`.
  - 빈 배열이면 "조건에 맞는 당첨 판매점이 없습니다".

- [ ] **Step 1: 실패하는 테스트 작성 (`src/components/StoreList.test.jsx`)**

```jsx
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreList } from './StoreList.jsx'

const stores = [
  { game: '스피또1000', round: 107, rank: 1, store: '영등포역 복권방', address: '서울 영등포구', region: '서울' },
]

test('판매점 정보를 렌더링', () => {
  render(<StoreList stores={stores} />)
  expect(screen.getByText('영등포역 복권방')).toBeInTheDocument()
  expect(screen.getByText('서울 영등포구')).toBeInTheDocument()
  expect(screen.getByText('1등')).toBeInTheDocument()
  expect(screen.getByText('스피또1000 107회')).toBeInTheDocument()
})

test('빈 배열이면 안내 문구', () => {
  render(<StoreList stores={[]} />)
  expect(screen.getByText('조건에 맞는 당첨 판매점이 없습니다')).toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/StoreList.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/components/StoreList.jsx`)**

```jsx
export function StoreList({ stores }) {
  if (stores.length === 0) {
    return <p className="empty">조건에 맞는 당첨 판매점이 없습니다</p>
  }
  return (
    <ul className="store-list">
      {stores.map((s, i) => (
        <li key={`${s.game}-${s.round}-${s.store}-${i}`} className="store-item">
          <div className="store-head">
            <span className="store-game">{s.game} {s.round}회</span>
            <span className="store-rank">{s.rank}등</span>
          </div>
          <div className="store-name">{s.store}</div>
          <div className="store-addr">{s.address}</div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/StoreList.test.jsx`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/StoreList.jsx src/components/StoreList.test.jsx
git commit -m "feat: add StoreList component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: SpeettoPage 조립

훅 + 집계 + 세 컴포넌트를 묶어 페이지를 구성. 회차/지역 선택 상태 관리, 로딩/에러 처리, "마지막 업데이트" 표시.

**Files:**
- Create: `src/pages/SpeettoPage.jsx`
- Test: `src/pages/SpeettoPage.test.jsx`

**Interfaces:**
- Consumes: `useSpeettoData`, `listRounds/filterByRound/aggregateByRegion/filterByRegion`, `RoundSelector/RegionStats/StoreList`.
- Produces: `SpeettoPage` (named + default export 둘 다). props 없음.
- 동작:
  - `loading` → "불러오는 중..." 표시.
  - `error` → 에러 메시지 표시.
  - 회차 선택값(`roundValue` 문자열)은 `"game#round"` 또는 `""`. 파싱해서 `filterByRound`에 넘김.
  - 회차로 거른 stores로 `aggregateByRegion` 계산 → `RegionStats`.
  - 거기에 `selectedRegion`까지 `filterByRegion` 적용한 결과 → `StoreList`.
  - **회차를 바꾸면 지역 선택은 초기화(null).**

- [ ] **Step 1: 실패하는 테스트 작성 (`src/pages/SpeettoPage.test.jsx`)**

```jsx
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SpeettoPage } from './SpeettoPage.jsx'

const data = {
  updatedAt: '2026-06-29T03:00:00Z',
  stores: [
    { game: '스피또1000', round: 107, rank: 1, store: 'A', address: '서울 강남', region: '서울' },
    { game: '스피또1000', round: 106, rank: 1, store: 'B', address: '경기 수원', region: '경기' },
  ],
}

function mockFetchOk() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
}

afterEach(() => vi.restoreAllMocks())

test('로딩 후 지역 집계와 판매점을 표시', async () => {
  mockFetchOk()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
  expect(screen.getByText('B')).toBeInTheDocument()
  // 마지막 업데이트 표시(날짜 문자열 일부)
  expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument()
})

test('지역 선택 시 해당 지역만 표시', async () => {
  mockFetchOk()
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /경기/ }))
  expect(screen.queryByText('A')).not.toBeInTheDocument()
  expect(screen.getByText('B')).toBeInTheDocument()
})

test('fetch 실패 시 에러 메시지', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SpeettoPage />)
  await waitFor(() =>
    expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument(),
  )
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/pages/SpeettoPage.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/pages/SpeettoPage.jsx`)**

```jsx
import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import {
  listRounds,
  filterByRound,
  aggregateByRegion,
  filterByRegion,
} from '../lib/aggregate.js'
import { RoundSelector } from '../components/RoundSelector.jsx'
import { RegionStats } from '../components/RegionStats.jsx'
import { StoreList } from '../components/StoreList.jsx'

function parseRoundValue(value) {
  if (!value) return { game: null, round: null }
  const [game, round] = value.split('#')
  return { game, round: Number(round) }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function SpeettoPage() {
  const { loading, error, updatedAt, stores } = useSpeettoData()
  const [roundValue, setRoundValue] = useState('')
  const [selectedRegion, setSelectedRegion] = useState(null)

  const rounds = useMemo(() => listRounds(stores), [stores])
  const { game, round } = parseRoundValue(roundValue)
  const roundStores = useMemo(
    () => filterByRound(stores, game, round),
    [stores, game, round],
  )
  const stats = useMemo(() => aggregateByRegion(roundStores), [roundStores])
  const visibleStores = useMemo(
    () => filterByRegion(roundStores, selectedRegion),
    [roundStores, selectedRegion],
  )

  if (loading) return <p className="status">불러오는 중...</p>
  if (error) return <p className="status error">{error}</p>

  return (
    <section className="speetto-page">
      <p className="updated-at">마지막 업데이트: {formatDate(updatedAt)}</p>
      <RoundSelector
        rounds={rounds}
        value={roundValue}
        onChange={(v) => {
          setRoundValue(v)
          setSelectedRegion(null)
        }}
      />
      <h2>지역별 당첨</h2>
      <RegionStats
        stats={stats}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />
      <h2>당첨 판매점</h2>
      <StoreList stores={visibleStores} />
    </section>
  )
}

export default SpeettoPage
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/pages/SpeettoPage.test.jsx`
Expected: PASS (3 케이스).

- [ ] **Step 5: 커밋**

```bash
git add src/pages/SpeettoPage.jsx src/pages/SpeettoPage.test.jsx
git commit -m "feat: assemble SpeettoPage with round/region filtering

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 스크래퍼 순수 함수 (동행복권 응답 정규화)

API 응답을 우리 `store` 형식으로 바꾸는 순수 함수를 TDD. 네트워크 없는 부분만 여기서 테스트.

**Files:**
- Create: `scripts/normalize.js`
- Test: `scripts/normalize.test.js`

**Interfaces:**
- Produces:
  - `GAME_CODES` — `[{ code: 'LP35', name: '스피또2000' }, { code: 'LP34', name: '스피또1000' }, { code: 'LP33', name: '스피또500' }]`
  - `extractEpisodes(apiJson) → number[]` — `apiJson.data.list`에서 `ltEpsd` 추출. 없으면 `[]`.
  - `normalizeStores(apiJson, gameName, round) → store[]` — `apiJson.data.list`의 각 항목을 `{ game: gameName, round, rank: Number(item.wnShpRnk), store: item.shpNm, address: item.shpAddr, region: resolveRegion(item) }`로. list 없으면 `[]`.
  - `resolveRegion(item) → string` — `item.region`이 있으면 그대로, 없으면 `item.shpAddr` 첫 어절을 시·도 약어로 매핑(`REGION_PREFIX`). 매핑 실패 시 `'기타'`.

- [ ] **Step 1: 실패하는 테스트 작성 (`scripts/normalize.test.js`)**

```js
import { describe, test, expect } from 'vitest'
import { extractEpisodes, normalizeStores, resolveRegion, GAME_CODES } from './normalize.js'

test('GAME_CODES는 세 게임을 가진다', () => {
  expect(GAME_CODES.map((g) => g.name)).toEqual(['스피또2000', '스피또1000', '스피또500'])
})

describe('extractEpisodes', () => {
  test('ltEpsd 목록 추출', () => {
    const json = { data: { list: [{ ltEpsd: 107 }, { ltEpsd: 106 }] } }
    expect(extractEpisodes(json)).toEqual([107, 106])
  })
  test('list 없으면 빈 배열', () => {
    expect(extractEpisodes({ data: { list: [] } })).toEqual([])
    expect(extractEpisodes({})).toEqual([])
  })
})

describe('resolveRegion', () => {
  test('region 필드 우선', () => {
    expect(resolveRegion({ region: '서울', shpAddr: '경기 ...' })).toBe('서울')
  })
  test('region 없으면 주소 첫 어절로 매핑', () => {
    expect(resolveRegion({ shpAddr: '경기도 수원시 ...' })).toBe('경기')
    expect(resolveRegion({ shpAddr: '서울특별시 강남구 ...' })).toBe('서울')
  })
  test('매핑 실패 시 기타', () => {
    expect(resolveRegion({ shpAddr: '외국 어딘가' })).toBe('기타')
    expect(resolveRegion({})).toBe('기타')
  })
})

describe('normalizeStores', () => {
  test('API 항목을 store 형식으로 변환', () => {
    const json = {
      data: {
        list: [
          { shpNm: '영등포역 복권방', shpAddr: '서울 영등포구', region: '서울', wnShpRnk: 1 },
        ],
      },
    }
    expect(normalizeStores(json, '스피또1000', 107)).toEqual([
      {
        game: '스피또1000',
        round: 107,
        rank: 1,
        store: '영등포역 복권방',
        address: '서울 영등포구',
        region: '서울',
      },
    ])
  })
  test('list 없으면 빈 배열', () => {
    expect(normalizeStores({ data: { list: null } }, '스피또1000', 1)).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run scripts/normalize.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`scripts/normalize.js`)**

```js
export const GAME_CODES = [
  { code: 'LP35', name: '스피또2000' },
  { code: 'LP34', name: '스피또1000' },
  { code: 'LP33', name: '스피또500' },
]

// 주소 첫 어절(시·도) → 표준 약어
const REGION_PREFIX = [
  ['서울', '서울'],
  ['경기', '경기'],
  ['부산', '부산'],
  ['대구', '대구'],
  ['인천', '인천'],
  ['대전', '대전'],
  ['울산', '울산'],
  ['광주', '광주'],
  ['세종', '세종'],
  ['강원', '강원'],
  ['충북', '충북'],
  ['충청북', '충북'],
  ['충남', '충남'],
  ['충청남', '충남'],
  ['전북', '전북'],
  ['전라북', '전북'],
  ['전남', '전남'],
  ['전라남', '전남'],
  ['경북', '경북'],
  ['경상북', '경북'],
  ['경남', '경남'],
  ['경상남', '경남'],
  ['제주', '제주'],
  ['인터넷', '인터넷'],
]

export function resolveRegion(item) {
  if (item.region) return item.region
  const addr = item.shpAddr ?? ''
  for (const [prefix, label] of REGION_PREFIX) {
    if (addr.startsWith(prefix)) return label
  }
  return '기타'
}

export function extractEpisodes(apiJson) {
  const list = apiJson?.data?.list
  if (!Array.isArray(list)) return []
  return list.map((x) => x.ltEpsd)
}

export function normalizeStores(apiJson, gameName, round) {
  const list = apiJson?.data?.list
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    game: gameName,
    round,
    rank: Number(item.wnShpRnk),
    store: item.shpNm,
    address: item.shpAddr,
    region: resolveRegion(item),
  }))
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run scripts/normalize.test.js`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add scripts/normalize.js scripts/normalize.test.js
git commit -m "feat: add dhlottery response normalization helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: 스크래퍼 본체 + 시드 데이터

`normalize.js`를 써서 동행복권 API를 실제로 호출하고 `public/data/speetto.json`을 생성하는 실행 스크립트. 실행해 실제 데이터를 받아 커밋(시드).

**Files:**
- Create: `scripts/scrape-speetto.js`
- Create: `public/data/speetto.json` (스크래퍼 실행 결과)

**Interfaces:**
- Consumes: `GAME_CODES, extractEpisodes, normalizeStores` (from `./normalize.js`).
- 동작:
  1. `GET https://www.dhlottery.co.kr/wnprchsplcsrch/home`으로 쿠키 확보(Set-Cookie 헤더 저장).
  2. 게임마다 `selectStEpsdInfo.do`로 회차 목록을 받고, **최근 `MAX_ROUNDS`(기본 30)회차**만 대상으로.
  3. 각 회차마다 `selectStWnShp.do`로 판매점 받아 `normalizeStores`로 변환, 누적.
  4. 요청 사이 `SLEEP_MS`(기본 250ms) 대기.
  5. `{ updatedAt: <ISO>, stores: [...] }`를 `public/data/speetto.json`에 저장(2-space).
- 환경변수: `MAX_ROUNDS`, `SLEEP_MS`로 조정 가능.
- 실패 처리: 한 회차 요청이 실패하면 그 회차만 건너뛰고 계속(전체 중단 안 함). 최종 stores가 0건이면 비정상 종료(exit 1)로 기존 JSON 보존.

- [ ] **Step 1: 구현 작성 (`scripts/scrape-speetto.js`)**

```js
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAME_CODES, extractEpisodes, normalizeStores } from './normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const MAX_ROUNDS = Number(process.env.MAX_ROUNDS ?? 30)
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 250)

const OUT = fileURLToPath(new URL('../public/data/speetto.json', import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getCookie() {
  const res = await fetch(`${BASE}/wnprchsplcsrch/home`, {
    headers: { 'User-Agent': UA },
  })
  // Node fetch는 set-cookie를 getSetCookie()로 노출
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function getJson(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE}/wnprchsplcsrch/home`,
      Cookie: cookie,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

async function main() {
  const cookie = await getCookie()
  const allStores = []

  for (const { code, name } of GAME_CODES) {
    let episodes = []
    try {
      const epsdJson = await getJson(
        `/wnprchsplcsrch/selectStEpsdInfo.do?srchLtGdsCd=${code}`,
        cookie,
      )
      episodes = extractEpisodes(epsdJson).slice(0, MAX_ROUNDS)
    } catch (err) {
      console.error(`[${name}] 회차 목록 실패: ${err.message}`)
      continue
    }

    for (const round of episodes) {
      await sleep(SLEEP_MS)
      try {
        const shpJson = await getJson(
          `/wnprchsplcsrch/selectStWnShp.do?srchLtGdsCd=${code}&srchLtEpsd=${round}`,
          cookie,
        )
        const stores = normalizeStores(shpJson, name, round)
        allStores.push(...stores)
        console.log(`[${name}] ${round}회: ${stores.length}건`)
      } catch (err) {
        console.error(`[${name}] ${round}회 실패: ${err.message}`)
      }
    }
  }

  if (allStores.length === 0) {
    console.error('수집된 당첨 판매점이 0건 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), stores: allStores }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`총 ${allStores.length}건 저장 → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: 스크래퍼 실행해 실제 데이터 수집**

Run: `MAX_ROUNDS=30 npm run scrape`
Expected: 게임별 회차 로그가 출력되고 `총 N건 저장` (N>0). `public/data/speetto.json` 생성됨.

- [ ] **Step 3: 생성된 JSON 형식 확인**

Run: `node -e "const d=require('./public/data/speetto.json'); console.log('updatedAt', d.updatedAt); console.log('stores', d.stores.length); console.log(d.stores[0])"`
Expected: `updatedAt`은 ISO 문자열, `stores`는 1건 이상, 첫 항목에 `game/round/rank/store/address/region` 존재.

- [ ] **Step 4: 전체 테스트 재실행 (회귀 확인)**

Run: `npm test`
Expected: 모든 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add scripts/scrape-speetto.js public/data/speetto.json
git commit -m "feat: add speetto scraper and seed data

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: App 셸 (네비게이션 + 준비중 메뉴)

상단 메뉴 바로 "스피또 당첨 지역"을 활성화하고 나머지(로또 추천/띠별 번호/사주 번호)는 "준비중" 안내. 기본 스타일.

**Files:**
- Modify: `src/App.jsx` (Task 1의 자리표시 교체)
- Create: `src/App.css`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes: `SpeettoPage`.
- Produces: `App` — 상단 탭 4개. 기본 활성 탭 `speetto` → `SpeettoPage` 렌더. 나머지 탭 클릭 시 "준비중입니다" 표시.
- 탭 정의(순서/라벨 고정):
  - `speetto` → `스피또 당첨 지역`
  - `lotto` → `로또 번호 추천`
  - `zodiac` → `오늘의 띠별 번호`
  - `saju` → `사주 번호 추천`

- [ ] **Step 1: 기존 스모크 테스트 제거(대체)**

Run: `git rm src/smoke.test.js`
(App 테스트가 이를 대체한다.)

- [ ] **Step 2: 실패하는 테스트 작성 (`src/App.test.jsx`)**

```jsx
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

test('기본으로 스피또 페이지를 보여준다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ updatedAt: '2026-06-29T03:00:00Z', stores: [] }),
  }))
  render(<App />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('준비중 메뉴 클릭 시 안내 표시', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, stores: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '로또 번호 추천' }))
  expect(screen.getByText('준비중입니다')).toBeInTheDocument()
})
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run src/App.test.jsx`
Expected: FAIL — App이 아직 탭/SpeettoPage를 렌더하지 않음.

- [ ] **Step 4: `src/App.jsx` 작성 (자리표시 교체)**

```jsx
import { useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import './App.css'

const TABS = [
  { id: 'speetto', label: '스피또 당첨 지역' },
  { id: 'lotto', label: '로또 번호 추천' },
  { id: 'zodiac', label: '오늘의 띠별 번호' },
  { id: 'saju', label: '사주 번호 추천' },
]

export default function App() {
  const [tab, setTab] = useState('speetto')
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">사주·로또·스피또</h1>
        <nav className="app-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {tab === 'speetto' ? <SpeettoPage /> : <p className="status">준비중입니다</p>}
      </main>
    </div>
  )
}
```

- [ ] **Step 5: `src/App.css` 작성**

```css
:root {
  --accent: #2b6cb0;
  --bg: #f7f8fa;
  --line: #e2e8f0;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); font-family: system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif; color: #1a202c; }
.app { max-width: 720px; margin: 0 auto; padding: 16px; }
.app-title { font-size: 20px; margin: 8px 0 12px; }
.app-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.nav-tab { border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.nav-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.status { padding: 32px 0; text-align: center; color: #718096; }
.status.error { color: #c53030; }
.updated-at { color: #718096; font-size: 13px; margin: 0 0 12px; }
.round-selector { width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 8px; font-size: 15px; margin-bottom: 16px; background: #fff; }
.speetto-page h2 { font-size: 16px; margin: 20px 0 10px; }
.region-stats { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.region-bar { display: flex; align-items: center; gap: 8px; width: 100%; border: none; background: none; padding: 4px; cursor: pointer; text-align: left; }
.region-bar.active .region-name { font-weight: 700; color: var(--accent); }
.region-name { width: 48px; font-size: 14px; flex: none; }
.region-track { flex: 1; background: var(--line); border-radius: 4px; height: 14px; overflow: hidden; }
.region-fill { display: block; height: 100%; background: var(--accent); }
.region-count { width: 28px; text-align: right; font-size: 13px; flex: none; }
.store-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.store-item { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: #fff; }
.store-head { display: flex; justify-content: space-between; font-size: 12px; color: #718096; }
.store-rank { color: var(--accent); font-weight: 700; }
.store-name { font-weight: 600; margin: 2px 0; }
.store-addr { font-size: 13px; color: #4a5568; }
.empty { padding: 16px 0; text-align: center; color: #a0aec0; }
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/App.test.jsx`
Expected: PASS (2 케이스).

- [ ] **Step 7: 전체 테스트 + 빌드 확인**

Run: `npm test && npm run build`
Expected: 모든 테스트 PASS, `dist/` 생성 성공.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: add app shell with tab nav and speetto page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: GitHub Actions (수집 + 배포)

매일 스크래퍼를 돌려 JSON 갱신을 커밋하고, main 푸시 시 GitHub Pages로 배포.

**Files:**
- Create: `.github/workflows/scrape.yml`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- `scrape.yml`: cron(매일 00:00 UTC = 09:00 KST) + `workflow_dispatch`. 변경 시 `public/data/speetto.json` 커밋.
- `deploy.yml`: `push`(main) + `workflow_dispatch`. `npm ci → npm run build → dist` 업로드 → Pages 배포.

- [ ] **Step 1: `.github/workflows/scrape.yml` 작성**

```yaml
name: Scrape Speetto

on:
  schedule:
    - cron: '0 0 * * *'   # 매일 09:00 KST
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
      - run: node scripts/scrape-speetto.js
        env:
          MAX_ROUNDS: '30'
      - name: Commit updated data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data/speetto.json
          if git diff --staged --quiet; then
            echo "변경 없음"
          else
            git commit -m "data: update speetto winning stores"
            git push
          fi
```

- [ ] **Step 2: `.github/workflows/deploy.yml` 작성**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: 워크플로 YAML 문법 점검**

Run: `node -e "const fs=require('fs');for(const f of ['.github/workflows/scrape.yml','.github/workflows/deploy.yml']){const t=fs.readFileSync(f,'utf8');if(!t.includes('runs-on: ubuntu-latest'))throw new Error('bad '+f);console.log('ok',f)}"`
Expected: `ok .github/workflows/scrape.yml` / `ok .github/workflows/deploy.yml`.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/scrape.yml .github/workflows/deploy.yml
git commit -m "ci: add scrape and GitHub Pages deploy workflows

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: 배포 연결 + 로컬 종단 확인 (사용자 협조 필요)

GitHub 저장소를 만들고 Pages를 켜서 실제 배포를 확인한다. 이 Task는 사용자의 GitHub 계정 작업이 필요하므로, 에이전트는 명령을 준비하고 사용자가 실행/확인한다.

**Files:** (없음 — 설정/배포 작업)

- [ ] **Step 1: 로컬 프리뷰로 종단 동작 확인**

Run: `npm run build && npm run preview`
브라우저에서 출력된 주소를 열어 확인:
- "스피또 당첨 지역" 탭에 회차 드롭다운, 지역별 막대, 판매점 목록이 보인다.
- 회차를 바꾸면 집계/목록이 바뀐다.
- 지역 막대를 클릭하면 그 지역만 필터된다.
- 다른 탭은 "준비중입니다".

- [ ] **Step 2: 사용자에게 GitHub 저장소 생성 요청**

사용자가 실행(에이전트는 안내만):
```
! gh repo create <원하는-이름> --public --source=. --remote=origin --push
```
(`gh` 미설치 시: github.com에서 빈 저장소 생성 후 `git remote add origin <url> && git push -u origin main`)

- [ ] **Step 3: GitHub Pages 활성화 안내**

저장소 → Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정.

- [ ] **Step 4: 배포 확인**

`Deploy to GitHub Pages` 워크플로가 성공하면 `https://<사용자>.github.io/<저장소>/`에서 사이트 확인. (base `'./'` 이므로 하위 경로에서도 자산/데이터 로딩 정상.)

- [ ] **Step 5: 수동 스크래핑 1회 실행 확인**

Actions → `Scrape Speetto` → Run workflow 실행 → 데이터 변경 시 자동 커밋되는지 확인.

---

## Self-Review

**Spec coverage:**
- 전체 구조(정적 React + Actions 수집) → Task 1, 11. ✅
- 스크래퍼(`scripts/`, 게임 3종, 지역 추출, JSON 저장) → Task 8, 9. ✅
- speetto.json 형식(`updatedAt`, `stores[].{game,round,rank,store,address,region}`) → Task 8, 9. ✅
- GitHub Actions(매일 + 수동, 변경 시 커밋, Pages 재배포) → Task 11. ✅
- Vite+React, 가벼운 CSS, 탭 셸 + 준비중 메뉴 → Task 1, 10. ✅
- 페이지 구성(업데이트 시각, 회차 선택, 회차별 지역 집계, 지역 필터, 판매점 목록) → Task 4–7. ✅
- 컴포넌트 분리(App/SpeettoPage/RoundSelector/RegionStats/StoreList/useSpeettoData) → Task 3–7, 10. ✅
- 에러 처리(로딩 실패, 빈 데이터, 스크래퍼 실패 시 기존 JSON 보존) → Task 3, 5, 7, 9. ✅

**Placeholder scan:** "임시" 주석 1곳은 동행복권 원본 JS의 흔적을 옮긴 게 아니라 스크래퍼 쿠키 주석 — 실제 동작 코드. TBD/TODO 없음. ✅

**Type consistency:** store 객체 키(`game/round/rank/store/address/region`)가 Task 2/3/5/6/7/8/9 전체에서 일치. 회차 선택 value 형식 `"game#round"`가 Task 4(생성)·Task 7(파싱)에서 일치. 집계 함수명(`listRounds/filterByRound/aggregateByRegion/filterByRegion`)이 Task 2 정의와 Task 7 사용에서 일치. ✅

## 범위 밖 (이번 작업 아님)

- 로또 번호 추천, 띠별 번호, 사주 기반 번호 추천(탭 자리만 "준비중").
- 지도 표시(데이터에 좌표는 있으나 이번엔 미사용).
- 서버리스 실시간 조회.
