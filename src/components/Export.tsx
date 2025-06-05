import React, { useState, useCallback, useEffect } from 'react'
import { useKinklist } from '../context/KinklistContext'
import { downloadImage, setupCanvas } from '../utils'
import ErrorModal from './ErrorModal'
import NameModal from './NameModal'

interface ExportProps {}

const Export: React.FC<ExportProps> = () => {
  const { kinks, levels, selection } = useKinklist()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [pendingExportName, setPendingExportName] = useState<string>('')

  const handleExport = useCallback(() => {
    setIsNameModalOpen(true)
  }, [])

  const handleNameSubmit = (name: string) => {
    setIsNameModalOpen(false)
    setPendingExportName(name)
  }

  useEffect(() => {
    if (pendingExportName !== null) {
      if (pendingExportName === '') {
        // User cancelled or empty, do nothing
        setPendingExportName('')
        return
      }
      ;(async () => {
        setIsLoading(true)
        setIsSuccess(false)
        try {
          // Dynamische Bestimmung der Spaltenanzahl basierend auf der Datenmenge
          // Vorberechnung der Kategorien und Kinks
          const categories = Object.keys(kinks)
          let numKinks = 0
          categories.forEach((cat) => {
            numKinks += kinks[cat].kinks.length
          })

          // Dynamische Spaltenberechnung - erweitert auf bis zu 6 Spalten
          let numCols = 4 // Standard: 4 Spalten

          // Spaltenanzahl basierend auf der Datenmenge
          if (numKinks > 120) {
            numCols = 6 // Bei sehr vielen Einträgen 6 Spalten
          } else if (numKinks > 80) {
            numCols = 5 // Bei vielen Einträgen 5 Spalten
          } else if (numKinks < 40) {
            numCols = 4 // Bei wenigen Einträgen 4 Spalten
          } else {
            numCols = 4 // Standard bleibt 4 Spalten
          }

          // Layout-Parameter für optimale Darstellung mit dynamischer Spaltenanzahl
          const columnWidth =
            numCols === 6
              ? 280 // Breitere Spalten bei 6 Spalten für lange Namen
              : numCols === 5
                ? 320 // Breitere Spalten bei 5 Spalten für lange Namen
                : 380 // Breitere Standard-Spaltenbreite bei 4 Spalten
          const simpleTitleHeight = 60 // Erhöhte Höhe für Überschriften
          const titleSubtitleHeight = 60 // Erhöhte Höhe für Titel mit Untertitel
          const rowHeight = 45 // Optimierte Höhe für Balance
          const textLineHeight = 15 // Kompakte Zeilenhöhe
          const offsets = {
            left: 25,
            right: 25,
            top: 70, // Kompakte Legende
            bottom: 35,
          }
          interface Column {
            height: number
            drawStack: any[]
          }
          const columns: Column[] = []
          for (let i = 0; i < numCols; i++) {
            columns.push({ height: 0, drawStack: [] })
          }
          // Spalten vorbereiten
          let columnIndex = 0
          categories.forEach((catName) => {
            const category = kinks[catName]
            const fields = category.fields
            const catKinks = category.kinks
            const catDescriptions = category.descriptions || []

            // Filtere Kinks: Nur solche mit mindestens einer Auswahl ≠ 'Not Entered' ODER Kommentar
            const filteredKinks = catKinks.filter((kinkName) => {
              let hasNonDefault = false
              let hasComment = false
              fields.forEach((field) => {
                const selItem = selection.find(
                  (item) =>
                    item.category === catName &&
                    item.kink === kinkName &&
                    item.field === field
                )
                if (selItem && selItem.value !== 'Not Entered') {
                  hasNonDefault = true
                }
                if (selItem?.comment && selItem.comment.trim() !== '') {
                  hasComment = true
                }
              })
              return hasNonDefault || hasComment
            })

            if (filteredKinks.length === 0) return // Keine Kinks in dieser Kategorie zum Export

            // Verteilung auf Spalten verbessert - weniger Elemente pro Spalte für bessere Navigation
            // Finde die Spalte mit der geringsten Höhe für bessere Balance
            let shortestColumn = 0
            let shortestHeight = columns[0].height
            for (let i = 1; i < numCols; i++) {
              if (columns[i].height < shortestHeight) {
                shortestHeight = columns[i].height
                shortestColumn = i
              }
            }
            columnIndex = shortestColumn

            const column = columns[columnIndex]
            const drawCall: any = { y: column.height }
            column.drawStack.push(drawCall)
            if (fields.length < 2) {
              column.height += simpleTitleHeight
              drawCall.type = 'simpleTitle'
              drawCall.data = catName
            } else {
              column.height += titleSubtitleHeight
              drawCall.type = 'titleSubtitle'
              drawCall.data = {
                category: catName,
                fields: fields,
              }
            }
            filteredKinks.forEach((kinkName) => {
              const kinkIdx = catKinks.indexOf(kinkName)

              // Funktion zum Berechnen der Textzeilen
              const calculateTextLines = (
                text: string,
                maxWidth: number,
                ctx: CanvasRenderingContext2D
              ): number => {
                if (!text || text.trim() === '') return 0

                // Wörter aufteilen
                const words = text.split(' ')
                let lines = 1
                let line = ''

                // Zeilenumbruch-Simulation
                for (let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' '
                  const metrics = ctx.measureText(testLine)
                  if (metrics.width > maxWidth && n > 0) {
                    line = words[n] + ' '
                    lines++
                  } else {
                    line = testLine
                  }
                }
                return lines
              }

              const drawCall = {
                y: column.height,
                type: 'kinkRow',
                data: {
                  choices: [] as string[],
                  colors: {} as Record<string, string>,
                  text: kinkName,
                  hasComment: false,
                  comments: [] as { field: string; text: string }[], // Array für mehrere Kommentare
                  description: catDescriptions[kinkIdx] || '',
                  extraHeight: 0, // Speichert zusätzliche Höhe durch mehrzeiligen Text
                },
              }

              column.drawStack.push(drawCall)

              // Standardhöhe als Basis verwenden
              let itemHeight = rowHeight

              // Höhe für mehrzeilige Beschreibungen und Kommentare berechnen
              const tempCanvas = document.createElement('canvas')
              const tempCtx = tempCanvas.getContext('2d')!

              // Schriftarten für korrekte Breitenberechnung
              tempCtx.font = 'italic 11px Arial, sans-serif' // Für Beschreibung

              // Beschreibungszeilen berechnen
              const descMaxWidth = columnWidth - 70
              const descLines = calculateTextLines(
                catDescriptions[kinkIdx],
                descMaxWidth,
                tempCtx
              )

              // Kommentarzeilen finden
              let totalCommentLines = 0

              fields.forEach((field) => {
                const selItem = selection.find(
                  (item) =>
                    item.category === catName &&
                    item.kink === kinkName &&
                    item.field === field
                )
                const value = selItem ? selItem.value : Object.keys(levels)[0]
                drawCall.data.choices.push(value)

                if (selItem?.comment && selItem.comment.trim() !== '') {
                  drawCall.data.hasComment = true
                  drawCall.data.comments.push({
                    field: field,
                    text: selItem.comment,
                  })

                  // Kommentarzeilen berechnen
                  const commentLinesForField = calculateTextLines(
                    selItem.comment,
                    descMaxWidth,
                    tempCtx
                  )
                  totalCommentLines += commentLinesForField
                }
              })

              // Extra Höhe basierend auf der Anzahl der Zeilen berechnen
              // Erste Zeile ist schon in rowHeight berücksichtigt
              const extraDescLines = Math.max(0, descLines - 1)
              const extraCommentLines = totalCommentLines

              // Extra Höhe zur Gesamthöhe hinzufügen
              const extraHeight =
                (extraDescLines + extraCommentLines) * textLineHeight
              drawCall.data.extraHeight = extraHeight

              // Höhe des Items aktualisieren
              itemHeight += extraHeight

              // Spaltenhöhe aktualisieren
              column.height += itemHeight
              Object.entries(levels).forEach(([name, level]) => {
                drawCall.data.colors[name] = level.color
              })
            })
          })
          let tallestColumnHeight = 0
          for (let i = 0; i < columns.length; i++) {
            if (tallestColumnHeight < columns[i].height) {
              tallestColumnHeight = columns[i].height
            }
          }
          const canvasWidth =
            offsets.left + offsets.right + columnWidth * numCols
          const canvasHeight =
            offsets.top + offsets.bottom + tallestColumnHeight
          const displayName = pendingExportName.length
            ? `(${pendingExportName})`
            : ''
          const canvas = setupCanvas(
            canvasWidth,
            canvasHeight,
            displayName,
            levels
          )
          const context = canvas.getContext('2d')!

          // Umfassende Legende am Anfang
          renderComprehensiveLegend(context, levels, canvasWidth)

          const drawCallHandlers = {
            simpleTitle: (
              context: CanvasRenderingContext2D,
              drawCall: any
            ): void => {
              context.save()

              // Hintergrund für die Kategorie
              context.fillStyle = 'rgba(245, 245, 250, 0.7)'
              context.fillRect(
                drawCall.x,
                drawCall.y,
                columnWidth - 12,
                simpleTitleHeight - 10
              )

              // Schlankere Trennlinie
              context.beginPath()
              context.moveTo(drawCall.x, drawCall.y + simpleTitleHeight - 22)
              context.lineTo(
                drawCall.x + columnWidth - 15,
                drawCall.y + simpleTitleHeight - 22
              )
              context.strokeStyle = '#3f51b5'
              context.lineWidth = 1.5
              context.stroke()

              // Überschrift - kompakter aber gut lesbar
              context.font = 'bold 13px Arial, sans-serif'
              context.fillStyle = '#3f51b5'
              context.fillText(drawCall.data, drawCall.x + 6, drawCall.y + 18)
              context.restore()
            },
            titleSubtitle: (
              context: CanvasRenderingContext2D,
              drawCall: any
            ): void => {
              context.save()

              // Hintergrund für die Kategorie
              context.fillStyle = 'rgba(245, 245, 250, 0.7)'
              context.fillRect(
                drawCall.x,
                drawCall.y,
                columnWidth - 12,
                titleSubtitleHeight - 15
              )

              // Schlankere Trennlinie
              context.beginPath()
              context.moveTo(drawCall.x, drawCall.y + 38)
              context.lineTo(drawCall.x + columnWidth - 15, drawCall.y + 38)
              context.strokeStyle = '#3f51b5'
              context.lineWidth = 1.5
              context.stroke()

              // Kompaktere aber klare Titel
              context.font = 'bold 13px Arial, sans-serif'
              context.fillStyle = '#3f51b5'
              context.fillText(
                drawCall.data.category,
                drawCall.x + 6,
                drawCall.y + 18
              )
              context.font = 'italic 10px Arial, sans-serif'
              context.fillStyle = '#666666'
              context.fillText(
                drawCall.data.fields.join(', '),
                drawCall.x + 8,
                drawCall.y + 30
              )
              context.restore()
            },
            kinkRow: (
              context: CanvasRenderingContext2D,
              drawCall: any
            ): void => {
              context.save()

              // Deutlichere Zeilenhintergründe für bessere Lesbarkeit
              const isEven = Math.floor(drawCall.y / rowHeight) % 2 === 0
              const bgY = drawCall.y

              // Standardhöhe plus zusätzliche Höhe für mehrzeiligen Text
              const itemHeight =
                (drawCall.data.extraHeight || 0) + rowHeight + 2 // Kompaktere Höhe

              // Optimierte Zeilenhintergründe für besseres 4-Spalten-Layout
              context.fillStyle = isEven
                ? 'rgba(240, 240, 250, 0.4)'
                : 'rgba(248, 248, 255, 0.2)'
              context.fillRect(
                drawCall.x,
                bgY - 12, // Erhöhter Abstand nach oben
                columnWidth - 8, // Mehr horizontaler Platz
                itemHeight // Dynamische Höhe mit minimaler Erweiterung
              )

              // Kink-Name - optimiert für kompakteres 4-Spalten-Layout
              const circleSize = 5 // Kleinere Größe für Kreise im 4-Spalten-Layout
              const circleSpacing = 12 // Reduzierter Abstand zwischen Kreisen

              const circleOffsetX = drawCall.data.choices.length * circleSpacing
              const x = drawCall.x + circleOffsetX + 4 // Optimierter Abstand
              const y = drawCall.y + 1 // Erhöhte vertikale Position für mehr Abstand

              context.font = '11px Arial, sans-serif' // Kompaktere Schrift für 4-Spalten
              context.fillStyle = '#333333'
              context.fillText(drawCall.data.text, x + 6, y)

              // Beschreibung mit optimiertem Zeilenumbruch
              let descY = y + 20 // Effizienter Abstand
              if (
                drawCall.data.description &&
                drawCall.data.description.trim() !== ''
              ) {
                const description = drawCall.data.description
                context.font = 'italic 10px Arial, sans-serif' // Kleinere Schrift
                context.fillStyle = '#666666'

                // Implementierung von Zeilenumbruch für längere Texte
                const maxWidth = columnWidth - 60 // Mehr Platz für Text bei breiteren Spalten
                const words = description.split(' ')
                let line = ''
                let testLine = ''
                const lineHeight = textLineHeight
                let currentY = descY

                // Subtiler Indikator
                context.fillStyle = '#8c9eff'
                context.fillRect(x, descY - 8, 3, 3) // Kompakter Trenner

                // Text Styling wiederherstellen
                context.fillStyle = '#666666'

                // Wörter durchgehen und Zeilen umbrechen
                for (let n = 0; n < words.length; n++) {
                  testLine = line + words[n] + ' '
                  const metrics = context.measureText(testLine)
                  if (metrics.width > maxWidth && n > 0) {
                    context.fillText(line, x + 12, currentY) // Optimale Einrückung
                    line = words[n] + ' '
                    currentY += lineHeight // Standard-Zeilenabstand
                  } else {
                    line = testLine
                  }
                }
                // Letzte Zeile zeichnen
                context.fillText(line, x + 12, currentY)

                // Aktualisiere descY für mögliche Kommentare
                descY = currentY + lineHeight + 2
              }

              // Kommentare mit effizienterem Zeilenumbruch
              if (
                drawCall.data.hasComment &&
                drawCall.data.comments.length > 0
              ) {
                // Kommentarsymbol neben dem Haupttext
                const commentX =
                  x + context.measureText(drawCall.data.text).width + 12

                // Kompakteres Symbol
                context.font = 'bold 10px Arial'
                context.fillStyle = '#0277bd'
                context.fillText('💬', commentX, y)

                // Alle Kommentare nacheinander rendern
                let currentCommentY = descY
                drawCall.data.comments.forEach(
                  (
                    commentItem: { field: string; text: string },
                    index: number
                  ) => {
                    // Subtiler visueller Trenner für jeden Kommentar
                    context.fillStyle = '#0277bd'
                    context.fillRect(x, currentCommentY - 6, 3, 3)

                    // Wenn mehrere Kommentare, zeige das Field
                    if (drawCall.data.comments.length > 1) {
                      context.font = 'bold 9px Arial, sans-serif'
                      context.fillStyle = '#0277bd'
                      context.fillText(
                        `${commentItem.field}:`,
                        x + 12,
                        currentCommentY
                      )
                      currentCommentY += textLineHeight - 2
                    }

                    context.font = 'italic 10px Arial, sans-serif'
                    context.fillStyle = '#0277bd'

                    // Zeilenumbruch für Kommentare - optimiert mit mehr Platz
                    const maxWidth = columnWidth - 70
                    const commentWords = commentItem.text.split(' ')
                    let commentLine = ''
                    let commentTestLine = ''

                    // Wörter durchgehen und Zeilen umbrechen
                    for (let n = 0; n < commentWords.length; n++) {
                      commentTestLine = commentLine + commentWords[n] + ' '
                      const metrics = context.measureText(commentTestLine)
                      if (metrics.width > maxWidth && n > 0) {
                        context.fillText(commentLine, x + 12, currentCommentY)
                        commentLine = commentWords[n] + ' '
                        currentCommentY += textLineHeight
                      } else {
                        commentLine = commentTestLine
                      }
                    }
                    // Letzte Zeile zeichnen
                    context.fillText(commentLine, x + 12, currentCommentY)

                    // Zusätzlicher Abstand zwischen verschiedenen Kommentaren
                    if (index < drawCall.data.comments.length - 1) {
                      currentCommentY += textLineHeight + 3
                    }
                  }
                )
              }
              // Kompaktere, aber klar erkennbare Auswahlkreise
              for (let i = 0; i < drawCall.data.choices.length; i++) {
                const choice = drawCall.data.choices[i]
                const color = drawCall.data.colors[choice]
                const cx = drawCall.x + 6 + i * circleSpacing
                const cy = drawCall.y - 3

                // Optimierte, aber klar definierte Kreise
                context.beginPath()
                context.arc(cx, cy, circleSize, 0, 2 * Math.PI, false)
                context.fillStyle = color
                context.fill()

                // Dünnerer aber sichtbarer Rand
                context.lineWidth = 0.5
                context.strokeStyle = 'rgba(0, 0, 0, 0.7)'
                context.stroke()
              }
              context.restore()
            },
          }

          // Alle Elemente zeichnen
          for (let i = 0; i < columns.length; i++) {
            const column = columns[i]
            const drawStack = column.drawStack
            const drawX = offsets.left + columnWidth * i
            for (let j = 0; j < drawStack.length; j++) {
              const drawCall = drawStack[j]
              drawCall.x = drawX
              drawCall.y += offsets.top
              type DrawCallType = 'simpleTitle' | 'titleSubtitle' | 'kinkRow'
              const drawCallType = drawCall.type as DrawCallType
              if (drawCallHandlers[drawCallType]) {
                drawCallHandlers[drawCallType](context, drawCall)
              }
            }
          }

          // Dezenter Footer
          const footerText = 'Created with https://kink.hypnose-stammtisch.de'
          context.save()
          context.font = 'italic 10px Arial'
          context.fillStyle = '#888888'
          const textMetrics = context.measureText(footerText)
          const padding = 8
          const x = canvasWidth - textMetrics.width - padding
          const y = canvasHeight - padding
          context.fillText(footerText, x, y)
          context.restore()

          downloadImage(canvas, pendingExportName)
          setIsSuccess(true)
          setTimeout(() => setIsSuccess(false), 3000)
        } catch (e) {
          setError('Fehler beim Exportieren des Bildes.')
          console.error(e)
        } finally {
          setIsLoading(false)
          setPendingExportName('')
        }
      })()
    }
  }, [pendingExportName, kinks, levels, selection])

  // Funktion für umfassende, klare Legende
  const renderComprehensiveLegend = (
    context: CanvasRenderingContext2D,
    levels: any,
    canvasWidth: number
  ) => {
    context.save()

    const legendY = 30 // Optimale Höhe
    const levelNames = Object.keys(levels)

    // Optimierte Breite für die Legende
    const legendTitleWidth = 85 // Mehr Abstand zwischen "Legende:" und Farbkreisen
    const itemWidth = 70 // Kompakter aber lesbar
    const totalLegendWidth = legendTitleWidth + levelNames.length * itemWidth

    // Zentrierte Position
    const legendX = (canvasWidth - totalLegendWidth) / 2

    // Dezenter Legendenhintergrund
    context.fillStyle = 'rgba(245, 245, 245, 0.5)'
    context.fillRect(legendX - 10, legendY - 20, totalLegendWidth + 20, 50)

    // Legendentitel
    context.font = 'bold 12px Arial'
    context.fillStyle = '#3f51b5'
    context.fillText('Legende:', legendX, legendY)

    // Kompakte aber klare Circles und Labels
    let currentX = legendX + legendTitleWidth
    levelNames.forEach((levelName) => {
      const color = levels[levelName].color

      // Circle für die Bewertung
      context.beginPath()
      context.arc(currentX, legendY, 5, 0, 2 * Math.PI)
      context.fillStyle = color
      context.fill()
      context.lineWidth = 0.5
      context.strokeStyle = 'rgba(0, 0, 0, 0.7)'
      context.stroke()

      // Label
      context.font = '10px Arial'
      context.fillStyle = '#333333'
      context.fillText(levelName, currentX + 8, legendY + 4)

      currentX += itemWidth
    })

    // Dezente Trennlinie
    context.beginPath()
    context.moveTo(legendX - 10, legendY + 20)
    context.lineTo(legendX + totalLegendWidth + 10, legendY + 20)
    context.strokeStyle = '#3f51b5'
    context.lineWidth = 1
    context.stroke()

    context.restore()
  }

  const handleCloseError = () => setError(null)

  return (
    <div id="ExportWrapper">
      <NameModal
        open={isNameModalOpen}
        onSubmit={handleNameSubmit}
        onClose={() => setIsNameModalOpen(false)}
      />
      {error && <ErrorModal message={error} onClose={handleCloseError} />}
      <div
        id="SuccessMessage"
        className={isSuccess ? 'visible' : ''}
        aria-live="polite"
      >
        Bild erfolgreich heruntergeladen!
      </div>
      <button
        id="Export"
        onClick={handleExport}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        Export
      </button>
      <div
        id="Loading"
        className={isLoading ? 'visible' : ''}
        aria-live="polite"
      >
        Lädt
      </div>
    </div>
  )
}

export default Export
