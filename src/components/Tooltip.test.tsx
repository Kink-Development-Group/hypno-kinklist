import { fireEvent, render, screen } from '@testing-library/react'
import { act, createRef, forwardRef } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { calculateTooltipPosition } from '../utils/tooltipPosition'
import Tooltip from './Tooltip'

vi.mock('../utils/tooltipPosition', () => ({
  calculateTooltipPosition: vi.fn(),
}))

describe('Tooltip', () => {
  beforeEach(() => {
    vi.mocked(calculateTooltipPosition).mockReturnValue({
      top: 10,
      left: 20,
      width: 100,
      height: 20,
      arrowLeft: 25,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('appears on focus after the configured delay', () => {
    vi.useFakeTimers()

    render(
      <Tooltip content="Tooltip content" delay={100}>
        <button type="button">Trigger</button>
      </Tooltip>
    )

    const trigger = screen.getByRole('button', { name: 'Trigger' })
    fireEvent.focusIn(trigger)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content')
    expect(trigger).toHaveAttribute('aria-describedby')
  })

  test('closes on blur and mouseleave', () => {
    render(
      <Tooltip content="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    )

    const trigger = screen.getByRole('button', { name: 'Trigger' })

    fireEvent.mouseOver(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseOut(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.focusIn(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.focusOut(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('closes on escape and removes aria-describedby', () => {
    render(
      <Tooltip content="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    )

    const trigger = screen.getByRole('button', { name: 'Trigger' })

    fireEvent.focusIn(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-describedby')

    fireEvent.keyDown(trigger, { key: 'Escape' })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })

  test('renders portal content into document.body', () => {
    render(
      <div data-testid="wrapper">
        <Tooltip content="Tooltip content">
          <button type="button">Trigger</button>
        </Tooltip>
      </div>
    )

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Trigger' }))

    const tooltip = screen.getByRole('tooltip')

    expect(document.body).toContainElement(tooltip)
    expect(screen.getByTestId('wrapper')).not.toContainElement(tooltip)
  })

  test('preserves a forwarded ref on the wrapped child', () => {
    const Button = forwardRef<HTMLButtonElement, { children: string }>(
      ({ children }, ref) => (
        <button ref={ref} type="button">
          {children}
        </button>
      )
    )
    Button.displayName = 'Button'

    const ref = createRef<HTMLButtonElement>()

    render(
      <Tooltip content="Tooltip content">
        <Button ref={ref}>Trigger</Button>
      </Tooltip>
    )

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Trigger' }))
  })

  test('uses an arrow position of 0 when provided', () => {
    vi.mocked(calculateTooltipPosition).mockReturnValue({
      top: 10,
      left: 20,
      width: 100,
      height: 20,
      arrowLeft: 0,
    })

    render(
      <Tooltip content="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    )

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Trigger' }))

    const tooltip = screen.getByRole('tooltip')

    expect(tooltip).toHaveStyle('--arrow-left: 0px')
  })
})
