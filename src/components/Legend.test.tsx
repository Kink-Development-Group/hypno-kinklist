import { render, screen } from '@testing-library/react'
import Legend from './Legend'
import { KinklistProvider } from '../context/KinklistContext'

describe('Legend Component', () => {
  test('renders all level definitions', () => {
    render(
      <KinklistProvider initialKinksText={''}>
        <Legend />
      </KinklistProvider>
    )

    // Überprüft, ob die Standard-Level-Namen gerendert werden
    expect(screen.getByText('Favorite')).toBeInTheDocument()
    expect(screen.getByText('Like')).toBeInTheDocument()
    expect(screen.getByText('Okay')).toBeInTheDocument()
    expect(screen.getByText('Maybe')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })
})
