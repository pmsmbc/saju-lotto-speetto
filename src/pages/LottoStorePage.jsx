import { useMemo, useState } from 'react'
import { useLottoStores } from '../hooks/useLottoStores.js'
import { formatDate } from './SpeettoPage.jsx'
import PageIntro from '../components/PageIntro.jsx'

const FIRST_VIEW = 20

export function LottoStorePage() {
  const { loading, error, data } = useLottoStores()
  const [region, setRegion] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const regions = useMemo(() => {
    const count = new Map()
    for (const s of data?.top ?? []) count.set(s.region, (count.get(s.region) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
  }, [data])

  const filtered = useMemo(
    () => (region ? (data?.top ?? []).filter((s) => s.region === region) : data?.top ?? []),
    [data, region],
  )
  const visible = expanded || region ? filtered : filtered.slice(0, FIRST_VIEW)

  if (loading) return <p className="status">불러오는 중...</p>
  if (error) return <p className="status error">{error}</p>

  return (
    <section className="store-page">
      <p className="updated-at">마지막 업데이트: {formatDate(data.updatedAt)}</p>
      <p className="store-summary">
        {data.fromDraw}회부터 {data.throughDraw}회까지 <strong>{data.coveredDraws.toLocaleString()}개 회차</strong>의
        1등 배출 기록 {data.totalRecords.toLocaleString()}건을 판매점별로 모았습니다.
      </p>

      <div className="tag-chips" role="group" aria-label="지역별 보기">
        <button
          type="button"
          className={region === null ? 'tag-chip active' : 'tag-chip'}
          aria-pressed={region === null}
          onClick={() => setRegion(null)}
        >
          전체 {data.top.length}
        </button>
        {regions.map(([name, n]) => (
          <button
            key={name}
            type="button"
            className={name === region ? 'tag-chip active' : 'tag-chip'}
            aria-pressed={name === region}
            onClick={() => setRegion(name === region ? null : name)}
          >
            {name} {n}
          </button>
        ))}
      </div>

      <ol className="store-rank">
        {visible.map((s) => (
          <li key={`${s.rank}-${s.name}`} className="store-item surface-card">
            <span className="store-rank-no">{s.rank}</span>
            <span className="store-body">
              <span className="store-name">{s.name}</span>
              <span className="store-addr">{s.address}</span>
              <span className="store-meta">
                자동 {s.auto}회 · 수동 {s.manual}회 · 최근 {s.lastDraw}회
              </span>
            </span>
            <span className="store-count">
              <strong>{s.count}</strong>회
            </span>
          </li>
        ))}
      </ol>

      {!region && !expanded && filtered.length > FIRST_VIEW && (
        <button type="button" className="more-btn" onClick={() => setExpanded(true)}>
          {filtered.length}위까지 모두 보기
        </button>
      )}

      <p className="hint zodiac-hint">
        온라인 구매(동행복권 인터넷 판매)는 판매점이 아니라 순위에서 제외했습니다. 같은 기간 1등 {data.online.count}회가
        인터넷에서 나왔습니다.
      </p>

      <PageIntro id="lottostore" />
    </section>
  )
}

export default LottoStorePage
