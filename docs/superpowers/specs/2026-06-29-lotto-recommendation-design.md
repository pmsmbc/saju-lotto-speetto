# 로또 번호 추천 — 설계 문서

작성일: 2026-06-29

## 배경 / 목표

사주 + 로또/스피또 정보 사이트의 두 번째 기능. 앱 셸의 `lotto` 탭("로또 번호 추천", 현재 "준비중")을 실제 기능으로 채운다.

두 가지 추천을 제공한다:
1. **랜덤 추천** — 1~45 균등 무작위 6개 (데이터 불필요)
2. **통계 기반 추천(빈도 가중 랜덤)** — 과거 당첨번호 출현 빈도에 비례한 확률로 6개 추출

한 번에 **5세트**(A~E, 실제 로또 용지 형태)를 추천한다.

기존 스피또 기능과 동일한 아키텍처(정적 React + GitHub Actions 수집 + GitHub Pages)를 따른다.

## 전체 구조

```
[GitHub Actions: scrape-lotto] --주1회(일요일)--> 동행복권 로또 전회차 수집
        → 번호별 출현 빈도표 계산 → public/data/lotto-stats.json (커밋)
                                              │
[사용자] --> LottoPage --읽기--> lotto-stats.json
        → "랜덤 추천" / "통계 기반 추천" 5세트 표시
```

- 로또는 주 1회(토요일) 추첨 → 주간 수집으로 충분.
- 무거운 작업(전 회차 수집·빈도 계산)은 Actions에서. 프론트는 작은 빈도표만 받아 브라우저에서 추첨.
- 서버 없음.

## 데이터 소스 (검증 완료)

동행복권 로또 회차/당첨번호 JSON API:

- 회차 목록: `GET /lt645/selectLtEpsdInfo.do?ltGmTypeCd=lt645` → `{data:{list:[{ltEpsd, ltRflYmd, ...}]}}` (최신 회차 확인용; 최신 1230회 = 2026-06-27)
- 당첨번호: `GET /lt645/selectPstLt645InfoNew.do`
  - 시작: `?srchDir=center&srchLtEpsd=<N>` → 그 회차부터 내림차순 한 페이지
  - 과거로 페이징: `?srchDir=older&srchCursorLtEpsd=<가장오래된회차>` → 더 과거 한 페이지
  - 각 항목 필드: `ltEpsd`(회차), `tm1WnNo`~`tm6WnNo`(당첨번호 6개), `bnsWnNo`(보너스), `ltRflYmd`(추첨일 YYYYMMDD)
- 호출 시 `/lt645/result`에서 세션 쿠키 획득 후, 헤더에 `User-Agent` + `X-Requested-With: XMLHttpRequest` + `Referer: https://www.dhlottery.co.kr/lt645/result` + `Cookie` 필요.
- 구현 시 실제 페이지 크기/페이징 종료 조건은 응답으로 확인한다(빈 list가 나오면 종료).

## 데이터 파일: `public/data/lotto-stats.json`

```json
{
  "updatedAt": "2026-06-29T03:00:00Z",
  "latestRound": 1230,
  "latestDraw": { "round": 1230, "numbers": [3, 8, 9, 22, 28, 42], "bonus": 45, "date": "2026-06-27" },
  "totalDraws": 1230,
  "frequencies": { "1": 170, "2": 165, "...": "...", "45": 180 }
}
```

- `frequencies`: 키 "1"~"45", 값은 해당 번호가 당첨번호(보너스 제외)로 나온 누적 횟수. 통계 추천의 가중치 + 화면의 "자주/안 나온 번호" 표시에 사용.
- `latestDraw`: 지난 회차 당첨번호 표시용. `numbers`는 오름차순 6개.
- `totalDraws`, `latestRound`: 메타 정보 표시용.

## 추천 로직: `src/lib/lotto.js` (순수 함수)

- `randomSet(rng) → number[]` — 1~45 균등 무작위, 서로 다른 6개, 오름차순.
- `weightedSet(frequencies, rng) → number[]` — 빈도 비례 확률로 비복원 추출 6개, 오름차순. `frequencies`는 `{ "1": n, ... }` 또는 길이 46 배열 형태를 받아 내부에서 정규화.
- `recommendSets({ count, mode, frequencies, rng }) → number[][]` — `mode`가 `'random'`이면 `randomSet`, `'weighted'`이면 `weightedSet`로 `count`세트 생성.
- `hotCold(frequencies, n) → { hot: number[], cold: number[] }` — 빈도 상위 n개(hot) / 하위 n개(cold).
- **RNG 주입**: 모든 함수는 `rng = Math.random` 기본 인자를 받되, 테스트에서 결정적 함수를 주입해 검증한다. (주의: 워크플로 스크립트가 아닌 브라우저/테스트에서만 실행되므로 `Math.random` 사용 가능.)
- 불변식: 각 세트는 정확히 6개, 모두 1~45, 중복 없음, 오름차순.

## 화면: `src/pages/LottoPage.jsx`

1. 상단: "지난 N회 당첨번호" — 당첨 공 6개 + 보너스 공. (`latestDraw` 사용)
2. 버튼 2개: **[랜덤 추천 5세트]**, **[통계 기반 추천 5세트]**.
3. 결과: A~E 5세트, 각 6개 공.
4. 보조: "자주 나온 번호 / 안 나온 번호" 상위 5개씩(`hotCold`).
5. 번호 공 색상(실제 로또 관습): 1–10 노랑, 11–20 파랑, 21–30 빨강, 31–40 회색, 41–45 초록.

### 동작/에러 처리

- "랜덤 추천"은 데이터 불필요 → stats 로딩 실패와 무관하게 **항상 동작**.
- "통계 기반 추천" 버튼은 stats가 있어야 활성화. 로딩 중/실패 시 비활성 + "통계 데이터를 불러올 수 없습니다" 안내.
- 상단 "지난 회차 당첨번호"와 hot/cold는 stats 있을 때만 표시.

## 컴포넌트 분리

- `LottoPage` — 데이터 훅 + 추천 상태 관리 + 조립.
- `LottoBall` — 번호 공 1개(색상 규칙 포함, 재사용).
- `NumberSet` — 공 6개 한 세트(라벨 A~E 등).
- `useLottoStats` — `lotto-stats.json` fetch 훅(스피또 훅과 동일 패턴: `{loading, error, stats}`).
- `src/lib/lotto.js` — 추천 로직(위).

## 데이터 수집: `scripts/scrape-lotto.js` + `scripts/lotto-normalize.js`

- `scripts/lotto-normalize.js`(순수, 테스트): 
  - `parseDraw(item) → { round, numbers:number[6] asc, bonus, date }`.
  - `computeFrequencies(draws) → { "1":n, ... "45":n }`.
  - `buildStats(draws) → { latestRound, latestDraw, totalDraws, frequencies }`.
  - `isCompleteLottoStats(stats)` 가드: `totalDraws > 0`, frequencies에 1~45 모두 존재, 합계 = `totalDraws*6`.
- `scripts/scrape-lotto.js`(네트워크): 쿠키 획득 → `selectPstLt645InfoNew.do`를 `older` 커서로 끝까지 페이징하며 전 회차 수집 → `buildStats` → `isCompleteLottoStats` 통과 시에만 `public/data/lotto-stats.json` 저장(2-space + 개행). 0건/불완전이면 exit(1)로 기존 JSON 보존. 요청 사이 `SLEEP_MS`(기본 250ms) 대기.

## 자동화: `.github/workflows/scrape-lotto.yml`

- 트리거: 매주 일요일 cron(예: 일요일 00:00 UTC) + `workflow_dispatch`.
- 동작: 스크래퍼 실행 → `lotto-stats.json` 변경 시 커밋·푸시.
- 재배포: 기존 `deploy.yml`의 `on.workflow_run.workflows` 목록에 이 워크플로명(`"Scrape Lotto"`)을 **추가**해, 수집 후 자동 재배포.

## 테스트

- `src/lib/lotto.js`: 주입 rng로 결정적 검증(세트 크기 6, 범위/중복/정렬 불변식; weighted가 빈도 0 번호를 안 뽑고 높은 빈도를 선호; hotCold 정확성).
- `scripts/lotto-normalize.js`: parseDraw/computeFrequencies/buildStats/isCompleteLottoStats 단위 테스트.
- 컴포넌트: `LottoBall`(색상 클래스), `NumberSet`, `LottoPage`(랜덤은 항상 동작; 통계 버튼 stats 없을 때 비활성; 5세트 렌더), `useLottoStats`(성공/실패) — fetch mock.

## 범위 밖 (이번 작업 아님)

- 띠별 추천 번호, 사주 기반 번호(별도 메뉴, 추후).
- 당첨 시뮬레이션/예측 정확도 주장(로또는 무작위 — 통계는 재미 요소).
- 연금복권 등 다른 복권.
