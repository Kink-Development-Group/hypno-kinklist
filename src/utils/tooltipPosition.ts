// Tooltip-Positionierungs-Utility
export function calculateTooltipPosition(
  rect: DOMRect,
  buttonClass?: string
): {
  top: number
  left: number
  width: number
  height: number
  arrowLeft: number
} {
  const viewportWidth = window.innerWidth
  const tooltipWidth = 320 // max-width aus CSS
  const spaceRight = viewportWidth - rect.right

  // Prüfe, ob der Button ein margin-left besitzt (optional)
  let marginLeft = 0
  if (buttonClass) {
    try {
      const btn = document.elementFromPoint(
        rect.left + 1,
        rect.top + 1
      ) as HTMLElement
      if (btn && btn.classList.contains(buttonClass)) {
        const style = window.getComputedStyle(btn)
        marginLeft = parseFloat(style.marginLeft) || 0
      }
    } catch (e) {
      // Fehler beim Zugriff auf ComputedStyle ignorieren
    }
  }

  // Berechne die horizontale Position basierend auf der Button-Mitte (abzgl. marginLeft)
  const buttonCenter = rect.left + rect.width / 2 - marginLeft
  let left = buttonCenter - tooltipWidth / 2

  // Wenn nicht genug Platz rechts, positioniere links vom Element
  if (spaceRight < tooltipWidth / 2 + 20) {
    left = rect.right - tooltipWidth
    if (left < 10) {
      left = 10
    }
  }

  if (left < 10) {
    left = rect.left
    if (left + tooltipWidth > viewportWidth - 10) {
      left = viewportWidth - tooltipWidth - 10
    }
  }

  const arrowLeft = buttonCenter - left

  return {
    top: rect.bottom + 6,
    left: left,
    width: rect.width,
    height: rect.height,
    arrowLeft: arrowLeft,
  }
}

// Fallback: Sollte nie erreicht werden, aber für Typensicherheit
// export function calculateTooltipPosition(...) { ... }
