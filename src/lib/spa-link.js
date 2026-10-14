// 링크(<a href>)를 SPA 전환으로 가로챈다.
// 메뉴·글 카드·태그 칩을 <button> 대신 <a>로 두는 이유: 구글은 React가 그린 DOM에서
// 링크를 찾으므로, href가 없으면 하위 페이지와 태그 페이지로 가는 길이 크롤러에게 보이지 않는다.
// ⌘/Ctrl/Shift 클릭(새 탭·새 창)과 가운데 버튼은 브라우저 기본 동작에 맡긴다.
export function spaClick(e, go) {
  if (e.defaultPrevented) return
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  go()
}
