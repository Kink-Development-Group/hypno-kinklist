import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import App from './App'

describe('App Component', () => {
  test('renders main app elements', () => {
    render(<App />)

    // Überprüft, ob die wichtigsten Elemente der App gerendert werden
    expect(screen.getByText(/Hypno Kink List/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /bearbeiten/i })
    ).toBeInTheDocument()
  })
})
