const SITE_NAME = '사주로또 사또'
const SITE_URL = 'satto.kr'
const START_YEAR = 2026

export function copyrightText(year = new Date().getFullYear()) {
  const range = year > START_YEAR ? `${START_YEAR}–${year}` : `${START_YEAR}`
  return `© ${range} ${SITE_NAME} (${SITE_URL}). All rights reserved.`
}

export default function Footer() {
  return (
    <footer className="app-footer">
      <p className="footer-copy">{copyrightText()}</p>
      <p className="footer-note">
        당첨 데이터 출처: 동행복권(dhlottery.co.kr). 본 사이트는 참고용 정보만 제공하며 당첨을 보장하지 않습니다.
      </p>
    </footer>
  )
}
