import { render, screen } from '@testing-library/react'
import Legend from './Legend'
import { KinklistProvider } from '../context/KinklistContext'
import i18n from '../i18n'

describe('Legend Component', () => {
  test('renders all level definitions', async () => {
    await i18n.changeLanguage('en')

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
