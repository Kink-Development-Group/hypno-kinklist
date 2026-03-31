import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
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

  test('falls back to the level entry label when a translation is missing', async () => {
    await i18n.changeLanguage('en')
    const spy = vi.spyOn(i18n, 't').mockImplementation((...args) => {
      const [key, options, extraOptions] = args
      const resolvedKey = Array.isArray(key) ? key[0] : key
      const optionObject =
        typeof options === 'string'
          ? (extraOptions as { defaultValue?: string } | undefined)
          : ((options ?? extraOptions) as { defaultValue?: string } | undefined)
      const defaultValue =
        typeof options === 'string' ? options : optionObject?.defaultValue

      return resolvedKey === 'legend.favorite'
        ? resolvedKey
        : (defaultValue ?? String(resolvedKey))
    })

    render(
      <KinklistProvider initialKinksText={''}>
        <Legend />
      </KinklistProvider>
    )

    expect(screen.getByText('Favorite')).toBeInTheDocument()
    spy.mockRestore()
  })
})
