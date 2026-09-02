import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Footer from './Footer.jsx'

function openModal() {
  fireEvent.click(screen.getByRole('button', { name: '개인정보 안내' }))
}

test('개인정보 안내 버튼 클릭 시 모달이 열린다', () => {
  render(<Footer />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  openModal()
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(dialog).toHaveAttribute('aria-labelledby', 'privacy-modal-title')
  expect(screen.getByText(/브라우저에만 저장/)).toBeInTheDocument()
  expect(screen.getByText(/당첨을 보장하지 않습니다/)).toBeInTheDocument()
})

test('확인 버튼으로 닫히고 열기 버튼으로 포커스가 돌아간다', () => {
  render(<Footer />)
  openModal()
  fireEvent.click(screen.getByRole('button', { name: '확인' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '개인정보 안내' })).toHaveFocus()
})

test('ESC 키로 닫힌다', () => {
  render(<Footer />)
  openModal()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('닫기(X) 버튼이 모달의 마지막 요소로 마크업된다 (KRDS)', () => {
  render(<Footer />)
  openModal()
  const dialog = screen.getByRole('dialog')
  expect(dialog.lastElementChild.classList.contains('btn-close')).toBe(true)
})
