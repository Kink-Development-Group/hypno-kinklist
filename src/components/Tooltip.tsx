import React, {
  cloneElement,
  ReactElement,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { calculateTooltipPosition } from '../utils/tooltipPosition'

interface TooltipProps {
  content: ReactNode
  children: ReactElement<TooltipChildProps>
  className?: string
  preferredPosition?: 'right' | 'left'
  delay?: number
  // Weitere Props nach Bedarf
}

interface TooltipChildProps {
  ref?: React.Ref<HTMLElement>
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void
  tabIndex?: number
  'aria-describedby'?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = '',
  delay = 0,
}) => {
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipId = useId()
  const [show, setShow] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
    arrowLeft?: number
  }>()
  const timeoutRef = useRef<number | null>(null)
  const childProps = children.props

  const extractChildRef = (
    element: ReactElement<TooltipChildProps>
  ): Ref<HTMLElement> | undefined => {
    return (
      (element.props.ref as Ref<HTMLElement> | undefined) ??
      ((element as ReactElement & { ref?: Ref<HTMLElement> }).ref as
        | Ref<HTMLElement>
        | undefined)
    )
  }

  const childRef = extractChildRef(children)
  const describedBy = [childProps['aria-describedby'], show ? tooltipId : null]
    .filter(Boolean)
    .join(' ')

  const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
    if (typeof ref === 'function') {
      ref(value)
    } else if (ref && 'current' in ref) {
      ref.current = value
    }
  }

  const showTooltip = useCallback(
    (element?: HTMLElement | null) => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      const triggerElement = element ?? triggerRef.current
      if (!triggerElement) return
      triggerRef.current = triggerElement
      const rect = triggerElement.getBoundingClientRect()
      setTooltipPos(calculateTooltipPosition(rect))
      if (delay > 0) {
        timeoutRef.current = window.setTimeout(() => setShow(true), delay)
      } else {
        setShow(true)
      }
    },
    [delay]
  )

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setShow(false)
  }, [])

  const setTriggerRef = useCallback(
    (element: HTMLElement | null) => {
      triggerRef.current = element
      assignRef(childRef, element)
    },
    [childRef]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // ESC schließt Tooltip
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideTooltip()
      ;(e.target as HTMLElement).blur()
    }
  }

  // Prüfe, ob es sich um ein Header-Element handelt
  const isHeaderElement = useCallback(() => {
    if (!triggerRef.current) return false
    const element = triggerRef.current
    return (
      element.id === 'ThemeToggle' ||
      element.classList.contains('language-toggle') ||
      element.closest('.header-actions') !== null
    )
  }, [])

  // Tooltip-Node als Portal
  const tooltipNode =
    show && tooltipPos
      ? ReactDOM.createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={`kink-tooltip-text kink-tooltip-portal ${
              isHeaderElement() ? 'header-tooltip' : ''
            } ${className}`}
            style={
              {
                position: 'fixed',
                top: tooltipPos.top,
                left: tooltipPos.left,
                zIndex: 99999,
                '--arrow-left': tooltipPos.arrowLeft
                  ? `${tooltipPos.arrowLeft}px`
                  : tooltipPos.width
                    ? `${tooltipPos.width / 2}px`
                    : '50%',
              } as React.CSSProperties
            }
            tabIndex={-1}
            onMouseLeave={hideTooltip}
          >
            {content}
          </div>,
          document.body
        )
      : null

  // Das Trigger-Element mit Tooltip-Events wrappen
  const trigger = cloneElement(children, {
    ref: setTriggerRef,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      showTooltip(e.currentTarget)
      childProps.onMouseEnter?.(e)
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      showTooltip(e.currentTarget)
      childProps.onFocus?.(e)
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      hideTooltip()
      childProps.onMouseLeave?.(e)
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      hideTooltip()
      childProps.onBlur?.(e)
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      handleKeyDown(e)
      childProps.onKeyDown?.(e)
    },
    tabIndex: childProps.tabIndex ?? 0,
    'aria-describedby': describedBy || undefined,
  })

  return (
    <>
      {trigger}
      {tooltipNode}
    </>
  )
}

export default Tooltip
