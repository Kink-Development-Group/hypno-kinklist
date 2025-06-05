import { render, screen, fireEvent } from '@testing-library/react'
import Choice from './Choice'
import { KinklistProvider } from '../context/KinklistContext'

// Mock-Props
const mockProps = {
  field: 'TestField',
  categoryName: 'TestCategory',
  kinkName: 'TestKink',
}

describe('Choice Component', () => {
  test('renders choice button with correct level classes', () => {
    render(
      <KinklistProvider initialKinksText="">
        <Choice {...mockProps} />
      </KinklistProvider>
    )

    // Überprüft, ob mindestens ein Button gerendert wird
    const buttons = screen.getAllByRole('radio')
    expect(buttons.length).toBeGreaterThan(0)

    // Der erste Button sollte standardmäßig die 'notEntered'-Klasse haben
    expect(buttons[0]).toHaveClass('choice')
  })

  test('updates selection when clicked', () => {
    render(
      <KinklistProvider initialKinksText="">
        <Choice {...mockProps} />
      </KinklistProvider>
    )

    // Hole alle Buttons
    const buttons = screen.getAllByRole('radio')

    // Klickt auf den zweiten Button (z.B. "favorite")
    fireEvent.click(buttons[1])

    // Der zweite Button sollte jetzt ausgewählt sein
    expect(buttons[1]).toHaveClass('selected')
  })
})
