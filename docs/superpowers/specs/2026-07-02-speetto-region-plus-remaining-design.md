# 스피또: 당첨 지역 + 1등 잔여 통합 설계

날짜: 2026-07-02

## 배경

이전에 스피또 페이지는 "당첨 지역"(당첨 판매점·주소·지역)을 보여주는 것이 메인이었다.
이후 커밋들(`323e406`, `b7a133d`, `1f02ce7`, `183cbf4`)에서 당첨 지역 파이프라인
(컴포넌트 `RegionStats`/`StoreList`/`RoundSelector`, `lib/aggregate.js`,
winning-store 스크래퍼, `stores[]` 데이터)을 제거하고 "1등 잔여 현황"만
남기도록 교체되었다. 사용자는 당첨 지역을 메인으로 다시 살리되, 새로 추가된
1등 잔여 현황도 함께 유지하기를 원한다.

## 목표

한 스피또 페이지에서 두 기능을 모두 제공한다.

- 당첨 지역 (메인, 기본 표시): 게임/회차별 당첨 판매점 목록 + 지역별 집계 막대
- 1등 잔여 현황: 판매중이면서 1등이 남은 회차 카드 목록

## 데이터

두 기능은 dhlottery.co.kr의 서로 다른 API에서 온다.

- `stores` ← `/wnprchsplcsrch/` (`selectStEpsdInfo.do`, `selectStWnShp.do`):
  당첨 판매점 이름·주소·지역·등수
- `rounds` ← `/st/selectPblcnDsctn.do`: 회차별 상태와 1등 잔여/총 매수

`scripts/scrape-speetto.js`가 두 소스를 모두 수집해 하나의 파일로 저장한다.

```json
{ "updatedAt": "...", "rounds": [ ... ], "stores": [ ... ] }
```

**완결성 가드:** `rounds`와 `stores` 중 하나라도 불완전하면 스크래퍼는
`exit(1)`로 종료하여 기존 JSON을 보존한다.

### normalize 모듈

- `scripts/speetto-normalize.js` — 1등 잔여(`rounds`). 현행 유지.
- `scripts/speetto-store-normalize.js` — 당첨 판매점(`stores`). 예전 `normalize.js`
  로직 복원(파일명 충돌 회피 위해 개명): `GAME_CODES`(LP35/LP34/LP33),
  `resolveRegion`, `extractEpisodes`, `normalizeStores`, `isCompleteScrape`.

## 프론트엔드

### hook

`useSpeettoData` — `{ loading, error, updatedAt, rounds, stores }` 모두 노출.

### lib

- `src/lib/speetto.js` — `GAME_TABS`, `sellingWithRank1`. 현행 유지.
- `src/lib/aggregate.js` — 복원: `listRounds`, `filterByRound`,
  `aggregateByRegion`, `filterByRegion`. store 배열 위에서 동작하므로
  선택된 게임의 stores로 스코프하여 재사용.

### 컴포넌트

- `SpeettoRoundCard` — 현행 유지(1등 잔여 카드).
- `RegionStats`, `StoreList`, `RoundSelector` — 복원.

### SpeettoPage 구조

```
[스피또2000] [스피또1000] [스피또500]     ← 게임 탭(공통)
[ 당첨 지역 ] [ 1등 잔여 ]                 ← 모드 탭(기본: 당첨 지역)
──────────────────────────────
당첨 지역 모드:
  회차 선택(전체/회차)  → RoundSelector
  지역 막대(클릭 필터)  → RegionStats
  판매점 목록           → StoreList
1등 잔여 모드:
  sellingWithRank1 → SpeettoRoundCard 목록
```

- 게임 탭: `GAME_TABS`의 `code`로 선택. `rounds`는 `gameCode`,
  `stores`는 게임명(`game`)으로 매칭하므로 선택 탭의 `name`으로 stores 필터.
- 당첨 지역 모드는 선택 게임의 stores만 대상으로 회차/지역 필터 적용.

### 스타일 / 진입점

- `src/App.css` — 제거됐던 `.region-*`, `.store-*`, `.empty`,
  `.round-selector`, `.speetto-page h2` 복원 + `.mode-tabs` 추가.
- `src/App.jsx` — 스피또 탭 라벨 "스피또 당첨 지역"으로 복귀.

## 테스트

- `speetto-store-normalize.test.js` — 복원.
- `aggregate.test.js` — 복원.
- `RegionStats`/`StoreList`/`RoundSelector` 테스트 — 복원.
- `useSpeettoData.test.js` — `stores` 노출 반영.
- `SpeettoPage.test.jsx` — 모드 탭(당첨 지역 기본 + 1등 잔여 전환) 반영.
- `App.test.jsx` — 라벨 변경 반영.

## 워크플로우

`.github/workflows/scrape.yml`는 이미 `scrape-speetto.js`를 실행하므로
구조 변경 없음. 스크래퍼가 두 소스를 함께 저장하도록만 바뀐다.

## 범위 밖 (YAGNI)

- 지역/판매점의 지도 시각화
- 회차 간 추이 그래프
- zodiac/saju 메뉴
