import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import AsyncKinklistProvider from './AsyncKinklistProvider'
import { getDefaultKinklistTemplate } from '../utils/defaultTemplate'
import { getEnhancedKinkTemplate } from '../utils/kinkTemplates'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'loading.template' ? 'Loading kinklist template' : key,
  }),
}))

vi.mock('../context/KinklistContext', () => ({
  KinklistProvider: ({
    initialKinksText,
    children,
  }: {
    initialKinksText: string
    children: React.ReactNode
  }) => (
    <div data-testid="kinklist-provider" data-template={initialKinksText}>
      {children}
    </div>
  ),
}))

vi.mock('../utils/defaultTemplate', () => ({
  getDefaultKinklistTemplate: vi.fn(),
}))

vi.mock('../utils/kinkTemplates', () => ({
  getEnhancedKinkTemplate: vi.fn(),
}))

const getDefaultKinklistTemplateMock = vi.mocked(getDefaultKinklistTemplate)
const getEnhancedKinkTemplateMock = vi.mocked(getEnhancedKinkTemplate)

describe('AsyncKinklistProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getDefaultKinklistTemplateMock.mockResolvedValue('# loaded template')
    getEnhancedKinkTemplateMock.mockReturnValue('# fallback template')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('shows a loading state before the template resolves', () => {
    getDefaultKinklistTemplateMock.mockImplementation(
      () => new Promise<string>(() => {})
    )

    render(
      <AsyncKinklistProvider>
        <div>Child content</div>
      </AsyncKinklistProvider>
    )

    expect(screen.getByText('Loading kinklist template')).toBeInTheDocument()
    expect(screen.queryByTestId('kinklist-provider')).not.toBeInTheDocument()
  })

  test('renders children with the loaded template', async () => {
    render(
      <AsyncKinklistProvider>
        <div>Child content</div>
      </AsyncKinklistProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('kinklist-provider')).toHaveAttribute(
        'data-template',
        '# loaded template'
      )
    })

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  test('falls back to the built-in template when loading throws', async () => {
    getDefaultKinklistTemplateMock.mockRejectedValue(new Error('load failed'))

    render(
      <AsyncKinklistProvider>
        <div>Child content</div>
      </AsyncKinklistProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('kinklist-provider')).toHaveAttribute(
        'data-template',
        '# fallback template'
      )
    })

    expect(getEnhancedKinkTemplateMock).toHaveBeenCalledTimes(1)
  })
})
