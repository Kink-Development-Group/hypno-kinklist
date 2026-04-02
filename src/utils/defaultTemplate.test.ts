import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { debugWarn, hasMultilingualContent } from './index'
import { getEnhancedKinkTemplate } from './kinkTemplates'
import { getDefaultKinklistTemplate } from './defaultTemplate'

vi.mock('./index', async () => {
  const actual = await vi.importActual<typeof import('./index')>('./index')

  return {
    ...actual,
    debugLog: vi.fn(),
    debugWarn: vi.fn(),
    hasMultilingualContent: vi.fn(),
  }
})

vi.mock('./kinkTemplates', () => ({
  getEnhancedKinkTemplate: vi.fn(),
}))

describe('getDefaultKinklistTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(getEnhancedKinkTemplate).mockReturnValue('# fallback template')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('returns fetched multilingual content when available', async () => {
    vi.mocked(hasMultilingualContent).mockReturnValue(true)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('# Basics\n+ [DE] # Grundlagen'),
    } as unknown as Response)

    await expect(getDefaultKinklistTemplate()).resolves.toBe(
      '# Basics\n+ [DE] # Grundlagen'
    )
    expect(debugWarn).not.toHaveBeenCalled()
  })

  test('falls back when fetched content is not multilingual', async () => {
    vi.mocked(hasMultilingualContent).mockReturnValue(false)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('# Basics'),
    } as unknown as Response)

    await expect(getDefaultKinklistTemplate()).resolves.toBe(
      '# fallback template'
    )
    expect(debugWarn).toHaveBeenCalledWith(
      'Loaded template did not contain multilingual content. Falling back to built-in enhanced template.'
    )
  })

  test('falls back and warns when fetching the template fails', async () => {
    const error = new Error('Network failure')
    vi.mocked(fetch).mockRejectedValue(error)

    await expect(getDefaultKinklistTemplate()).resolves.toBe(
      '# fallback template'
    )
    expect(debugWarn).toHaveBeenCalledWith(
      'Failed to load default template from server, falling back to built-in template:',
      error
    )
  })

  test('falls back and warns when the template request returns a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response)

    await expect(getDefaultKinklistTemplate()).resolves.toBe(
      '# fallback template'
    )
    expect(debugWarn).toHaveBeenCalledWith(
      'Failed to load default template from server, falling back to built-in template:',
      expect.objectContaining({
        message: 'Failed to load default template: 404 Not Found',
      })
    )
  })
})
