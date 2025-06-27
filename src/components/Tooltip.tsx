import React, {
  cloneElement,
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { calculateTooltipPosition } from '../utils/tooltipPosition'

interface TooltipProps {
  content: ReactNode
  children: ReactElement
  className?: string
  preferredPosition?: 'right' | 'left'
  delay?: number
  // Weitere Props nach Bedarf
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = '',
  delay = 0,
}) => {
  const triggerRef = useRef<HTMLElement | null>(null)
  const [show, setShow] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
    arrowLeft?: number
  }>()
  const timeoutRef = useRef<number | null>(null)

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setTooltipPos(calculateTooltipPosition(rect))
    if (delay > 0) {
      timeoutRef.current = window.setTimeout(() => setShow(true), delay)
    } else {
      setShow(true)
    }
  }, [delay])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setShow(false)
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
    ref: (el: HTMLElement | null) => {
      triggerRef.current = el
      // children.ref kann ein Ref-Objekt oder eine Callback-Funktion sein
      const childRef = (children as any).ref
      if (typeof childRef === 'function') childRef(el)
      else if (childRef && typeof childRef === 'object') {
        childRef.current = el
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip()
      if (children.props.onMouseEnter) children.props.onMouseEnter(e)
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip()
      if (children.props.onFocus) children.props.onFocus(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip()
      if (children.props.onMouseLeave) children.props.onMouseLeave(e)
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip()
      if (children.props.onBlur) children.props.onBlur(e)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      handleKeyDown(e)
      if (children.props.onKeyDown) children.props.onKeyDown(e)
    },
    tabIndex: children.props.tabIndex ?? 0,
    'aria-describedby': show ? 'custom-tooltip' : undefined,
  })

  return (
    <>
      {trigger}
      {tooltipNode}
    </>
  )
}

export default Tooltip
