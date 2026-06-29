import { render, screen } from '@testing-library/react'
import App from './App.jsx'

test('renders placeholder', () => {
  render(<App />)
  expect(screen.getByText('준비중')).toBeInTheDocument()
})
