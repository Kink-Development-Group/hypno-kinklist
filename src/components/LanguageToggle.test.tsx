import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import React from 'react'
import i18n from '../i18n'
import LanguageToggle from './LanguageToggle'

vi.mock('./Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('LanguageToggle', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders available language options', () => {
    render(<LanguageToggle />)

    const select = screen.getByRole('combobox', {
      name: i18n.t('language.select'),
    })
    const options = screen.getAllByRole('option')

    expect(select).toHaveValue('en')
    expect(options.map((option) => option.getAttribute('value'))).toEqual([
      'en',
      'de',
      'sv',
    ])
    expect(options.map((option) => option.textContent)).toEqual([
      i18n.t('language.en', { defaultValue: 'English' }),
      i18n.t('language.de', { defaultValue: 'Deutsch' }),
      i18n.t('language.sv', { defaultValue: 'Svenska' }),
    ])
  })

  test('changes the active language when a new option is selected', () => {
    const changeLanguageSpy = vi
      .spyOn(i18n, 'changeLanguage')
      .mockResolvedValue(i18n.t.bind(i18n) as never)

    render(<LanguageToggle />)

    fireEvent.change(
      screen.getByRole('combobox', { name: i18n.t('language.select') }),
      {
        target: { value: 'de' },
      }
    )

    expect(changeLanguageSpy).toHaveBeenCalledWith('de')
  })
})
