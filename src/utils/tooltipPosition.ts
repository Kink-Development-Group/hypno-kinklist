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
  const viewportHeight = window.innerHeight
  const tooltipWidth = 320 // max-width aus CSS
  const tooltipHeight = 60 // geschätzte Tooltip-Höhe
  const spaceRight = viewportWidth - rect.right
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  // Prüfe, ob es sich um Header-Elemente handelt (Theme-Toggle oder Language-Toggle)
  const isHeaderElement = rect.top < 100 // Header-Elemente sind normalerweise im oberen Bereich

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

  // Spezielle Behandlung für Header-Elemente
  if (isHeaderElement) {
    // Für Header-Elemente: Position direkt unter dem Element, zentriert
    left = buttonCenter - Math.min(tooltipWidth, 200) / 2

    // Stelle sicher, dass der Tooltip nicht über den Bildschirmrand hinausgeht
    if (left < 10) {
      left = 10
    } else if (left + Math.min(tooltipWidth, 200) > viewportWidth - 10) {
      left = viewportWidth - Math.min(tooltipWidth, 200) - 10
    }
  } else {
    // Normale Positionierung für andere Elemente
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
  }

  // Berechne die vertikale Position
  let top = rect.bottom + 8 // Standard: unter dem Element

  // Wenn nicht genug Platz unten und genug Platz oben, zeige über dem Element
  if (spaceBelow < tooltipHeight + 20 && spaceAbove > tooltipHeight + 20) {
    top = rect.top - tooltipHeight - 8
  }

  const arrowLeft = buttonCenter - left

  return {
    top: top,
    left: left,
    width: rect.width,
    height: rect.height,
    arrowLeft: Math.max(
      10,
      Math.min(
        arrowLeft,
        (isHeaderElement ? Math.min(tooltipWidth, 200) : tooltipWidth) - 10
      )
    ),
  }
}

// Fallback: Sollte nie erreicht werden, aber für Typensicherheit
// export function calculateTooltipPosition(...) { ... }
