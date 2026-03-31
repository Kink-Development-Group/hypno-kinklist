import { screen } from '@testing-library/dom'
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'
import { getDefaultKinklistTemplate } from './utils/defaultTemplate'

// Mock the defaultTemplate module to avoid network requests in tests
vi.mock('./utils/defaultTemplate', () => ({
  loadDefaultKinklistFromServer: vi
    .fn()
    .mockRejectedValue(new Error('Network error in test')),
  getDefaultKinklistTemplate: vi
    .fn()
    .mockResolvedValue('# Test Template\n\nTest content'),
}))

const getDefaultKinklistTemplateMock = vi.mocked(getDefaultKinklistTemplate)

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    getDefaultKinklistTemplateMock.mockResolvedValue(
      '# Test Template\n\nTest content'
    )
  })

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks()
  })

  test('renders main app elements', async () => {
    render(<App />)

    expect(await screen.findByText(/Hypno Kinklist/i)).toBeInTheDocument()

    // Check for export button (uses English since it's the fallback language)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()

    // Check for the main edit button (header edit button with specific ID)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  test('shows loading state initially', () => {
    getDefaultKinklistTemplateMock.mockImplementation(
      () => new Promise<string>(() => {})
    )

    render(<App />)

    // Check that loading state is shown initially
    expect(screen.getByText(/Loading kinklist template/i)).toBeInTheDocument()
  })
})
