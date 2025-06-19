import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'

// Mock the defaultTemplate module to avoid network requests in tests
vi.mock('./utils/defaultTemplate', () => ({
  loadDefaultKinklistFromServer: vi
    .fn()
    .mockRejectedValue(new Error('Network error in test')),
  getDefaultKinklistTemplate: vi
    .fn()
    .mockResolvedValue('# Test Template\n\nTest content'),
}))

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks()
  })

  test('renders main app elements', async () => {
    render(<App />)

    // Wait for the async template loading to complete
    await waitFor(
      () => {
        // Check for the title with the actual text from the translation
        expect(screen.getByText(/Hypno Kinklist/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // Check for export button (uses English since it's the fallback language)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()

    // Check for the main edit button (header edit button with specific ID)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  test('shows loading state initially', () => {
    render(<App />)

    // Check that loading state is shown initially
    expect(screen.getByText(/Lade Kinklist-Template/i)).toBeInTheDocument()
  })
})
