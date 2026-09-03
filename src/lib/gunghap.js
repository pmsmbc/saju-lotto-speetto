import { hashSeed, mulberry32 } from './seed.js'
import { fourPillars, STEMS, BRANCHES } from './saju.js'
import { branchRelationInfo, BRANCH_ELEM, STEM_ELEM } from './fortune.js'

// 관계 유형별 가중치 — 유형을 추가하거나 가중치만 조정하면 궁합이 진화한다
export const RELATION_TYPES = [
  { id: 'lover', label: '연인' },
  { id: 'couple', label: '부부' },
  { id: 'work', label: '직장' },
  { id: 'friend', label: '친구' },
]
const WEIGHTS = {
  lover: { year: 10, day: 8, stem: 15, complement: 10 },
  couple: { year: 8, day: 10, stem: 15, complement: 12 },
  work: { year: 6, day: 6, stem: 18, complement: 14 },
  friend: { year: 12, day: 6, stem: 12, complement: 8 },
}

const KIND_DESC = {
  삼합: '서로 끌어주는 찰떡 조합',
  육합: '함께할수록 편안해지는 사이',
  충: '부딪히기 쉬워 양보가 필요한 관계',
  형: '신경전을 조심해야 하는 관계',
  해: '은근한 어긋남을 주의할 관계',
  파: '약속이 어긋나기 쉬운 관계',
}

function stemIdxOf(p) { return STEMS.findIndex((s) => s.ko === p.stem.ko && s.ha === p.stem.ha) }
function branchIdxOf(p) { return BRANCHES.findIndex((b) => b.ko === p.branch.ko && b.ha === p.branch.ha) }

function relationLine(info, sameBranch) {
  if (info.kinds.length > 0) return info.kinds.map((k) => `${k} — ${KIND_DESC[k]}`).join(', ')
  if (sameBranch) return '같은 지지 — 서로 닮아 통하는 사이'
  return '특별한 합충 없음 — 무난한 관계'
}

// 사람의 오행 분포 (년·월·일 천간+지지 6글자)
function elementCounts(pillars) {
  const counts = [0, 0, 0, 0, 0]
  for (const k of ['year', 'month', 'day']) {
    counts[STEM_ELEM[stemIdxOf(pillars[k])]]++
    counts[BRANCH_ELEM[branchIdxOf(pillars[k])]]++
  }
  return counts
}

export const ELEM_NAMES = ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)']
const GENERATES = (a, b) => (a + 1) % 5 === b
const CONTROLS = (a, b) => (a + 2) % 5 === b

export function gradeOfScore(score) {
  if (score >= 90) return '천생연분'
  if (score >= 70) return '좋은 인연'
  if (score >= 50) return '무난한 인연'
  if (score >= 30) return '노력이 필요한 인연'
  return '상극 — 서로 배려가 열쇠'
}

export function compatibility(birthA, birthB, type = 'lover') {
  const w = WEIGHTS[type] ?? WEIGHTS.lover
  const pa = fourPillars(birthA, null)
  const pb = fourPillars(birthB, null)

  // 겉궁합: 년지(띠) 관계
  const ya = branchIdxOf(pa.year)
  const yb = branchIdxOf(pb.year)
  const yearInfo = branchRelationInfo(ya, yb)

  // 속궁합: 일지 관계
  const da = branchIdxOf(pa.day)
  const db = branchIdxOf(pb.day)
  const dayInfo = branchRelationInfo(da, db)

  // 일간 오행 상생상극
  const ea = STEM_ELEM[stemIdxOf(pa.day)]
  const eb = STEM_ELEM[stemIdxOf(pb.day)]
  let stemScore = 0
  let stemDesc = '두 사람의 기운이 각자 제 길을 갑니다'
  if (GENERATES(ea, eb) || GENERATES(eb, ea)) {
    stemScore = w.stem
    stemDesc = '서로의 기운을 살려주는 상생(相生)입니다'
  } else if (ea === eb) {
    stemScore = Math.round(w.stem * 2 / 3)
    stemDesc = '같은 기운끼리 통하는 비화(比和)입니다'
  } else if (CONTROLS(ea, eb) || CONTROLS(eb, ea)) {
    stemScore = -w.stem
    stemDesc = '기운이 부딪히는 상극(相剋)이라 배려가 필요합니다'
  }

  // 오행 보완: 상대가 내게 없는 오행을 채워주는가
  const ca = elementCounts(pa)
  const cb = elementCounts(pb)
  const aMissing = ELEM_NAMES.filter((_, i) => ca[i] === 0 && cb[i] > 0)
  const bMissing = ELEM_NAMES.filter((_, i) => cb[i] === 0 && ca[i] > 0)
  const complementScore = Math.round(w.complement * ((aMissing.length > 0 ? 0.5 : 0) + (bMissing.length > 0 ? 0.5 : 0)))
  let complementDesc = '서로의 오행 구성이 비슷합니다'
  if (aMissing.length > 0 && bMissing.length > 0) complementDesc = '서로에게 부족한 기운을 채워주는 사이입니다'
  else if (aMissing.length > 0) complementDesc = `상대가 나의 부족한 ${aMissing.join('·')} 기운을 채워줍니다`
  else if (bMissing.length > 0) complementDesc = `내가 상대의 부족한 ${bMissing.join('·')} 기운을 채워줍니다`

  const raw = 50 + yearInfo.score * w.year + dayInfo.score * w.day + stemScore + complementScore
  const score = Math.max(0, Math.min(100, Math.round(raw)))

  // 커플 행운 번호 (두 생일 고정 시드)
  const rng = mulberry32(hashSeed(`${birthA}:${birthB}:gunghap`))
  const n1 = 1 + Math.floor(rng() * 45)
  let n2 = n1
  while (n2 === n1) n2 = 1 + Math.floor(rng() * 45)

  return {
    score,
    grade: gradeOfScore(score),
    type,
    elements: { mine: ca, partner: cb }, // 오행 분포 [목,화,토,금,수] (년·월·일주 6글자 기준)
    parts: {
      year: { ...yearInfo, name: `${pa.year.name}년생 × ${pb.year.name}년생`, desc: relationLine(yearInfo, ya === yb) },
      day: { ...dayInfo, name: `${pa.day.name}일주 × ${pb.day.name}일주`, desc: relationLine(dayInfo, da === db) },
      stem: { score: stemScore, desc: stemDesc },
      complement: { score: complementScore, desc: complementDesc },
    },
    lucky: [n1, n2].sort((a, b) => a - b),
  }
}
