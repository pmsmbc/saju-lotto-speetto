import { isCompleteSpeettoStatus } from './speetto-normalize.js'
import { isCompleteScrape } from './speetto-store-normalize.js'

// 잔여 현황(rounds)이 불완전하면 null(기존 JSON 보존).
// 판매점(stores) 스크래핑만 불완전하면 기존 stores를 유지한 채 rounds/updatedAt을 갱신한다.
export function buildPayload({ rounds, stores, previous, gameNames, now }) {
  if (!isCompleteSpeettoStatus({ rounds })) return null

  const storesFellBack = !isCompleteScrape(stores, gameNames)
  return {
    payload: {
      updatedAt: now,
      rounds,
      stores: storesFellBack ? (previous?.stores ?? []) : stores,
    },
    storesFellBack,
  }
}
