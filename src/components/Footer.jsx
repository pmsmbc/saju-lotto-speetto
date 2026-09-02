import { useRef, useState } from 'react'
import PrivacyModal from './PrivacyModal.jsx'

export const COPYRIGHT = '© 2026 사또 (satto.kr). All rights reserved.'
export const YOUTUBE_URL = 'https://www.youtube.com/@ssangmun-center'

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const privacyBtnRef = useRef(null)
  const closePrivacy = () => {
    setPrivacyOpen(false)
    privacyBtnRef.current?.focus() // KRDS: 닫힐 때 열기 버튼으로 포커스 복귀
  }
  return (
    <footer className="app-footer">
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
        <button
          type="button"
          className="footer-privacy"
          ref={privacyBtnRef}
          onClick={() => setPrivacyOpen(true)}
        >
          개인정보 안내
        </button>
      </div>
      <p className="footer-copy">{COPYRIGHT}</p>
      <PrivacyModal open={privacyOpen} onClose={closePrivacy} />
    </footer>
  )
}
