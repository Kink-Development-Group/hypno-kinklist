import { render } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { ThemeProvider } from './ThemeContext'

describe('ThemeProvider media query listeners', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.localStorage.removeItem('theme')
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    })
  })

  test('falls back to deprecated media query listeners when event listeners are unavailable', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener,
        removeListener,
        addEventListener: undefined,
        removeEventListener: undefined,
        dispatchEvent: vi.fn(),
      }),
    })

    const { unmount } = render(
      <ThemeProvider>
        <div>theme</div>
      </ThemeProvider>
    )

    expect(addListener).toHaveBeenCalledTimes(1)

    unmount()

    expect(removeListener).toHaveBeenCalledTimes(1)
  })
})
