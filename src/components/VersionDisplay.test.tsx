import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { calculateTooltipPosition } from '../utils/tooltipPosition'
import { getAppVersion } from '../utils/version'
import VersionDisplay from './VersionDisplay'

vi.mock('../utils/version', () => ({
  getAppVersion: vi.fn(),
}))

vi.mock('../utils/tooltipPosition', () => ({
  calculateTooltipPosition: vi.fn(),
}))

describe('VersionDisplay', () => {
  beforeEach(() => {
    vi.mocked(getAppVersion).mockReturnValue('1.2.3')
    vi.mocked(calculateTooltipPosition).mockReturnValue({
      top: 10,
      left: 20,
      width: 100,
      height: 20,
      arrowLeft: 25,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('uses a keyboard-focusable trigger for the version tooltip', () => {
    render(<VersionDisplay />)

    const trigger = screen.getByText('v1.2.3')

    expect(trigger).toHaveProperty('tabIndex', 0)

    fireEvent.focusIn(trigger)

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })
})
