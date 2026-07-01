# 스피또 1등 잔여 현황 설계 (기존 당첨판매점 화면 대체)

작성일: 2026-07-01

## 목표

스피또 탭을 게임별(2000/1000/500) 하위탭으로 나누고, 각 탭에 **현재 판매중이면서 1등이 아직 남은(1등 잔여 > 0)** 회차만 **회차 번호 + 1등 잔여/총 수량**으로 보여준다. 어떤 스피또를 사면 1등 기회가 남아있는지 판단하는 용도.

기존 "회차 선택 → 지역별 당첨 → 당첨판매점" 화면과 그 데이터 파이프라인은 **완전히 대체·제거**한다.

## 배경 / 데이터 소스 (검증 완료)

동행복권 발행내역 페이지(`https://www.dhlottery.co.kr/st/pblcnDsctn`)가 XHR로 호출하는 엔드포인트를 그대로 사용한다:

- 쿠키 획득: `GET /st/pblcnDsctn` (세션 쿠키)
- 데이터: `GET /st/selectPblcnDsctn.do?gdsType=&gdsPrice=&gdsStatus=&pageNum=1&recordCountPerPage=100`
  - 헤더: `User-Agent`(브라우저), `X-Requested-With: XMLHttpRequest`, `Referer: https://www.dhlottery.co.kr/st/pblcnDsctn`, 세션 `Cookie`
  - 응답: `{ data: { total:Number, list:[…], stRnkDate:[…] } }`. `total`(현재 29)이 작아 `recordCountPerPage=100` 한 번으로 전량 수집된다. `stRnkDate`는 사용하지 않는다.
- `list[]` 각 레코드의 사용 필드:
  - `ntslStatus`: `"판매중"` | `"판매종료"` — "발행 중" = `판매중`
  - `stGmTypeCd`: `"SP2000"` | `"SP1000"` | `"SP500"`
  - `stGmTypeNm`: `"스피또2000"` 등
  - `stEpsd`: 회차(Number)
  - `stRnk1Rt`: `"7매/8매"` 형식의 1등 잔여/총 문자열
  - (미사용: `stRnk2Rt`, `stRnk3Rt`, `stSpmtRt`(입고율), `rnk1Atm`(당첨금), `stNtslEndDt`(종료일) 등)

검증 시점 실데이터(판매중 & 1등 잔여>0): 스피또1000 107회(9/12)·106회(2/12), 스피또2000 68회(7/8), 스피또500 48회(5/5). (스피또2000 67회는 0/6이라 제외.)

## 아키텍처 / 데이터 흐름

```
scrape-speetto.js (GitHub Action, 일 1회 — 기존 "Scrape Speetto" 워크플로 재사용)
  → getCookie() → GET /st/selectPblcnDsctn.do (1회)
  → speetto-normalize.js 정규화 + 완전성 가드
  → public/data/speetto.json  { updatedAt, rounds:[…] }   (경로 재사용)
      → useSpeettoData() → { loading, error, updatedAt, rounds }
          → SpeettoPage: 게임 하위탭 상태 + lib/speetto.js 필터 → 목록/빈상태
```

기존 스피또와 동일 도구/패턴: Vite 5, React 18, Vitest, 상태 기반 탭(라우터 없음), 가벼운 CSS(App.css). ES 모듈, Node 20(스크래퍼 내장 fetch). Vite base `'./'`.

## 데이터 형식 (`public/data/speetto.json`, 새 shape)

```json
{
  "updatedAt": "2026-07-01T00:00:00.000Z",
  "rounds": [
    { "game": "스피또2000", "gameCode": "SP2000", "round": 68,
      "status": "판매중", "rank1Remaining": 7, "rank1Total": 8 }
  ]
}
```

- `rounds`에는 **모든 상태의 모든 회차**를 담는다(판매중/판매종료 구분은 `status` 필드로 보존). 화면 필터링은 프런트에서 수행한다 — 스크래퍼는 소스를 충실히 정규화만 한다.
- 표시하지 않는 필드(당첨금·종료일·입고율·2·3등)는 저장하지 않는다(YAGNI).

## 모듈 / 컴포넌트 (단위 분리)

### `scripts/speetto-normalize.js` (순수 함수, TDD)
- `parseRnkRate(text) → { remaining, total }` — `"7매/8매"` 파싱. 형식 불일치 시 `{ remaining: 0, total: 0 }`.
- `parseRecord(raw) → { game, gameCode, round, status, rank1Remaining, rank1Total }` — 위 필드 매핑.
- `buildStatus(list) → { rounds }` — `list`를 `parseRecord`로 매핑, `round` 내림차순 정렬. (`updatedAt`은 스크래퍼가 붙임.)
- `isCompleteSpeettoStatus(payload) → boolean` — `rounds` 배열이 1개 이상이고, 세 게임코드(SP2000/SP1000/SP500)가 모두 최소 1개씩 존재하며, 각 레코드의 `round`가 유한수 & `rank1Total >= rank1Remaining >= 0`. (불완전 시 스크래퍼가 exit(1)로 기존 JSON 보존.)

### `scripts/scrape-speetto.js` (기존 파일 내용 교체 — 경로/npm `scrape` 스크립트/워크플로 재사용)
1. `GET /st/pblcnDsctn`로 쿠키 확보.
2. `GET /st/selectPblcnDsctn.do?...recordCountPerPage=100`로 목록 fetch.
3. `buildStatus` → `isCompleteSpeettoStatus` 통과 시에만 `{ updatedAt: new Date().toISOString(), ...status }`를 `public/data/speetto.json`에 저장(2-space + 개행). 아니면 exit(1).

### `src/lib/speetto.js` (순수 함수)
- `GAME_TABS = [{ code:'SP2000', name:'스피또2000' }, { code:'SP1000', name:'스피또1000' }, { code:'SP500', name:'스피또500' }]`
- `sellingWithRank1(rounds, gameCode) → round[]` — `status==='판매중' && rank1Remaining > 0 && gameCode` 일치, `round` 내림차순.

### `src/hooks/useSpeettoData.js` (shape 변경, 이름 유지)
- fetch: `` `${import.meta.env.BASE_URL}data/speetto.json` ``
- 반환: `{ loading, error, updatedAt, rounds }`. 실패 시 `error='데이터를 불러올 수 없습니다', rounds=[]`.

### `src/components/SpeettoRoundCard.jsx`
- `<SpeettoRoundCard round={n} rank1Remaining={r} rank1Total={t} />` → `회차` 라벨 + `"1등 잔여 {r}매/{t}매"`.

### `src/pages/SpeettoPage.jsx`
- `useSpeettoData()` + 게임 하위탭 상태(`useState`, 기본 `SP2000`).
- 하위탭 네비게이션(3개 게임) + 선택 게임의 `sellingWithRank1` 목록.
- 로딩: "불러오는 중...". 에러: 에러 메시지. 목록 없음: "현재 1등이 남은 판매중 회차가 없습니다".
- 상단에 `마지막 업데이트` 표시(기존 패턴 유지).

### App 연결
- 탭 라벨 `스피또 당첨 지역` → `스피또 1등 잔여` (`src/App.jsx` TABS).
- `src/App.test.jsx`: 기본 스피또 페이지 렌더 검증을 새 화면 기준으로 갱신.

## 제거 대상 (완전 삭제)
- `scripts/normalize.js` (+ `scripts/normalize.test.js`)
- `src/lib/aggregate.js` (+ `src/lib/aggregate.test.js`)
- `src/components/RoundSelector.jsx`·`RegionStats.jsx`·`StoreList.jsx` (+ 각 test)
- 기존 `SpeettoPage`/`useSpeettoData` 내용(대체)
- 기존 `speetto.json`은 새 shape로 덮어씀(스크래퍼 실행 결과 커밋).
- 워크플로 `Scrape Speetto`와 `deploy.yml` `workflow_run` 연결은 **유지**(스크래퍼 경로 재사용).

## 에러 / 엣지 처리
- 로드 실패: 기존과 동일 메시지, 랜덤 로또와 무관.
- 특정 게임 탭에 조건 충족 회차 없음: 안내 문구.
- `parseRnkRate` 형식 이상: `{0,0}` → 잔여 0으로 간주되어 자연히 필터에서 제외.

## 테스트
- `speetto-normalize.test.js`: `parseRnkRate`(정상/이상), `parseRecord`, `buildStatus`(정렬), `isCompleteSpeettoStatus`(정상/빈/게임누락/역전값).
- `src/lib/speetto.test.js`: `sellingWithRank1`(판매중&잔여>0 필터, 게임별, 정렬, 판매종료·잔여0 제외).
- `SpeettoRoundCard.test.jsx`: 회차·잔여/총 렌더.
- `SpeettoPage.test.jsx`: 탭 전환, 조건 목록 렌더, 빈 상태, 로드 실패.
- `App.test.jsx`: 갱신.

## 범위 밖
- 2·3등 잔여, 입고율, 1등 당첨금·판매종료일 표시.
- 지역별 집계/당첨판매점(제거됨).
- 판매종료 회차 노출, 과거 회차 아카이브.
- 로또/띠별/사주 메뉴(별개).
