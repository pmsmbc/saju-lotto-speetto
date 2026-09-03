import { useEffect, useRef } from 'react'

// KRDS 모달 가이드 준수:
// - 마크업 순서: 헤더 → 본문 → 푸터 → 닫기(X) 버튼(가장 마지막 요소)
// - 열릴 때 첫 상호작용 요소로 포커스, 닫힐 때 열기 버튼으로 포커스 복귀(호출측)
// - Tab 포커스 내부 순환, ESC 닫기, 딤 클릭 닫기, 배경 스크롤 잠금
export default function PrivacyModal({ open, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const dialog = dialogRef.current
    const focusables = () =>
      [...dialog.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])')]
    focusables()[0]?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="krds-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        ref={dialogRef}
      >
        <div className="modal-header">
          <h2 id="privacy-modal-title">개인정보 안내</h2>
        </div>
        <div className="modal-conts">
          <p>
            사또는 회원가입 없이 이용하는 사이트로, 입력하신 생년월일 등은 서버로
            전송되지 않고 이용자의 브라우저에만 저장됩니다(브라우저 데이터 삭제 시
            함께 삭제). 서비스 개선을 위해 Google Analytics 쿠키로 방문 통계를
            수집합니다.
          </p>
          <h3>면책</h3>
          <p>
            제공되는 번호는 참고용으로, 당첨을 보장하지 않습니다. 복권
            구매는 만 19세 이상만 가능합니다.
          </p>
        </div>
        <div className="modal-btn">
          <button type="button" className="modal-confirm" onClick={onClose}>확인</button>
        </div>
        <button type="button" className="btn-close" aria-label="닫기" onClick={onClose}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
