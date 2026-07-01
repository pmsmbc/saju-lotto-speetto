# 스피또 1등 잔여 현황 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스피또 탭을 게임별(2000/1000/500) 하위탭으로 나누고, 각 탭에 판매중이면서 1등 잔여>0인 회차만 "회차 + 1등 잔여/총 수량"으로 보여준다(기존 당첨판매점 화면·파이프라인은 완전 제거).

**Architecture:** Node 스크래퍼가 동행복권 발행내역 XHR(`/st/selectPblcnDsctn.do`)을 1회 호출해 전 회차 발행현황을 `public/data/speetto.json`으로 저장한다. React 앱은 그 JSON을 읽어 게임 하위탭 + 프런트 필터(판매중 & 1등 잔여>0)로 렌더한다. 기존 스피또와 동일 도구/패턴(상태 기반 탭, 가벼운 CSS).

**Tech Stack:** Node 20(내장 fetch), Vite 5, React 18, Vitest + @testing-library/react (jsdom). 기존 프로젝트에 추가/대체.

## Global Constraints

- 기존 프로젝트에 **대체**로 추가. 도구/패턴은 기존을 따른다: Vite 5, React 18, Vitest, 상태 기반 탭(라우터 없음), 가벼운 CSS(App.css), ES 모듈(`"type": "module"`), 세미콜론 없음, `export function` 스타일.
- 데이터 fetch 경로: `` `${import.meta.env.BASE_URL}data/speetto.json` `` (Vite base `'./'`).
- 게임 코드/이름: `SP2000`=스피또2000, `SP1000`=스피또1000, `SP500`=스피또500. 탭 순서 2000 → 1000 → 500.
- 데이터 소스(모두 GET): 쿠키 먼저 `GET /st/pblcnDsctn`로 획득(헤더 `User-Agent` 브라우저 문자열). 데이터 `GET /st/selectPblcnDsctn.do?gdsType=&gdsPrice=&gdsStatus=&pageNum=1&recordCountPerPage=100` (헤더 `User-Agent` + `X-Requested-With: XMLHttpRequest` + `Referer: https://www.dhlottery.co.kr/st/pblcnDsctn` + 세션 `Cookie`). 응답 `{data:{list:[…]}}`.
- API `list[]` 필드: `ntslStatus`("판매중"|"판매종료"), `stGmTypeCd`("SP2000"|"SP1000"|"SP500"), `stGmTypeNm`(게임명), `stEpsd`(회차 Number), `stRnk1Rt`("N매/M매"). 나머지(2·3등·입고율·당첨금·종료일)는 사용 안 함.
- `speetto.json` 형식: `{ updatedAt:ISO, rounds:[{ game, gameCode, round, status, rank1Remaining, rank1Total }] }`. `rounds`에는 모든 상태의 모든 회차를 담고, 화면 필터는 프런트에서 수행.
- 필터 규칙: 화면에는 `status==='판매중' && rank1Remaining>0`인 회차만, 회차 **내림차순**.
- 표시 항목: **회차 + "1등 잔여 {잔여}매/{총}매"** 만. (당첨금·종료일·2·3등 표시 안 함.)
- App 스피또 탭 라벨: **`스피또 1등 잔여`** (탭 id는 `speetto` 유지).
- 커밋 메시지 끝에: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- 작업 브랜치: `feature/speetto-status` (이미 생성됨). 브랜치 전환 금지.
- npm `scrape` 스크립트(`node scripts/scrape-speetto.js`)와 워크플로 `Scrape Speetto`·`deploy.yml` 연결은 스크래퍼 경로 재사용으로 **유지**(수정 불필요).

---

### Task 1: 발행현황 정규화 순수 함수 (`scripts/speetto-normalize.js`)

API 응답을 회차 객체로 바꾸고 완전성을 검증하는 순수 함수를 TDD한다.

**Files:**
- Create: `scripts/speetto-normalize.js`
- Test: `scripts/speetto-normalize.test.js`

**Interfaces:**
- Produces:
  - `parseRnkRate(text) → { remaining:Number, total:Number }` — `"7매/8매"` 파싱. 형식 불일치 시 `{ remaining:0, total:0 }`.
  - `parseRecord(raw) → { game, gameCode, round, status, rank1Remaining, rank1Total }`.
  - `buildStatus(list) → { rounds:[…] }` — `round` 내림차순 정렬. (`updatedAt`은 스크래퍼가 부착.)
  - `isCompleteSpeettoStatus(payload) → boolean` — `rounds` 1개 이상, 세 게임코드(SP2000/SP1000/SP500) 모두 존재, 각 `round` 유한수 & `rank1Total >= rank1Remaining >= 0`.

- [ ] **Step 1: 실패하는 테스트 작성 (`scripts/speetto-normalize.test.js`)**

```js
import { describe, test, expect } from 'vitest'
import { parseRnkRate, parseRecord, buildStatus, isCompleteSpeettoStatus } from './speetto-normalize.js'

const raw2000 = { ntslStatus: '판매중', stGmTypeCd: 'SP2000', stGmTypeNm: '스피또2000', stEpsd: 68, stRnk1Rt: '7매/8매' }
const raw1000 = { ntslStatus: '판매중', stGmTypeCd: 'SP1000', stGmTypeNm: '스피또1000', stEpsd: 107, stRnk1Rt: '9매/12매' }
const raw500 = { ntslStatus: '판매종료', stGmTypeCd: 'SP500', stGmTypeNm: '스피또500', stEpsd: 47, stRnk1Rt: '0매/5매' }

describe('parseRnkRate', () => {
  test('"7매/8매" → {remaining:7,total:8}', () => {
    expect(parseRnkRate('7매/8매')).toEqual({ remaining: 7, total: 8 })
  })
  test('형식 이상은 {0,0}', () => {
    expect(parseRnkRate('')).toEqual({ remaining: 0, total: 0 })
    expect(parseRnkRate(undefined)).toEqual({ remaining: 0, total: 0 })
    expect(parseRnkRate('없음')).toEqual({ remaining: 0, total: 0 })
  })
})

describe('parseRecord', () => {
  test('원시 레코드를 정규화', () => {
    expect(parseRecord(raw2000)).toEqual({
      game: '스피또2000', gameCode: 'SP2000', round: 68,
      status: '판매중', rank1Remaining: 7, rank1Total: 8,
    })
  })
})

describe('buildStatus', () => {
  test('round 내림차순 정렬', () => {
    const { rounds } = buildStatus([raw2000, raw1000, raw500])
    expect(rounds.map((r) => r.round)).toEqual([107, 68, 47])
  })
})

describe('isCompleteSpeettoStatus', () => {
  test('세 게임 모두 있고 값이 유효하면 true', () => {
    expect(isCompleteSpeettoStatus(buildStatus([raw2000, raw1000, raw500]))).toBe(true)
  })
  test('빈 목록은 false', () => {
    expect(isCompleteSpeettoStatus(buildStatus([]))).toBe(false)
  })
  test('게임 종류가 부족하면 false', () => {
    expect(isCompleteSpeettoStatus(buildStatus([raw2000, raw1000]))).toBe(false)
  })
  test('잔여>총 역전 값이면 false', () => {
    const bad = { ...raw2000, stRnk1Rt: '9매/8매' }
    expect(isCompleteSpeettoStatus(buildStatus([bad, raw1000, raw500]))).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run scripts/speetto-normalize.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`scripts/speetto-normalize.js`)**

```js
const GAME_CODES = new Set(['SP2000', 'SP1000', 'SP500'])

export function parseRnkRate(text) {
  const m = /^(\d+)매\/(\d+)매$/.exec(String(text ?? '').trim())
  if (!m) return { remaining: 0, total: 0 }
  return { remaining: Number(m[1]), total: Number(m[2]) }
}

export function parseRecord(raw) {
  const { remaining, total } = parseRnkRate(raw.stRnk1Rt)
  return {
    game: raw.stGmTypeNm,
    gameCode: raw.stGmTypeCd,
    round: Number(raw.stEpsd),
    status: raw.ntslStatus,
    rank1Remaining: remaining,
    rank1Total: total,
  }
}

export function buildStatus(list) {
  const rounds = (list ?? []).map(parseRecord).sort((a, b) => b.round - a.round)
  return { rounds }
}

export function isCompleteSpeettoStatus(payload) {
  const rounds = payload?.rounds
  if (!Array.isArray(rounds) || rounds.length === 0) return false
  const seen = new Set()
  for (const r of rounds) {
    if (!Number.isFinite(r.round)) return false
    if (!(r.rank1Total >= r.rank1Remaining && r.rank1Remaining >= 0)) return false
    if (GAME_CODES.has(r.gameCode)) seen.add(r.gameCode)
  }
  return seen.size === GAME_CODES.size
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run scripts/speetto-normalize.test.js`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add scripts/speetto-normalize.js scripts/speetto-normalize.test.js
git commit -m "feat: add speetto issuance-status normalization helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 스크래퍼 교체 + 옛 정규화 제거 + 시드 데이터 (`scripts/scrape-speetto.js`)

기존 당첨판매점 스크래퍼를 발행현황 스크래퍼로 교체하고, 실행해 새 `speetto.json`을 생성한다.

**Files:**
- Modify(내용 전체 교체): `scripts/scrape-speetto.js`
- Delete: `scripts/normalize.js`, `scripts/normalize.test.js`
- Overwrite(스크래퍼 실행 결과): `public/data/speetto.json`

**Interfaces:**
- Consumes: `buildStatus`, `isCompleteSpeettoStatus` (from `./speetto-normalize.js`).

- [ ] **Step 1: 옛 정규화 파일 삭제**

```bash
git rm scripts/normalize.js scripts/normalize.test.js
```

- [ ] **Step 2: 스크래퍼 내용 교체 (`scripts/scrape-speetto.js` 전체를 아래로)**

```js
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStatus, isCompleteSpeettoStatus } from './speetto-normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const OUT = fileURLToPath(new URL('../public/data/speetto.json', import.meta.url))

async function getCookie() {
  const res = await fetch(`${BASE}/st/pblcnDsctn`, { headers: { 'User-Agent': UA } })
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function getJson(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE}/st/pblcnDsctn`,
      Cookie: cookie,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

async function main() {
  const cookie = await getCookie()
  const json = await getJson(
    '/st/selectPblcnDsctn.do?gdsType=&gdsPrice=&gdsStatus=&pageNum=1&recordCountPerPage=100',
    cookie,
  )
  const list = json?.data?.list ?? []
  const status = buildStatus(list)

  if (!isCompleteSpeettoStatus(status)) {
    console.error('스크래프 결과가 불완전하거나 손상됨 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), ...status }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`총 ${status.rounds.length}개 회차 저장 → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: 스크래퍼 실행해 시드 생성**

Run: `npm run scrape`
Expected: `총 N개 회차 저장 → …/public/data/speetto.json` 출력. `public/data/speetto.json`이 새 shape로 갱신됨.

주의(네트워크): 이 스크래퍼는 라이브 dhlottery API를 호출한다. 환경에 네트워크가 없거나 API가 비정상이면 `isCompleteSpeettoStatus` 가드로 exit(1)되고 JSON은 갱신되지 않는다. 그럴 경우 스크래퍼 코드/삭제는 커밋하되(코드는 정상), 시드 갱신 실패를 **DONE_WITH_CONCERNS**로 정확한 에러와 함께 보고한다. 손으로 JSON을 만들지 말 것. 가드를 완화하지 말 것.

- [ ] **Step 4: 생성된 JSON 검증**

Run: `node -e "const d=require('./public/data/speetto.json'); const g=new Set(d.rounds.map(r=>r.gameCode)); const ok=d.rounds.every(r=>Number.isFinite(r.round)&&r.rank1Total>=r.rank1Remaining&&r.rank1Remaining>=0); console.log('rounds',d.rounds.length,'games',[...g],'valid',ok,'updatedAt',!!d.updatedAt)"`
Expected: `games`에 `SP2000,SP1000,SP500` 포함, `valid true`, `updatedAt true`.

- [ ] **Step 5: 전체 테스트 재실행(회귀 확인)**

Run: `npm test`
Expected: 모든 테스트 PASS(옛 normalize 테스트는 삭제됨; 나머지 기존 테스트는 아직 그대로 통과).

- [ ] **Step 6: 커밋**

```bash
git add scripts/scrape-speetto.js public/data/speetto.json
git commit -m "feat: replace speetto scraper with issuance-status source

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 프런트 필터 로직 (`src/lib/speetto.js`)

게임 탭 정의와 화면 필터 순수 함수를 TDD한다.

**Files:**
- Create: `src/lib/speetto.js`
- Test: `src/lib/speetto.test.js`

**Interfaces:**
- Produces:
  - `GAME_TABS: [{ code:'SP2000', name:'스피또2000' }, { code:'SP1000', name:'스피또1000' }, { code:'SP500', name:'스피또500' }]`
  - `sellingWithRank1(rounds, gameCode) → round[]` — `gameCode` 일치 & `status==='판매중'` & `rank1Remaining>0`, 회차 내림차순.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/lib/speetto.test.js`)**

```js
import { describe, test, expect } from 'vitest'
import { GAME_TABS, sellingWithRank1 } from './speetto.js'

const rounds = [
  { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
  { game: '스피또2000', gameCode: 'SP2000', round: 67, status: '판매중', rank1Remaining: 0, rank1Total: 6 },
  { game: '스피또2000', gameCode: 'SP2000', round: 66, status: '판매종료', rank1Remaining: 3, rank1Total: 6 },
  { game: '스피또1000', gameCode: 'SP1000', round: 106, status: '판매중', rank1Remaining: 2, rank1Total: 12 },
  { game: '스피또1000', gameCode: 'SP1000', round: 107, status: '판매중', rank1Remaining: 9, rank1Total: 12 },
]

test('GAME_TABS는 3개 게임(2000/1000/500 순)', () => {
  expect(GAME_TABS.map((g) => g.code)).toEqual(['SP2000', 'SP1000', 'SP500'])
})

test('판매중 & 1등 잔여>0 만 (판매종료·잔여0 제외)', () => {
  expect(sellingWithRank1(rounds, 'SP2000')).toEqual([
    { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
  ])
})

test('회차 내림차순', () => {
  expect(sellingWithRank1(rounds, 'SP1000').map((r) => r.round)).toEqual([107, 106])
})

test('해당 게임 없으면 빈 배열', () => {
  expect(sellingWithRank1(rounds, 'SP500')).toEqual([])
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/speetto.test.js`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/lib/speetto.js`)**

```js
export const GAME_TABS = [
  { code: 'SP2000', name: '스피또2000' },
  { code: 'SP1000', name: '스피또1000' },
  { code: 'SP500', name: '스피또500' },
]

export function sellingWithRank1(rounds, gameCode) {
  return (rounds ?? [])
    .filter(
      (r) => r.gameCode === gameCode && r.status === '판매중' && r.rank1Remaining > 0,
    )
    .sort((a, b) => b.round - a.round)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/speetto.test.js`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/speetto.js src/lib/speetto.test.js
git commit -m "feat: add speetto game tabs and rank1-remaining filter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 데이터 로딩 훅 shape 변경 (`src/hooks/useSpeettoData.js`)

훅의 반환을 `stores` → `rounds`로 바꾸고 새 데이터 형식에 맞춘다.

**Files:**
- Modify(내용 전체 교체): `src/hooks/useSpeettoData.js`
- Modify(내용 전체 교체): `src/hooks/useSpeettoData.test.js`

**Interfaces:**
- Produces: `useSpeettoData() → { loading:boolean, error:string|null, updatedAt:string|null, rounds:array }`
  - fetch: `` `${import.meta.env.BASE_URL}data/speetto.json` ``
  - 성공: `loading=false, error=null, updatedAt=data.updatedAt, rounds=data.rounds`
  - 실패: `loading=false, error='데이터를 불러올 수 없습니다', updatedAt=null, rounds=[]`

- [ ] **Step 1: 테스트 교체 (`src/hooks/useSpeettoData.test.js` 전체를 아래로)**

```js
import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpeettoData } from './useSpeettoData.js'

describe('useSpeettoData', () => {
  afterEach(() => vi.restoreAllMocks())

  test('성공 시 rounds 반환', async () => {
    const data = { updatedAt: '2026-07-01T00:00:00Z', rounds: [{ gameCode: 'SP2000', round: 68 }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rounds).toEqual(data.rounds)
    expect(result.current.updatedAt).toBe('2026-07-01T00:00:00Z')
    expect(result.current.error).toBeNull()
  })

  test('실패 시 에러 메시지, rounds=[]', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { result } = renderHook(() => useSpeettoData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('데이터를 불러올 수 없습니다')
    expect(result.current.rounds).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/hooks/useSpeettoData.test.js`
Expected: FAIL — 기존 훅이 `rounds`를 반환하지 않음.

- [ ] **Step 3: 구현 교체 (`src/hooks/useSpeettoData.js` 전체를 아래로)**

```js
import { useEffect, useState } from 'react'

export function useSpeettoData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    updatedAt: null,
    rounds: [],
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
          rounds: data.rounds ?? [],
        })
      })
      .catch(() => {
        if (cancelled) return
        setState({ loading: false, error: '데이터를 불러올 수 없습니다', updatedAt: null, rounds: [] })
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
git commit -m "feat: change useSpeettoData to expose issuance rounds

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 회차 카드 컴포넌트 (`src/components/SpeettoRoundCard.jsx`)

회차 1개(회차 번호 + 1등 잔여/총)를 표시한다.

**Files:**
- Create: `src/components/SpeettoRoundCard.jsx`
- Test: `src/components/SpeettoRoundCard.test.jsx`

**Interfaces:**
- Produces: `<SpeettoRoundCard round={n} rank1Remaining={r} rank1Total={t} />` → `<div class="speetto-round"><span class="round-no">{n}회</span><span class="rank1-remain">1등 잔여 {r}매/{t}매</span></div>`.

- [ ] **Step 1: 실패하는 테스트 작성 (`src/components/SpeettoRoundCard.test.jsx`)**

```jsx
import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpeettoRoundCard } from './SpeettoRoundCard.jsx'

test('회차와 1등 잔여/총을 표시', () => {
  render(<SpeettoRoundCard round={68} rank1Remaining={7} rank1Total={8} />)
  expect(screen.getByText('68회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 7매/8매')).toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/SpeettoRoundCard.test.jsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성 (`src/components/SpeettoRoundCard.jsx`)**

```jsx
export function SpeettoRoundCard({ round, rank1Remaining, rank1Total }) {
  return (
    <div className="speetto-round">
      <span className="round-no">{round}회</span>
      <span className="rank1-remain">
        1등 잔여 {rank1Remaining}매/{rank1Total}매
      </span>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/SpeettoRoundCard.test.jsx`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/SpeettoRoundCard.jsx src/components/SpeettoRoundCard.test.jsx
git commit -m "feat: add SpeettoRoundCard component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: SpeettoPage 재작성 + CSS

훅·필터·카드를 묶어 게임 하위탭 페이지를 만든다.

**Files:**
- Modify(내용 전체 교체): `src/pages/SpeettoPage.jsx`
- Modify(내용 전체 교체): `src/pages/SpeettoPage.test.jsx`
- Modify: `src/App.css` (스피또 게임탭/회차 카드 스타일 추가)

**Interfaces:**
- Consumes: `useSpeettoData`, `GAME_TABS`, `sellingWithRank1` (from `../lib/speetto.js`), `SpeettoRoundCard`.
- Produces: `SpeettoPage` (named + default export), props 없음.

- [ ] **Step 1: 테스트 교체 (`src/pages/SpeettoPage.test.jsx` 전체를 아래로)**

```jsx
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpeettoPage } from './SpeettoPage.jsx'

const data = {
  updatedAt: '2026-07-01T00:00:00Z',
  rounds: [
    { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
    { game: '스피또2000', gameCode: 'SP2000', round: 67, status: '판매중', rank1Remaining: 0, rank1Total: 6 },
    { game: '스피또1000', gameCode: 'SP1000', round: 107, status: '판매중', rank1Remaining: 9, rank1Total: 12 },
    { game: '스피또500', gameCode: 'SP500', round: 47, status: '판매종료', rank1Remaining: 3, rank1Total: 5 },
  ],
}

afterEach(() => vi.restoreAllMocks())

test('기본 게임(2000) 탭에서 판매중&1등잔여>0 회차 표시, 잔여0 회차 제외', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  expect(screen.getByText('68회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 7매/8매')).toBeInTheDocument()
  expect(screen.queryByText('67회')).toBeNull()
})

test('게임 탭 전환 시 해당 게임 회차 표시', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또1000' }))
  expect(screen.getByText('107회')).toBeInTheDocument()
  expect(screen.getByText('1등 잔여 9매/12매')).toBeInTheDocument()
})

test('조건 맞는 회차 없으면 안내 (스피또500 판매종료만)', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: '스피또500' }))
  expect(screen.getByText('현재 1등이 남은 판매중 회차가 없습니다')).toBeInTheDocument()
})

test('로드 실패 시 에러', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(<SpeettoPage />)
  await waitFor(() => expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument())
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/pages/SpeettoPage.test.jsx`
Expected: FAIL — 기존 페이지 구조와 불일치(게임탭/카드 없음).

- [ ] **Step 3: 페이지 교체 (`src/pages/SpeettoPage.jsx` 전체를 아래로)**

```jsx
import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import { GAME_TABS, sellingWithRank1 } from '../lib/speetto.js'
import { SpeettoRoundCard } from '../components/SpeettoRoundCard.jsx'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function SpeettoPage() {
  const { loading, error, updatedAt, rounds } = useSpeettoData()
  const [gameCode, setGameCode] = useState(GAME_TABS[0].code)

  const list = useMemo(() => sellingWithRank1(rounds, gameCode), [rounds, gameCode])

  if (loading) return <p className="status">불러오는 중...</p>
  if (error) return <p className="status error">{error}</p>

  return (
    <section className="speetto-page">
      <p className="updated-at">마지막 업데이트: {formatDate(updatedAt)}</p>
      <nav className="game-tabs">
        {GAME_TABS.map((g) => (
          <button
            key={g.code}
            type="button"
            className={g.code === gameCode ? 'game-tab active' : 'game-tab'}
            onClick={() => setGameCode(g.code)}
          >
            {g.name}
          </button>
        ))}
      </nav>
      {list.length > 0 ? (
        <div className="speetto-rounds">
          {list.map((r) => (
            <SpeettoRoundCard
              key={r.round}
              round={r.round}
              rank1Remaining={r.rank1Remaining}
              rank1Total={r.rank1Total}
            />
          ))}
        </div>
      ) : (
        <p className="status">현재 1등이 남은 판매중 회차가 없습니다</p>
      )}
    </section>
  )
}

export default SpeettoPage
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/pages/SpeettoPage.test.jsx`
Expected: PASS (4 케이스).

- [ ] **Step 5: 스피또 CSS 추가 (`src/App.css` 끝에 append)**

```css
/* --- Speetto 1등 잔여 --- */
.game-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.game-tab { border: 1px solid #cbd5e0; background: #fff; color: #4a5568; border-radius: 999px; padding: 6px 14px; font-size: 14px; cursor: pointer; }
.game-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.speetto-rounds { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.speetto-round { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
.speetto-round .round-no { font-weight: 700; font-size: 15px; color: #1a202c; }
.speetto-round .rank1-remain { font-size: 14px; color: #c05621; font-weight: 600; }
```

- [ ] **Step 6: 페이지 테스트 재확인 + 커밋**

Run: `npx vitest run src/pages/SpeettoPage.test.jsx`
Expected: PASS.

```bash
git add src/pages/SpeettoPage.jsx src/pages/SpeettoPage.test.jsx src/App.css
git commit -m "feat: rebuild SpeettoPage as game tabs with rank1-remaining rounds

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: App 탭 라벨 변경 + 옛 컴포넌트 제거 + 전체 검증

App 탭 라벨을 바꾸고, 이제 참조되지 않는 옛 파일들을 삭제한 뒤 전체 테스트·빌드로 검증한다.

**Files:**
- Modify: `src/App.jsx` (탭 라벨)
- Modify: `src/App.test.jsx` (fetch stub shape 갱신)
- Delete: `src/lib/aggregate.js`, `src/lib/aggregate.test.js`, `src/components/RoundSelector.jsx`, `src/components/RoundSelector.test.jsx`, `src/components/RegionStats.jsx`, `src/components/RegionStats.test.jsx`, `src/components/StoreList.jsx`, `src/components/StoreList.test.jsx`

**Interfaces:**
- Consumes: `SpeettoPage`(재작성됨, Task 6). 삭제 파일들은 어디에서도 import되지 않음(SpeettoPage 재작성으로 고아화됨).

- [ ] **Step 1: App 탭 라벨 변경 (`src/App.jsx`)**

기존 TABS의 speetto 라벨 한 줄:
```jsx
  { id: 'speetto', label: '스피또 당첨 지역' },
```
다음으로 변경:
```jsx
  { id: 'speetto', label: '스피또 1등 잔여' },
```

- [ ] **Step 2: App 테스트 fetch stub 갱신 (`src/App.test.jsx` 전체를 아래로)**

```jsx
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.restoreAllMocks())

test('기본으로 스피또 페이지를 보여준다', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ updatedAt: '2026-07-01T00:00:00Z', rounds: [] }),
  }))
  render(<App />)
  await waitFor(() => expect(screen.getByText(/마지막 업데이트/)).toBeInTheDocument())
})

test('준비중 메뉴 클릭 시 안내 표시', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ updatedAt: null, rounds: [] }),
  }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '오늘의 띠별 번호' }))
  expect(screen.getByText('준비중입니다')).toBeInTheDocument()
})
```

- [ ] **Step 3: 옛 컴포넌트/집계 파일 삭제**

```bash
git rm src/lib/aggregate.js src/lib/aggregate.test.js \
  src/components/RoundSelector.jsx src/components/RoundSelector.test.jsx \
  src/components/RegionStats.jsx src/components/RegionStats.test.jsx \
  src/components/StoreList.jsx src/components/StoreList.test.jsx
```

- [ ] **Step 4: 전체 테스트 + 빌드 확인**

Run: `npm test && npm run build`
Expected: 모든 테스트 PASS(삭제된 옛 테스트 없음, 새 스피또/로또 테스트 포함), `dist/` 생성. 삭제한 모듈을 참조하는 import 오류가 없어야 함(있으면 누락된 참조를 찾아 정리).

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx src/App.test.jsx
git commit -m "feat: relabel speetto tab and remove old winning-store pipeline

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- 게임별 하위탭(2000/1000/500) → Task 3(GAME_TABS), Task 6(탭 UI). ✅
- 판매중 & 1등 잔여>0 필터 → Task 3(sellingWithRank1), Task 6. ✅
- 회차 + 1등 잔여/총만 표시 → Task 5(카드), Task 6. ✅
- 데이터 소스(/st/selectPblcnDsctn.do, 쿠키 /st/pblcnDsctn) → Task 2. ✅
- speetto.json 새 형식 → Task 1(buildStatus), Task 2(저장). ✅
- 완전성 가드로 기존 JSON 보존 → Task 1(isCompleteSpeettoStatus), Task 2. ✅
- 훅 shape 변경 → Task 4. ✅
- 탭 라벨 `스피또 1등 잔여` → Task 7. ✅
- 기존 파이프라인 완전 제거(normalize/aggregate/RoundSelector/RegionStats/StoreList) → Task 2(normalize), Task 7(나머지). ✅
- 워크플로/배포 연결 유지(스크래퍼 경로/npm scrape 재사용) → 수정 불필요(Global Constraints 명시). ✅

**Placeholder scan:** TBD/TODO 없음. 모든 코드/명령 구체화됨. ✅

**Type consistency:**
- 회차 객체 키(`game/gameCode/round/status/rank1Remaining/rank1Total`)가 Task 1/3/5/6 전반 일치. ✅
- `buildStatus`→`{rounds}`, 스크래퍼가 `updatedAt` 부착 → `speetto.json {updatedAt,rounds}` → `useSpeettoData` 반환 `{loading,error,updatedAt,rounds}` → `sellingWithRank1(rounds,gameCode)` → `SpeettoRoundCard({round,rank1Remaining,rank1Total})` 시그니처 일치. ✅
- `GAME_TABS[].code`(SP2000/1000/500)가 데이터 `gameCode` 및 필터 인자와 일치. ✅
- 삭제 파일은 재작성된 SpeettoPage에서 더 이상 import되지 않음(Task 6 이후 고아). ✅

## 범위 밖 (이번 작업 아님)
- 2·3등 잔여, 입고율, 1등 당첨금·판매종료일 표시.
- 지역별 집계/당첨판매점(제거됨), 판매종료·과거 회차 노출.
- 띠별/사주 메뉴.
