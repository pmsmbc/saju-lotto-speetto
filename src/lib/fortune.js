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
const BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] // 자축인묘진사오미신유술해
const STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] // 갑을병정무기경신임계
const GENERATES = (a, b) => (a + 1) % 5 === b // 木→火→土→金→水→木
const CONTROLS = (a, b) => (a + 2) % 5 === b // 木克土, 火克金, 土克水, 金克木, 水克火

export function branchRelationScore(dayBranch, zodiacBranch) {
  let score = 0
  if (SAMHAP.some((g) => g.includes(dayBranch) && g.includes(zodiacBranch) && dayBranch !== zodiacBranch)) score += 3
  if (inPair(YUKHAP, dayBranch, zodiacBranch)) score += 2
  if (inPair(CHUNG, dayBranch, zodiacBranch)) score -= 3
  if (inPair(HYEONG, dayBranch, zodiacBranch)) score -= 2
  if (inPair(HAE, dayBranch, zodiacBranch)) score -= 1
  if (inPair(PA, dayBranch, zodiacBranch)) score -= 1
  return score
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

const PHRASES = {
  대길: {
    total: [
      '오랜 노력이 결실을 맺는 날, 미뤄둔 일을 오늘 마무리해 보세요.',
      '귀인이 나타나는 날입니다. 걸려오는 연락을 반갑게 받으세요.',
      '무엇을 시작해도 순풍이 붑니다. 첫걸음을 떼기 좋은 날이에요.',
      '주변의 신뢰가 두터워지는 날, 부탁과 제안이 잘 통합니다.',
      '막혔던 일이 뚫리는 날입니다. 한 번 더 시도해 보세요.',
      '기분 좋은 소식이 겹쳐 들어오는 날, 웃는 얼굴이 복을 부릅니다.',
      '몸도 마음도 가벼운 날입니다. 중요한 약속을 잡아 보세요.',
      '평소보다 판단이 밝은 날, 결정을 내리기에 좋습니다.',
    ],
    money: [
      '뜻밖의 수입이나 좋은 기회가 닿을 수 있는 날입니다.',
      '투자한 만큼 돌아오는 날, 정당한 대가를 요구해도 좋습니다.',
      '금전 흐름이 시원하게 풀립니다. 밀린 정산을 처리해 보세요.',
      '작은 지출이 큰 인연으로 돌아오는 날입니다.',
      '재물운이 왕성한 날, 복권 한 장의 설렘도 좋겠습니다.',
      '거래와 흥정에 유리한 날입니다. 자신 있게 제시하세요.',
      '돈 문제로 얽힌 매듭이 풀리는 날입니다.',
      '수중에 들어온 것을 잘 갈무리하면 두 배가 되는 날입니다.',
    ],
  },
  길: {
    total: [
      '순조로운 하루입니다. 계획한 일을 차근차근 진행하세요.',
      '작은 행운이 곳곳에 숨어 있는 날, 주변을 살펴보세요.',
      '협력이 잘 되는 날입니다. 함께하면 더 멀리 갑니다.',
      '반가운 사람과 대화가 잘 풀리는 날입니다.',
      '어제보다 한 걸음 나아가는 날, 꾸준함이 빛을 냅니다.',
      '기다리던 답이 도착할 수 있는 날입니다.',
      '컨디션이 안정적인 날, 미뤄둔 정리를 하기 좋습니다.',
      '베푼 만큼 돌아오는 날입니다. 친절이 복이 됩니다.',
    ],
    money: [
      '무리하지 않는 선에서 금전운이 따르는 날입니다.',
      '알뜰한 소비가 만족으로 이어지는 날입니다.',
      '금전 관련 정보에 귀를 열어두면 득이 되는 날입니다.',
      '작지만 확실한 이득이 있는 날입니다.',
      '가계부를 정리하면 새는 돈이 보이는 날입니다.',
      '적립과 저축이 즐거워지는 날입니다.',
      '주변의 금전 조언이 도움이 되는 날입니다.',
      '필요한 물건을 좋은 값에 만날 수 있는 날입니다.',
    ],
  },
  보통: {
    total: [
      '무난한 하루입니다. 평소의 리듬을 지키는 것이 최선입니다.',
      '큰 변화보다 일상을 다지는 데 좋은 날입니다.',
      '서두를 것 없는 날입니다. 여유가 오히려 득이 됩니다.',
      '주변 정리와 휴식에 어울리는 날입니다.',
      '말을 아끼면 평온이 유지되는 날입니다.',
      '기대도 실망도 크지 않은 날, 담담하게 보내세요.',
      '혼자만의 시간이 재충전이 되는 날입니다.',
      '오늘 뿌린 씨앗은 천천히 자랍니다. 조급해하지 마세요.',
    ],
    money: [
      '들어오고 나가는 것이 비슷한 날입니다. 계획 소비면 충분합니다.',
      '충동구매만 피하면 무난한 금전운입니다.',
      '큰 거래보다는 관망이 어울리는 날입니다.',
      '지갑 사정을 점검해 보기 좋은 날입니다.',
      '공짜에 혹하지 않으면 손해 볼 일 없는 날입니다.',
      '소소한 지출이 기분 전환이 되는 날입니다.',
      '금전 결정은 하루 묵혔다 해도 늦지 않습니다.',
      '평소 습관대로면 탈 없는 금전운입니다.',
    ],
  },
  주의: {
    total: [
      '서두르면 잃기 쉬운 날입니다. 큰 결정은 내일로 미루세요.',
      '오해가 생기기 쉬운 날, 말은 줄이고 귀는 열어두세요.',
      '계획이 어긋나도 침착하면 무난히 지나가는 날입니다.',
      '문서와 약속은 두 번 확인하는 것이 좋은 날입니다.',
      '감정이 앞서기 쉬운 날입니다. 한 템포 쉬고 답하세요.',
      '이동과 운전에 평소보다 주의가 필요한 날입니다.',
      '무리한 부탁은 정중히 거절해도 괜찮은 날입니다.',
      '오늘의 참을 인(忍) 한 번이 내일의 복이 됩니다.',
    ],
    money: [
      '지갑 단속이 필요한 날입니다. 충동구매를 조심하세요.',
      '보증이나 큰 금전 약속은 피하는 것이 좋은 날입니다.',
      '싸다고 덜컥 사면 후회할 수 있는 날입니다.',
      '금전 거래는 기록을 남겨두면 탈이 없습니다.',
      '투자 결정은 오늘만은 관망이 답입니다.',
      '분실물을 조심하세요. 소지품을 한 번 더 챙기세요.',
      '돈 얘기는 오늘 꺼내지 않는 편이 순탄합니다.',
      '작은 손해는 액땜이라 여기면 마음이 편한 날입니다.',
    ],
  },
}

// 오늘의 일진 정보
export function todayIljin(dateStr) {
  return dayPillar(dateStr)
}

export function dailyFortune(zodiacId, dateStr) {
  const p = dayPillar(dateStr)
  const stemIdx = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(p.stem.ko)
  const dayBranch = BRANCHES.findIndex((b) => b.ko === p.branch.ko && b.ha === p.branch.ha)
  const zodiacBranch = ZODIACS.findIndex((z) => z.id === zodiacId)
  const score = branchRelationScore(dayBranch, zodiacBranch) + elementScore(stemIdx, zodiacBranch)
  const grade = gradeOf(score)
  const rng = mulberry32(hashSeed(`${dateStr}:${zodiacId}:fortune`))
  const pool = PHRASES[grade]
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  return { grade, score, total: pick(pool.total), money: pick(pool.money), iljin: p }
}

export function allFortunes(dateStr) {
  return ZODIACS.map((z) => ({ zodiac: z, ...dailyFortune(z.id, dateStr) }))
}
