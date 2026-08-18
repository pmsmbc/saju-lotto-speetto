export const COPYRIGHT = '© 2026 사또 (satto.kr). All rights reserved.'

export default function Footer() {
  return (
    <footer className="app-footer">
      <p className="footer-copy">{COPYRIGHT}</p>
      <p className="footer-note">
        당첨 데이터 출처: 동행복권(dhlottery.co.kr). 본 사이트는 참고용 정보만 제공하며 당첨을 보장하지 않습니다.
      </p>
    </footer>
  )
}
