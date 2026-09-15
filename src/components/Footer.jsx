export const COPYRIGHT = '© 2026 사또 (satto.kr). All rights reserved.'
export const YOUTUBE_URL = 'https://www.youtube.com/@ssangmun-center'

// 사이트 전체 메뉴. 상단 탭은 버튼이라 크롤러가 따라갈 수 없어서 푸터에 링크로 둔다.
// scripts/seo-pages.js의 footerHtml()과 같은 목록을 유지해야 한다.
export const SITE_LINKS = [
  { href: '/', label: '오늘의 운세' },
  { href: '/gunghap/', label: '궁합' },
  { href: '/zodiac/', label: '띠별 번호' },
  { href: '/saju/', label: '사주 번호' },
  { href: '/lotto/', label: '로또 추천' },
  { href: '/speetto/', label: '스피또 당첨 지역' },
  { href: '/info/', label: '꿈해몽·상식' },
]

export default function Footer() {
  return (
    <footer className="app-footer">
      <nav className="footer-nav" aria-label="사이트 메뉴">
        {SITE_LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </nav>
      <div className="footer-links">
        <a
          className="footer-youtube"
          href={YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="youtube-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#FF0000"
              d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81Z"
            />
            <path fill="#fff" d="M9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
          </svg>
          <span>북한산쌍문철학원</span>
        </a>
        <span className="footer-pages">
          <a className="footer-privacy" href="/about/">사이트 소개</a>
          <a className="footer-privacy" href="/privacy/">개인정보처리방침</a>
        </span>
      </div>
      <p className="footer-copy">{COPYRIGHT}</p>
    </footer>
  )
}
