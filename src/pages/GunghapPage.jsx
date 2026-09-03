import { useEffect, useRef, useState } from 'react'
import { compatibility, RELATION_TYPES, ELEM_NAMES } from '../lib/gunghap.js'
import { todayKST } from '../lib/dateformat.js'
import { LottoBall } from '../components/LottoBall.jsx'

const STORE_KEY = 'satto.gunghap'

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function loadMyBirth() {
  try {
    return JSON.parse(localStorage.getItem('satto.saju'))?.birth ?? ''
  } catch {
    return ''
  }
}

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v)

export function GunghapPage({ today = todayKST() }) {
  const saved = loadSaved()
  const [mine, setMine] = useState(saved.mine ?? loadMyBirth())
  const [partner, setPartner] = useState(saved.partner ?? '')
  const [type, setType] = useState(saved.type ?? 'lover')
  const resultRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ mine, partner, type }))
    } catch {
      // 저장 실패는 무시
    }
  }, [mine, partner, type])

  const ready = isDate(mine) && isDate(partner)
  const result = ready ? compatibility(mine, partner, type) : null

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [ready, type]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="gunghap-page">
      <div className="saju-form surface-card">
        <label className="saju-field">
          <span>나</span>
          <input type="date" value={mine} min="1930-01-01" max={today} onChange={(e) => setMine(e.target.value)} />
        </label>
        <label className="saju-field">
          <span>상대</span>
          <input type="date" value={partner} min="1930-01-01" max={today} onChange={(e) => setPartner(e.target.value)} />
        </label>
        <div className="relation-tabs" role="group" aria-label="관계 선택">
          {RELATION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === type ? 'relation-tab active' : 'relation-tab'}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {result ? (
        <div className="gunghap-result surface-card" ref={resultRef}>
          <div className="gunghap-score">
            <span className="score-num">{result.score}<em>점</em></span>
            <span className="score-grade">{result.grade}</span>
          </div>
          <div className="score-bar" aria-hidden="true">
            <div className="score-fill" style={{ width: `${result.score}%` }} />
          </div>
          <div className="elem-rows">
            {[['나', result.elements.mine], ['상대', result.elements.partner]].map(([who, counts]) => (
              <p className="elem-row" key={who}>
                <strong>{who}</strong>
                {ELEM_NAMES.map((name, i) => (
                  <span key={name} className={counts[i] === 0 ? 'elem-chip empty' : 'elem-chip'}>
                    {name.slice(0, 1)} {counts[i]}
                  </span>
                ))}
              </p>
            ))}
          </div>
          <ul className="gunghap-parts">
            <li><strong>겉궁합</strong> <span className="part-name">{result.parts.year.name}</span> {result.parts.year.desc}</li>
            <li><strong>속궁합</strong> <span className="part-name">{result.parts.day.name}</span> {result.parts.day.desc}</li>
            <li><strong>기운</strong> {result.parts.stem.desc}</li>
            <li><strong>오행</strong> {result.parts.complement.desc}</li>
          </ul>
          <div className="fortune-lucky">
            <span className="lucky-label">커플 행운 번호</span>
            {result.lucky.map((n) => (
              <LottoBall key={n} number={n} />
            ))}
          </div>
        </div>
      ) : (
        <p className="status">두 사람의 생년월일을 입력하면 궁합을 보여드려요</p>
      )}
      <p className="hint zodiac-hint">사주 합충과 오행으로 보는 궁합으로, 참고용입니다.</p>
    </section>
  )
}

export default GunghapPage
