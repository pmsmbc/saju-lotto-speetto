// 사이트 문의 메일. 푸터(React)와 정적 HTML 푸터(scripts/seo-pages.js)가 함께 쓴다.
export const CONTACT_EMAIL = 'tkdansdusrnth@gmail.com'
// 메일 앱이 열릴 때 제목을 미리 채워 사이트 문의임을 알아보기 쉽게 한다.
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[사또] 문의')}`
