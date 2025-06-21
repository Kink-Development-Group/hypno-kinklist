import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import {
  ExportFormat,
  ExportMode,
  ExportModeOption,
  ExportOptions,
} from '../types/export'
import { downloadImage } from '../utils'
import {
  convertToExportData,
  exportAsCSV,
  exportAsJSON,
  exportAsPDF,
  exportAsSVG,
  exportAsXML,
  exportCanvasAsImage,
} from '../utils/exportUtils'
import { getAppVersion } from '../utils/version'
import ErrorModal from './ErrorModal'
import NameModal from './NameModal'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose }) => {
  const { t, i18n } = useTranslation()
  const { kinks, levels, selection } = useKinklist()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PNG')
  const [selectedMode, setSelectedMode] = useState<ExportMode>('quick')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'PNG',
    includeComments: true,
    includeDescriptions: true,
    includeMetadata: true,
  })
  const [pendingExport, setPendingExport] = useState<{
    format: ExportFormat
    username: string
  } | null>(null)

  // Export-Modi definieren
  const exportModes: ExportModeOption[] = [
    {
      mode: 'quick',
      title: t('export.modes.quick.title'),
      description: t('export.modes.quick.description'),
      formats: ['PNG', 'JSON', 'PDF'],
      defaultOptions: {
        includeComments: true,
        includeDescriptions: false,
        includeMetadata: true,
      },
    },
    {
      mode: 'advanced',
      title: t('export.modes.advanced.title'),
      description: t('export.modes.advanced.description'),
      formats: ['PNG', 'JPEG', 'WebP', 'SVG', 'PDF', 'JSON', 'XML', 'CSV'],
      defaultOptions: {
        includeComments: true,
        includeDescriptions: true,
        includeMetadata: true,
      },
    },
  ]

  // Format-spezifische Einstellungen
  const formatDescriptions = {
    PNG: t('export.formatDescriptions.PNG'),
    JPEG: t('export.formatDescriptions.JPEG'),
    WebP: t('export.formatDescriptions.WebP'),
    SVG: t('export.formatDescriptions.SVG'),
    PDF: t('export.formatDescriptions.PDF'),
    JSON: t('export.formatDescriptions.JSON'),
    XML: t('export.formatDescriptions.XML'),
    CSV: t('export.formatDescriptions.CSV'),
  }

  const handleExport = useCallback((format: ExportFormat) => {
    setSelectedFormat(format)
    setExportOptions((prev) => ({ ...prev, format }))
    setIsNameModalOpen(true)
  }, [])

  const handleNameSubmit = useCallback(
    (username: string) => {
      setIsNameModalOpen(false)
      setPendingExport({ format: selectedFormat, username })
    },
    [selectedFormat]
  )
  // Canvas-Erstellung für Bildexporte mit kompaktem Grid-Layout
  const createExportCanvas = useCallback(
    async (username: string): Promise<HTMLCanvasElement> => {
      // Sicherstellen, dass aktuelle Übersetzungen verwendet werden
      const currentT = t

      // Filtere die Kinks, um nur ausgefüllte oder kommentierte zu zeigen
      const filteredKinks = Object.keys(kinks).reduce(
        (filtered, categoryName) => {
          const category = kinks[categoryName]
          const filteredKinkList: string[] = []
          const filteredDescriptions: string[] = []

          category.kinks.forEach((kinkName, index) => {
            // Prüfe, ob mindestens ein Field für diesen Kink ausgefüllt oder kommentiert ist
            const hasFilledOrCommentedField = category.fields.some((field) => {
              const selectionItem = selection.find(
                (item) =>
                  item.category === categoryName &&
                  item.kink === kinkName &&
                  item.field === field
              )

              // Kink ist relevant, wenn:
              // 1. Es eine Auswahl gibt und sie nicht "Not Entered" ist
              // 2. Oder es einen Kommentar gibt
              return (
                selectionItem &&
                (selectionItem.value !== 'Not Entered' ||
                  (selectionItem.comment &&
                    selectionItem.comment.trim().length > 0))
              )
            })

            if (hasFilledOrCommentedField) {
              filteredKinkList.push(kinkName)
              filteredDescriptions.push(category.descriptions?.[index] || '')
            }
          })

          // Nur Kategorien mit mindestens einem relevanten Kink hinzufügen
          if (filteredKinkList.length > 0) {
            filtered[categoryName] = {
              ...category,
              kinks: filteredKinkList,
              descriptions: filteredDescriptions,
            }
          }

          return filtered
        },
        {} as typeof kinks
      )

      // Grid-Konfiguration mit gefilterten Kinks
      let categories = Object.entries(filteredKinks)

      // Warte kurz, falls Daten noch geladen werden
      if (categories.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Wiederhole die Filterung mit aktualisierten Daten
        const retryFilteredKinks = Object.keys(kinks).reduce(
          (filtered, categoryName) => {
            const category = kinks[categoryName]
            const filteredKinkList: string[] = []
            const filteredDescriptions: string[] = []

            category.kinks.forEach((kinkName, index) => {
              const hasFilledOrCommentedField = category.fields.some(
                (field) => {
                  const selectionItem = selection.find(
                    (item) =>
                      item.category === categoryName &&
                      item.kink === kinkName &&
                      item.field === field
                  )

                  return (
                    selectionItem &&
                    (selectionItem.value !== 'Not Entered' ||
                      (selectionItem.comment &&
                        selectionItem.comment.trim().length > 0))
                  )
                }
              )

              if (hasFilledOrCommentedField) {
                filteredKinkList.push(kinkName)
                filteredDescriptions.push(category.descriptions?.[index] || '')
              }
            })

            if (filteredKinkList.length > 0) {
              filtered[categoryName] = {
                ...category,
                kinks: filteredKinkList,
                descriptions: filteredDescriptions,
              }
            }

            return filtered
          },
          {} as typeof kinks
        )

        categories = Object.entries(retryFilteredKinks)

        if (categories.length === 0) {
          // Erstelle Fallback-Canvas mit Fehlermeldung
          const canvas = document.createElement('canvas')
          canvas.width = 800
          canvas.height = 600
          const ctx = canvas.getContext('2d')!

          // Moderner Hintergrund
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
          gradient.addColorStop(0, '#f8f9fa')
          gradient.addColorStop(1, '#e9ecef')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Panel mit Schatten
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
          ctx.shadowBlur = 10
          ctx.shadowOffsetY = 5
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100)
          ctx.shadowColor = 'transparent'

          // Fehlermeldung
          ctx.fillStyle = '#2c3e50'
          ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(currentT('export.errors.noData'), canvas.width / 2, 200)

          ctx.font = '18px "Segoe UI", Arial, sans-serif'
          ctx.fillStyle = '#6c757d'
          ctx.fillText(
            currentT('export.errors.loadKinklist'),
            canvas.width / 2,
            250
          )
          ctx.fillText(
            currentT('export.errors.dataLoading'),
            canvas.width / 2,
            280
          )

          // Hilfetext
          ctx.font = '14px "Segoe UI", Arial, sans-serif'
          ctx.fillStyle = '#adb5bd'
          ctx.fillText(
            'Versuchen Sie es in ein paar Sekunden erneut.',
            canvas.width / 2,
            350
          )

          ctx.textAlign = 'start' // Reset alignment

          return canvas
        }
      }

      // Verwende die final categories
      const finalCategories = categories

      const gridColumns = Math.min(
        3,
        Math.max(2, Math.ceil(Math.sqrt(finalCategories.length)))
      )

      const columnWidth = 380
      const headerHeight = 180
      const footerHeight = 50
      const margin = 20

      // Berechne individuelle Kategorie-Höhen und Positionen (Masonry-Layout)
      const categoryInfos: Array<{
        name: string
        data: any
        height: number
        x: number
        y: number
      }> = []

      // Erst alle Kategorie-Höhen berechnen
      finalCategories.forEach(([categoryName, categoryData]) => {
        let categoryHeight = 100 // Header + Fields base height

        categoryData.kinks.forEach((kinkName) => {
          let kinkHeight = 22 // Base Kink height

          // Berechne Kommentar-Höhen basierend auf vollständigem Text
          categoryData.fields.forEach((field) => {
            const selectionItem = selection.find(
              (item) =>
                item.category === categoryName &&
                item.kink === kinkName &&
                item.field === field
            )

            if (selectionItem?.comment) {
              // Simuliere Textumbruch für Höhenberechnung
              const maxCommentWidth = columnWidth - 40
              const commentText = `${field}: ${selectionItem.comment}`

              // Einfache Schätzung: ~4.2 Pixel pro Zeichen bei 7px Font
              const charsPerLine = Math.floor(maxCommentWidth / 4.2)
              const lines = Math.ceil(commentText.length / charsPerLine)
              kinkHeight += lines * 10 + 16 // 10px pro Zeile + mehr Padding
            }
          })

          categoryHeight += kinkHeight
        })

        categoryInfos.push({
          name: categoryName,
          data: categoryData,
          height: categoryHeight + 20, // Etwas Puffer
          x: 0, // Wird dynamisch berechnet
          y: 0, // Wird dynamisch berechnet
        })
      })

      // Dynamisches Masonry-Layout: Kategorien optimal anordnen
      const columnHeights: number[] = new Array(gridColumns).fill(0)

      categoryInfos.forEach((info) => {
        // Finde die Spalte mit der geringsten aktuellen Höhe
        let shortestColumnIndex = 0
        let shortestColumnHeight = columnHeights[0]

        for (let i = 1; i < gridColumns; i++) {
          if (columnHeights[i] < shortestColumnHeight) {
            shortestColumnHeight = columnHeights[i]
            shortestColumnIndex = i
          }
        }

        // Positioniere Kategorie in der kürzesten Spalte
        info.x = margin + shortestColumnIndex * (columnWidth + margin)
        info.y = headerHeight + margin + columnHeights[shortestColumnIndex]

        // Aktualisiere die Spaltenhöhe
        columnHeights[shortestColumnIndex] += info.height + margin
      })

      // Berechne finale Canvas-Höhe basierend auf höchster Spalte
      const maxColumnHeight = Math.max(...columnHeights)

      // Höhere Auflösung für bessere Bildqualität
      const scale = 3 // 3x höhere Auflösung für scharfe Bilder
      const baseWidth = gridColumns * columnWidth + (gridColumns + 1) * margin
      const baseHeight = headerHeight + maxColumnHeight + footerHeight + margin

      const canvas = document.createElement('canvas')
      canvas.width = baseWidth * scale
      canvas.height = baseHeight * scale
      canvas.style.width = `${baseWidth}px`
      canvas.style.height = `${baseHeight}px`

      const ctx = canvas.getContext('2d')!

      // Skaliere den Context für höhere Auflösung
      ctx.scale(scale, scale)

      // Bessere Bildqualität-Einstellungen
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.textBaseline = 'top'

      // Moderner Gradient-Hintergrund
      const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight)
      gradient.addColorStop(0, '#f8f9fa')
      gradient.addColorStop(1, '#e9ecef')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, baseWidth, baseHeight)

      // Hauptpanel mit Schatten
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 5
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(10, 10, baseWidth - 20, baseHeight - 20)
      ctx.shadowColor = 'transparent'

      let yPosition = 30

      // Kompakter Header
      ctx.fillStyle = '#2c3e50'
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif'
      const headerText = username
        ? `🔗 ${username}'s Kink List`
        : '🔗 Kink List'
      ctx.fillText(headerText, margin, yPosition + 20)

      // Datum rechts oben - verwende aktuelle Sprache für Formatierung
      ctx.font = '12px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#6c757d'
      const currentLanguage = i18n.language || 'de'
      const localeMap: { [key: string]: string } = {
        de: 'de-DE',
        en: 'en-US',
        sv: 'sv-SE',
      }
      const locale = localeMap[currentLanguage] || 'de-DE'
      const exportDate = new Date().toLocaleDateString(locale)
      const dateText = `📅 ${exportDate}`
      const dateWidth = ctx.measureText(dateText).width
      ctx.fillText(dateText, canvas.width - dateWidth - margin, yPosition + 15)

      yPosition += 50

      // Kompakte horizontale Legende
      ctx.fillStyle = '#2c3e50'
      ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
      ctx.fillText(currentT('legend.title'), margin, yPosition)

      const legendItems = Object.entries(levels).filter(
        ([key]) => key !== 'Not Entered'
      )
      let legendX = margin + 120
      const legendY = yPosition

      legendItems.forEach(([levelName, level]) => {
        // Kompakte runde Punkte
        ctx.fillStyle = level.color
        ctx.beginPath()
        ctx.arc(legendX + 6, legendY + 7, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = '#000000'
        ctx.font = '10px "Segoe UI", Arial, sans-serif'
        // Verwende den übersetzten Namen statt des Schlüsselnamens
        const levelKey = levelName.toLowerCase().replace(/\s+/g, '')
        // Spezielle Behandlung für "Not Entered" -> "notEntered"
        const translationKey =
          levelKey === 'notentered' ? 'notEntered' : levelKey
        const translatedLevelName =
          currentT(`legend.${translationKey}`) || level.name
        ctx.fillText(translatedLevelName, legendX + 15, legendY + 3)
        legendX += Math.max(60, ctx.measureText(translatedLevelName).width + 25)
      })

      yPosition += 40

      // Grid-Layout mit individuellen Kategorie-Höhen
      categoryInfos.forEach((categoryInfo) => {
        const {
          name: categoryName,
          data: categoryData,
          height: categoryHeight,
          x: gridX,
          y: gridY,
        } = categoryInfo

        // Kategorie-Container mit Rahmen (individuelle Höhe)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(gridX, gridY, columnWidth, categoryHeight - 20)
        ctx.strokeStyle = '#e9ecef'
        ctx.lineWidth = 2
        ctx.strokeRect(gridX, gridY, columnWidth, categoryHeight - 20)

        // Kategorie-Header mit Hintergrund
        ctx.fillStyle = '#e9ecef'
        ctx.fillRect(gridX, gridY, columnWidth, 35)

        ctx.fillStyle = '#495057'
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'

        // Versuche den Kategorienamen zu übersetzen
        const translateCategoryName = (name: string): string => {
          // Normalisiere den Namen für die Übersetzungssuche
          const normalizedName = name
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z]/g, '')

          // Versuche verschiedene Übersetzungsschlüssel
          const possibleKeys = [
            `kinks.${normalizedName}`,
            `categories.${normalizedName}`,
            normalizedName,
          ]

          for (const key of possibleKeys) {
            const translated = currentT(key)
            if (translated && translated !== key) {
              return translated
            }
          }

          // Fallback: verwende den ursprünglichen Namen
          return name
        }

        const translatedCategoryName = translateCategoryName(categoryName)
        const categoryText = `📂 ${translatedCategoryName}`
        ctx.fillText(categoryText, gridX + 10, gridY + 10)

        // Fields-Header kompakt
        let fieldX = gridX + 270
        const fieldY = gridY + 50
        ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif'
        ctx.fillStyle = '#6c757d'

        categoryData.fields.forEach((field, fieldIndex) => {
          if (fieldIndex < 4) {
            // Maximal 4 Fields anzeigen
            ctx.fillText(field.substring(0, 10), fieldX, fieldY)
            fieldX += 50
          }
        })

        // Kinks in vollständiger Liste (nicht gekürzt)
        let kinkY = gridY + 70

        categoryData.kinks.forEach((kinkName) => {
          // Kink-Name ungekürzt anzeigen
          ctx.font = '10px "Segoe UI", Arial, sans-serif'
          ctx.fillStyle = '#212529'

          // Verwende vollen Namen, verkleinere Font falls nötig
          const maxKinkWidth = columnWidth - 120
          let fontSize = 10
          const displayName = kinkName

          while (
            ctx.measureText(displayName).width > maxKinkWidth &&
            fontSize > 7
          ) {
            fontSize -= 0.5
            ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`
          }

          ctx.fillText(displayName, gridX + 10, kinkY)

          // Kompakte Auswahl-Punkte horizontal - aligned mit Kink-Text
          let choiceX = gridX + maxKinkWidth + 20
          categoryData.fields.forEach((field, fieldIndex) => {
            if (fieldIndex < 4) {
              // Maximal 4 Fields
              const selectionItem = selection.find(
                (item) =>
                  item.category === categoryName &&
                  item.kink === kinkName &&
                  item.field === field
              )

              const levelKey = selectionItem?.value || 'Not Entered'
              const level = levels[levelKey]

              if (level && levelKey !== 'Not Entered') {
                ctx.fillStyle = level.color
                ctx.beginPath()
                // Kreis vertikal mit Text aligned (kinkY - 3 statt kinkY - 5)
                ctx.arc(choiceX + 8, kinkY + 5, 6, 0, 2 * Math.PI)
                ctx.fill()
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 0.5
                ctx.stroke()
              } else {
                ctx.strokeStyle = '#dee2e6'
                ctx.lineWidth = 1
                ctx.beginPath()
                // Leerer Kreis auch aligned (kinkY - 3 statt kinkY - 5)
                ctx.arc(choiceX + 8, kinkY + 5, 6, 0, 2 * Math.PI)
                ctx.stroke()
              }

              // Kommentar-Indikator
              if (selectionItem?.comment) {
                ctx.fillStyle = '#ffc107'
                ctx.font = '8px "Segoe UI", Arial, sans-serif'
                // Emoji auch aligned (kinkY statt kinkY - 2)
                ctx.fillText('💬', choiceX + 15, kinkY - 1)
              }

              choiceX += 25
            }
          })

          // Standard Kink-Höhe - wird durch Kommentare erweitert
          let kinkContentHeight = 22 // Basis-Höhe für Kink-Name und Choice-Punkte

          // Prüfe ob Kommentare vorhanden sind und berechne deren Höhe
          const commentsData: Array<{
            field: string
            comment: string
            lines: string[]
            height: number
          }> = []

          categoryData.fields.forEach((field) => {
            const selectionItem = selection.find(
              (item) =>
                item.category === categoryName &&
                item.kink === kinkName &&
                item.field === field
            )

            if (selectionItem?.comment) {
              // Funktion für Textumbruch
              const wrapText = (
                text: string,
                maxWidth: number,
                fontSize: number
              ): string[] => {
                ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`
                const words = text.split(' ')
                const lines: string[] = []
                let currentLine = ''

                for (const word of words) {
                  const testLine = currentLine + (currentLine ? ' ' : '') + word
                  const testWidth = ctx.measureText(testLine).width

                  if (testWidth > maxWidth && currentLine) {
                    lines.push(currentLine)
                    currentLine = word
                  } else {
                    currentLine = testLine
                  }
                }

                if (currentLine) {
                  lines.push(currentLine)
                }

                return lines
              }

              // Bereite Kommentar-Text vor
              const fullCommentText = `${field}: ${selectionItem.comment}`
              const maxCommentWidth = columnWidth - 40
              const commentLines = wrapText(fullCommentText, maxCommentWidth, 7)
              const commentHeight = commentLines.length * 10 + 16 // 10px pro Zeile + mehr Padding

              commentsData.push({
                field,
                comment: selectionItem.comment,
                lines: commentLines,
                height: commentHeight,
              })

              kinkContentHeight += commentHeight
            }
          })

          // Zeichne Kommentare direkt unter dem Kink
          if (commentsData.length > 0) {
            let commentY = kinkY + 22

            commentsData.forEach(({ lines, height }) => {
              // Kommentar-Hintergrund mit berechneter Höhe und mehr Padding
              ctx.fillStyle = 'rgba(108, 92, 231, 0.08)'
              ctx.fillRect(gridX + 10, commentY - 6, columnWidth - 20, height)

              // Dezenter Rahmen
              ctx.strokeStyle = 'rgba(108, 92, 231, 0.2)'
              ctx.lineWidth = 0.5
              ctx.strokeRect(gridX + 10, commentY - 6, columnWidth - 20, height)

              // Zeichne Kommentar-Zeilen mit mehr Innenabstand
              ctx.fillStyle = '#2d3436'
              ctx.font = '7px "Segoe UI", Arial, sans-serif'

              lines.forEach((line, lineIndex) => {
                const lineY = commentY + lineIndex * 10

                if (lineIndex === 0) {
                  // Erste Zeile: Field-Name fett
                  const colonIndex = line.indexOf(': ')
                  if (colonIndex > -1) {
                    ctx.font = 'bold 7px "Segoe UI", Arial, sans-serif'
                    ctx.fillStyle = '#6c5ce7'
                    ctx.fillText(
                      line.substring(0, colonIndex + 2),
                      gridX + 16,
                      lineY
                    )

                    const fieldWidth = ctx.measureText(
                      line.substring(0, colonIndex + 2)
                    ).width
                    ctx.font = '7px "Segoe UI", Arial, sans-serif'
                    ctx.fillStyle = '#2d3436'
                    ctx.fillText(
                      line.substring(colonIndex + 2),
                      gridX + 16 + fieldWidth,
                      lineY
                    )
                  } else {
                    ctx.fillText(line, gridX + 16, lineY)
                  }
                } else {
                  // Weitere Zeilen: normal, eingerückt
                  ctx.fillText(line, gridX + 22, lineY)
                }
              })

              commentY += height + 4 // Mehr Abstand zum nächsten Kommentar
            })
          }

          // Nächster Kink wird um die gesamte Kink-Content-Höhe verschoben
          kinkY += kinkContentHeight
        })
      })

      // Alle Kinks werden jetzt angezeigt - keine Kürzung mehr nötig

      // Kompakte Fußzeile
      const footerY = baseHeight - 25
      ctx.font = '9px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#adb5bd'
      ctx.fillText(`⚡ Neo-Kinklist v${getAppVersion()}`, margin, footerY)

      // Statistiken rechts
      const totalKinks = Object.values(kinks).reduce(
        (sum, cat) => sum + cat.kinks.length,
        0
      )
      const totalSelections = selection.filter(
        (s) => s.value !== 'Not Entered'
      ).length
      const statsText = `📊 ${totalSelections}/${totalKinks} ${currentT('export.canvas.completedSelections') || 'ausgefüllt'}`
      const statsWidth = ctx.measureText(statsText).width
      ctx.fillText(statsText, baseWidth - statsWidth - margin, footerY)

      return canvas
    },
    [kinks, levels, selection, t, i18n.language]
  )

  const performExport = useCallback(async () => {
    if (!pendingExport) return

    setIsLoading(true)
    setError(null)

    try {
      const { format, username } = pendingExport
      const timestamp = new Date().toISOString().slice(0, 10)
      const baseFilename = `kinklist_${username ? username.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'export'}_${timestamp}`

      const exportData = convertToExportData(kinks, levels, selection, username)
      const options: ExportOptions = {
        ...exportOptions,
        format,
        filename: `${baseFilename}.${format.toLowerCase()}`,
        t: t, // Übersetzungsfunktion hinzufügen
      }

      let result

      switch (format) {
        case 'JSON':
          result = await exportAsJSON(exportData, options)
          break
        case 'XML':
          result = await exportAsXML(exportData, options)
          break
        case 'CSV':
          result = await exportAsCSV(exportData, options)
          break
        case 'PDF':
          result = await exportAsPDF(exportData, options)
          break
        case 'PNG':
        case 'JPEG':
        case 'WebP': {
          const canvas = await createExportCanvas(username)
          if (format === 'PNG') {
            downloadImage(canvas, username)
            result = { success: true, filename: `${baseFilename}.png` }
          } else {
            result = await exportCanvasAsImage(
              canvas,
              format,
              baseFilename,
              0.92
            )
          }
          break
        }
        case 'SVG': {
          const canvas = await createExportCanvas(username)
          result = await exportAsSVG(options, canvas)
          break
        }
        default:
          throw new Error(`Unsupported format: ${format}`)
      }

      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => setIsSuccess(false), 3000)
        // Schließe Modal nach erfolgreichem Export
        setTimeout(() => onClose(), 1000)
      } else {
        setError(result.error || t('export.exportFailed'))
      }
    } catch (error) {
      setError(`${t('export.exportFailed')}: ${error}`)
    } finally {
      setIsLoading(false)
      setPendingExport(null)
    }
  }, [
    pendingExport,
    exportOptions,
    kinks,
    levels,
    selection,
    createExportCanvas,
    onClose,
    t,
  ])

  // Effect für automatischen Export
  React.useEffect(() => {
    if (pendingExport) {
      performExport()
    }
  }, [pendingExport, performExport])

  const handleCloseError = () => setError(null)
  if (!open) return null

  return (
    <>
      <div className="overlay visible" role="dialog" aria-modal="true">
        <div className="modal-content export-modal">
          <h2>📤 {t('export.exportKinklist')}</h2>

          {/* Export-Modi-Auswahl */}
          <div className="export-mode-selection">
            <h3>{t('export.exportMode')}</h3>
            <div className="mode-options">
              {exportModes.map((mode) => (
                <button
                  key={mode.mode}
                  className={`mode-button ${selectedMode === mode.mode ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMode(mode.mode)
                    setExportOptions((prev) => ({
                      ...prev,
                      ...mode.defaultOptions,
                    }))
                  }}
                >
                  <div className="mode-header">
                    <strong>{mode.title}</strong>
                    <span className="mode-format-count">
                      {mode.formats.length}{' '}
                      {t('export.modes.quick.formatsCount')}
                    </span>
                  </div>
                  <p className="mode-description">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export-Optionen - nur im erweiterten Modus */}
          {selectedMode === 'advanced' && (
            <div className="export-options">
              <h3>{t('export.exportSettings')}</h3>
              <div className="export-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeComments}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeComments: e.target.checked,
                      }))
                    }
                  />
                  {t('export.includeComments')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeDescriptions}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeDescriptions: e.target.checked,
                      }))
                    }
                  />
                  {t('export.includeDescriptions')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeMetadata: e.target.checked,
                      }))
                    }
                  />
                  {t('export.includeMetadata')}
                </label>
              </div>
            </div>
          )}

          {/* Format-Auswahl */}
          <div className="export-formats">
            <h3>
              {selectedMode === 'quick'
                ? t('export.quickExport')
                : t('export.exportFormats')}
            </h3>
            <div className="format-grid">
              {exportModes
                .find((mode) => mode.mode === selectedMode)
                ?.formats.map((format) => (
                  <div key={format} className="format-card">
                    <div className="format-header">
                      <strong>{format}</strong>
                      <span className="format-type">
                        {' '}
                        {['PNG', 'JPEG', 'WebP', 'SVG'].includes(format)
                          ? t('export.formats.image')
                          : ['JSON', 'XML', 'CSV'].includes(format)
                            ? t('export.formats.data')
                            : t('export.formats.document')}
                      </span>
                    </div>
                    <p className="format-description">
                      {formatDescriptions[format]}
                    </p>
                    <button
                      className="btn btn-primary export-format-btn"
                      onClick={() => handleExport(format as ExportFormat)}
                      disabled={isLoading}
                    >
                      {t('export.actions.exportAs', { format })}
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              {t('buttons.close')}
            </button>
          </div>
        </div>
      </div>

      <NameModal
        open={isNameModalOpen}
        onSubmit={handleNameSubmit}
        onClose={() => setIsNameModalOpen(false)}
      />

      {error && <ErrorModal message={error} onClose={handleCloseError} />}

      {isSuccess && (
        <div className="overlay visible">
          <div className="modal-content success-modal">
            <h2>✅ {t('export.exportSuccessful')}</h2>
            <p>{t('success.export')}</p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => setIsSuccess(false)}
              >
                {t('buttons.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="overlay visible">
          <div className="modal-content loading-modal">
            <h2>{t('export.preparing')}</h2>
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
            </div>
            <p>{t('export.pleaseWait')}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default ExportModal
