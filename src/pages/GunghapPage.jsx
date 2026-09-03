import { useEffect, useRef, useState } from 'react'
import { compatibility, RELATION_TYPES, ELEM_NAMES } from '../lib/gunghap.js'
import { HOUR_OPTIONS } from '../lib/saju.js'
import { lunarToSolar } from '../lib/lunar.js'
import { todayKST } from '../lib/dateformat.js'

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
    const saju = JSON.parse(localStorage.getItem('satto.saju'))
    return { birth: saju?.birth ?? '', cal: saju?.cal ?? 'solar' }
  } catch {
    return { birth: '', cal: 'solar' }
  }
}

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v)

// 입력값(달력 구분 포함) → 사주 계산용 양력 날짜. 변환 실패 시 null
function toSolar(person) {
  if (!isDate(person.birth)) return null
  if (person.cal !== 'lunar') return person.birth
  const [y, m, d] = person.birth.split('-').map(Number)
  return lunarToSolar(y, m, d)
}

function PersonInput({ who, person, onChange, today }) {
  const solar = toSolar(person)
  return (
    <div className="person-block">
      <div className="person-head">
        <strong>{who}</strong>
        <div className="cal-toggle" role="group" aria-label={`${who} 달력 구분`}>
          {[['solar', '양력'], ['lunar', '음력']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={person.cal === id ? 'cal-btn active' : 'cal-btn'}
              onClick={() => onChange({ ...person, cal: id })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="saju-field">
        <span>{who === '나' ? '나' : '상대'} 생년월일</span>
        <input
          type="date"
          value={person.birth}
          min="1930-01-01"
          max={today}
          onChange={(e) => onChange({ ...person, birth: e.target.value })}
        />
      </label>
      <label className="saju-field">
        <span>태어난 시</span>
        <select value={person.hour} onChange={(e) => onChange({ ...person, hour: e.target.value })}>
          <option value="">모름</option>
          {HOUR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      {person.cal === 'lunar' && isDate(person.birth) && (
        <p className={solar ? 'cal-note' : 'cal-note error'}>
          {solar ? `양력 ${solar}으로 계산합니다` : '음력 날짜를 확인해 주세요 (윤달은 지원하지 않아요)'}
        </p>
      )}
    </div>
  )
}

export function GunghapPage({ today = todayKST() }) {
  const saved = loadSaved()
  const defaultPerson = { birth: '', hour: '', cal: 'solar' }
  const [mine, setMine] = useState({ ...defaultPerson, ...loadMyBirth(), ...(saved.mine ?? {}) })
  const [partner, setPartner] = useState({ ...defaultPerson, ...(saved.partner ?? {}) })
  const [type, setType] = useState(saved.type ?? 'lover')
  const resultRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ mine, partner, type }))
    } catch {
      // 저장 실패는 무시
    }
  }, [mine, partner, type])

  const solarMine = toSolar(mine)
  const solarPartner = toSolar(partner)
  const ready = Boolean(solarMine && solarPartner)
  const result = ready
    ? compatibility({ birth: solarMine, hour: mine.hour }, { birth: solarPartner, hour: partner.hour }, type)
    : null

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [ready, type]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="gunghap-page">
      <div className="saju-form surface-card">
        <PersonInput who="나" person={mine} onChange={setMine} today={today} />
        <PersonInput who="상대" person={partner} onChange={setPartner} today={today} />
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
          <details className="gunghap-info elem-info">
            <summary>오행 분포란?</summary>
            <div className="info-body">
              <p>
                사주를 이루는 글자(년·월·일주 6글자, 태어난 시까지 알면 8글자)를{' '}
                <strong>목(木)·화(火)·토(土)·금(金)·수(水)</strong> 다섯 기운으로
                나눠 센 것입니다. 고르게 퍼져 있을수록 균형 잡힌 사주로 봅니다.
              </p>
              <p>
                <span className="elem-chip empty">목 0</span> 처럼 붉게 표시된
                것은 내 사주에 없는 <strong>부족한 기운</strong>입니다. 상대가 그
                기운을 갖고 있으면 서로를 채워주는 좋은 보완으로 보아 궁합 점수에
                반영됩니다.
              </p>
            </div>
          </details>
          <ul className="gunghap-parts">
            <li><strong>겉궁합</strong> <span className="part-name">{result.parts.year.name}</span> {result.parts.year.desc}</li>
            <li><strong>속궁합</strong> <span className="part-name">{result.parts.day.name}</span> {result.parts.day.desc}</li>
            {result.parts.hour && (
              <li><strong>시궁합</strong> <span className="part-name">{result.parts.hour.name}</span> {result.parts.hour.desc}</li>
            )}
            <li><strong>기운</strong> {result.parts.stem.desc}</li>
            <li><strong>오행</strong> {result.parts.complement.desc}</li>
          </ul>
        </div>
      ) : (
        <p className="status">두 사람의 생년월일을 입력하면 궁합을 보여드려요</p>
      )}
      <details className="gunghap-info surface-card">
        <summary>겉궁합·속궁합이란?</summary>
        <div className="info-body">
          <p>
            <strong>겉궁합</strong>은 두 사람의 띠, 곧 사주 <strong>년지(年支)</strong>의
            관계입니다. 년주는 집안과 사회적 모습을 상징하는 자리라, 첫인상과 주변에서
            보는 어울림 같은 겉으로 드러나는 조화를 봅니다.
          </p>
          <p>
            <strong>속궁합</strong>은 태어난 날의 지지, 곧 <strong>일지(日支)</strong>의
            관계입니다. 일지는 사주에서 배우자 자리(배우자궁)라서, 겉으론 보이지 않는
            속마음의 합과 정서적 친밀감을 봅니다. 생년월일을 알아야만 볼 수 있는 더
            깊은 궁합입니다.
          </p>
          <p>
            두 자리 모두 지지의 <strong>삼합·육합</strong>(끌어주고 편안한 합),
            <strong> 충</strong>(정면으로 부딪힘), <strong>형·해·파</strong>(신경전·어긋남)
            규칙으로 판정하며, 관계 유형에 따라 비중이 달라집니다 — 부부는 속궁합을,
            친구는 겉궁합(띠)을 더 무겁게 봅니다.
          </p>
        </div>
      </details>
      <p className="hint zodiac-hint">사주 합충과 오행으로 보는 궁합으로, 참고용입니다.</p>
    </section>
  )
}

export default GunghapPage
