import { hashSeed, mulberry32 } from './seed.js'
import { randomSet } from './lotto.js'

export const STEMS = [
  { ko: '갑', ha: '甲' }, { ko: '을', ha: '乙' }, { ko: '병', ha: '丙' }, { ko: '정', ha: '丁' },
  { ko: '무', ha: '戊' }, { ko: '기', ha: '己' }, { ko: '경', ha: '庚' }, { ko: '신', ha: '辛' },
  { ko: '임', ha: '壬' }, { ko: '계', ha: '癸' },
]
export const BRANCHES = [
  { ko: '자', ha: '子' }, { ko: '축', ha: '丑' }, { ko: '인', ha: '寅' }, { ko: '묘', ha: '卯' },
  { ko: '진', ha: '辰' }, { ko: '사', ha: '巳' }, { ko: '오', ha: '午' }, { ko: '미', ha: '未' },
  { ko: '신', ha: '申' }, { ko: '유', ha: '酉' }, { ko: '술', ha: '戌' }, { ko: '해', ha: '亥' },
]

// 태어난 시 선택지 (지지 12시신)
export const HOUR_OPTIONS = BRANCHES.map((b, i) => {
  const start = (23 + i * 2) % 24
  const end = (start + 2) % 24
  return { value: i, label: `${b.ko}시 (${String(start).padStart(2, '0')}~${String(end).padStart(2, '0')}시)` }
})

function pillar(stemIdx, branchIdx) {
  const s = STEMS[((stemIdx % 10) + 10) % 10]
  const b = BRANCHES[((branchIdx % 12) + 12) % 12]
  return { stem: s, branch: b, name: `${s.ko}${b.ko}`, hanja: `${s.ha}${b.ha}` }
}

// 음력(설날) 기준 연도의 60갑자 — Intl dangi가 주는 yearName('병오' 등) 사용
export function yearPillar(dateStr) {
  const parts = new Intl.DateTimeFormat('ko-KR-u-ca-dangi', {
    timeZone: 'Asia/Seoul', year: 'numeric',
  }).formatToParts(new Date(`${dateStr}T12:00:00+09:00`))
  const name = parts.find((p) => p.type === 'yearName')?.value ?? ''
  const si = STEMS.findIndex((s) => s.ko === name[0])
  const bi = BRANCHES.findIndex((b) => b.ko === name[1])
  return pillar(si, bi)
}

// 절기 경계(근사 고정일): [월, 일, 인월(1)부터의 순번]
const TERM_CUTOFFS = [
  [2, 4, 1], [3, 6, 2], [4, 5, 3], [5, 6, 4], [6, 6, 5], [7, 7, 6],
  [8, 8, 7], [9, 8, 8], [10, 8, 9], [11, 7, 10], [12, 7, 11],
]
function monthNumber(m, d) {
  // 1월 1일~1월 5일, 그리고 1월 6일~2월 3일은 축월(12)
  let n = 12
  for (const [tm, td, num] of TERM_CUTOFFS) {
    if (m > tm || (m === tm && d >= td)) n = num
  }
  return n
}

// 월주: 년간에 따른 인월의 천간(오호둔) + 월 순번
export function monthPillar(dateStr, yPillar = yearPillar(dateStr)) {
  const [, m, d] = dateStr.split('-').map(Number)
  const n = monthNumber(m, d) // 인월=1 ... 축월=12
  const ys = STEMS.findIndex((s) => s.ko === yPillar.stem.ko)
  const startStem = ((ys % 5) * 2 + 2) % 10
  return pillar(startStem + (n - 1), 2 + (n - 1))
}

// 일주: JDN 기반 60갑자 (2019-01-27 = 갑자일 앵커, JDN 2458511)
export function dayPillar(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const jdn = Math.floor(Date.UTC(y, m - 1, d) / 86400000) + 2440588
  const idx = (((jdn - 2458511) % 60) + 60) % 60
  return pillar(idx % 10, idx % 12)
}

// 시주: 일간에 따른 자시의 천간(오서둔) + 시지
export function hourPillar(dateStr, hourBranch, dPillar = dayPillar(dateStr)) {
  if (hourBranch == null || hourBranch === '') return null
  const ds = STEMS.findIndex((s) => s.ko === dPillar.stem.ko)
  const startStem = ((ds % 5) * 2) % 10
  return pillar(startStem + Number(hourBranch), Number(hourBranch))
}

// 사주 네 기둥 (시주는 모르면 null)
export function fourPillars(birthDateStr, hourBranch) {
  const y = yearPillar(birthDateStr)
  const m = monthPillar(birthDateStr, y)
  const d = dayPillar(birthDateStr)
  const h = hourPillar(birthDateStr, hourBranch, d)
  return { year: y, month: m, day: d, hour: h }
}

// 사주 + 오늘 날짜 기반 결정적 추천 번호 6개
export function sajuNumbers(birthDateStr, hourBranch, todayStr) {
  const p = fourPillars(birthDateStr, hourBranch)
  const key = `${p.year.name}${p.month.name}${p.day.name}${p.hour ? p.hour.name : '?'}:${todayStr}`
  return randomSet(mulberry32(hashSeed(key)))
}
