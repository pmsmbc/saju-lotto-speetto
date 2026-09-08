import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaticPage } from './StaticPage.jsx'

test('개인정보처리방침 페이지를 렌더링한다', () => {
  render(<StaticPage slug="privacy" />)
  expect(screen.getByRole('heading', { level: 1, name: '개인정보처리방침' })).toBeInTheDocument()
  expect(screen.getByText(/서버에서 개인정보를 수집·저장하지 않습니다/)).toBeInTheDocument()
  expect(screen.getByText(/tkdansdusrnth@gmail.com/)).toBeInTheDocument()
})

test('사이트 소개 페이지를 렌더링한다', () => {
  render(<StaticPage slug="about" />)
  expect(screen.getByRole('heading', { level: 1, name: '사이트 소개' })).toBeInTheDocument()
  expect(screen.getByText(/복권을 판매하거나 중개하지 않는/)).toBeInTheDocument()
  expect(screen.getByText(/Twemoji/)).toBeInTheDocument()
})
