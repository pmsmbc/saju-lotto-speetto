import { hashSeed, mulberry32 } from './seed.js'
import { dayPillar, BRANCHES } from './saju.js'
import { ZODIACS } from './zodiac.js'

// 지지 인덱스: 0=자 1=축 2=인 3=묘 4=진 5=사 6=오 7=미 8=신 9=유 10=술 11=해
// ZODIACS 배열 순서(쥐~돼지)가 곧 지지 인덱스와 일치한다.

const SAMHAP = [[8, 0, 4], [5, 9, 1], [2, 6, 10], [11, 3, 7]] // 신자진, 사유축, 인오술, 해묘미
const YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]
const CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
const HYEONG = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3], [4, 4], [6, 6], [9, 9], [11, 11]]
const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]
const PA = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]]

const inPair = (pairs, a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

// 오행: 0木 1火 2土 3金 4水
export const BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] // 자축인묘진사오미신유술해
export const STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] // 갑을병정무기경신임계
const GENERATES = (a, b) => (a + 1) % 5 === b // 木→火→土→金→水→木
const CONTROLS = (a, b) => (a + 2) % 5 === b // 木克土, 火克金, 土克水, 金克木, 水克火

export function branchRelationInfo(a, b) {
  let score = 0
  const kinds = []
  if (SAMHAP.some((g) => g.includes(a) && g.includes(b) && a !== b)) { score += 3; kinds.push('삼합') }
  if (inPair(YUKHAP, a, b)) { score += 2; kinds.push('육합') }
  if (inPair(CHUNG, a, b)) { score -= 3; kinds.push('충') }
  if (inPair(HYEONG, a, b)) { score -= 2; kinds.push('형') }
  if (inPair(HAE, a, b)) { score -= 1; kinds.push('해') }
  if (inPair(PA, a, b)) { score -= 1; kinds.push('파') }
  return { score, kinds }
}

export function branchRelationScore(dayBranch, zodiacBranch) {
  return branchRelationInfo(dayBranch, zodiacBranch).score
}

export function elementScore(dayStemIdx, zodiacBranch) {
  const d = STEM_ELEM[dayStemIdx]
  const z = BRANCH_ELEM[zodiacBranch]
  if (GENERATES(d, z)) return 1
  if (CONTROLS(d, z)) return -1
  return 0
}

export const GRADES = ['대길', '길', '보통', '주의']

export function gradeOf(score) {
  if (score >= 3) return '대길'
  if (score >= 1) return '길'
  if (score >= -1) return '보통'
  return '주의'
}

// 등급별 키워드 (재물/건강/사랑)
const KEYWORDS = {
  대길: { money: ['횡재', '결실', '수익', '이득'], health: ['활력', '쾌조', '원기'], love: ['화합', '결실', '설렘'] },
  길: { money: ['순조', '소득', '저축'], health: ['양호', '안정', '순탄'], love: ['진전', '화목', '호감'] },
  보통: { money: ['무난', '절약', '유지'], health: ['무난', '휴식', '점검'], love: ['평온', '잔잔', '관망'] },
  주의: { money: ['지출', '손재', '낭비'], health: ['주의', '과로', '피로'], love: ['갈등', '오해', '냉각'] },
}

// 길방: 띠의 오행을 생(生)해주는 오행의 방위 (木=東 火=南 土=南西 金=西 水=北)
export function luckyDirection(zodiacBranch) {
  const z = BRANCH_ELEM[zodiacBranch]
  const generator = (z + 4) % 5 // z를 생하는 오행 (木→火→土→金→水 순환의 역방향)
  return ['東', '南', '南西', '西', '北'][generator] // 木=東 火=南 土=南西 金=西 水=北
}

// 년생별 한 줄 (신문 운세체)
const YEAR_LINES = {
  대길: [
    '오랜 정성이 빛을 본다.', '귀인이 곁에 있으니 두려울 것 없다.', '가는 곳마다 반기는 이 있다.',
    '구하면 얻고 두드리면 열린다.', '작은 씨앗이 큰 나무 된다.', '기다리던 소식이 문을 두드린다.',
    '손대는 일마다 술술 풀린다.', '오늘 웃으면 복이 따라온다.', '밀어붙여도 좋은 날이다.', '재물이 스스로 길을 찾아온다.',
  ],
  길: [
    '서두르지 않아도 제 길을 간다.', '함께 가면 더 멀리 간다.', '베푼 만큼 돌아오는 법이다.',
    '어제의 수고가 오늘 힘이 된다.', '반가운 얼굴이 힘이 되어준다.', '한 걸음씩이 결국 천 리 간다.',
    '웃는 낯에 복이 깃든다.', '묵은 일을 털면 새 일이 온다.', '귀 기울이면 답이 들린다.', '정직이 최고의 밑천이다.',
  ],
  보통: [
    '평소대로 가는 것이 상책이다.', '무리하지 말고 쉬어 가라.', '혼자만의 시간 즐겨라.',
    '나아가고 물러날 때를 알아야.', '흐르는 물 거스르지 말라.', '조용히 내 일에 집중하라.',
    '오늘은 듣는 날, 말은 아껴라.', '작은 것에 만족하면 편하다.', '주변 정리가 마음 정리다.', '기대를 내려놓으면 편안하다.',
  ],
  주의: [
    '말하지도 간섭도 말라.', '사람 만나지 말고 조용히 살자.', '세상에 믿을 사람 자신뿐.',
    '문서에 도장 찍지 말라.', '지갑 단속이 오늘의 숙제다.', '욱하는 마음이 화를 부른다.',
    '공짜 좋아하면 탈이 난다.', '오늘의 참을 인이 내일의 복이다.', '먼 길 나서기 좋은 날 아니다.', '급할수록 돌아가라.',
  ],
}

// 시드 셔플로 년생별 중복 없는 문장 선택
function seededShuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function birthYears(zodiac, count = 6, from = 1936) {
  let y = from
  while (((y % 12) + 12) % 12 !== zodiac.rem) y++
  return Array.from({ length: count }, (_, i) => y + i * 12)
}

// 오늘의 일진 정보
export function todayIljin(dateStr) {
  return dayPillar(dateStr)
}

export function dailyFortune(zodiacId, dateStr) {
  const p = dayPillar(dateStr)
  const stemIdx = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(p.stem.ko)
  const dayBranch = BRANCHES.findIndex((b) => b.ko === p.branch.ko && b.ha === p.branch.ha)
  const zodiac = ZODIACS.find((z) => z.id === zodiacId)
  const zodiacBranch = ZODIACS.indexOf(zodiac)
  const score = branchRelationScore(dayBranch, zodiacBranch) + elementScore(stemIdx, zodiacBranch)
  const grade = gradeOf(score)
  const rng = mulberry32(hashSeed(`${dateStr}:${zodiacId}:fortune`))
  const kw = KEYWORDS[grade]
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  const keywords = { money: pick(kw.money), health: pick(kw.health), love: pick(kw.love) }
  const lines = seededShuffle(YEAR_LINES[grade], rng)
  const yearLines = birthYears(zodiac).map((y, i) => ({
    year: y,
    label: `${String(y).slice(2)}년생`,
    text: lines[i],
  }))
  return { grade, score, keywords, direction: luckyDirection(zodiacBranch), yearLines, iljin: p }
}

export function allFortunes(dateStr) {
  return ZODIACS.map((z) => ({ zodiac: z, ...dailyFortune(z.id, dateStr) }))
}
