import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import i18n from '../i18n'
import { KinksData, LevelsData, Selection } from '../types'
import {
  ExportData,
  ExportOptions,
  ExportResult,
  ImportResult,
} from '../types/export'
import { getStableIdsFromOriginal } from './multilingualTemplates'
import { getAppVersion } from './version'

/**
 * Filtert Kinks und Kategorien, um nur ausgefüllte oder kommentierte Einträge zu behalten
 */
/**
 * Helper function to find a selection item using stable IDs first, then fallback to names
 */
const findSelectionItem = (
  selection: Selection[],
  categoryName: string,
  kinkName: string,
  field: string,
  enhancedKinks?: any
): Selection | undefined => {
  // Generate stable IDs for consistent matching
  const stableIds = getStableIdsFromOriginal(
    enhancedKinks,
    categoryName,
    kinkName,
    field
  )

  return selection.find((item) => {
    // First try to match by stable IDs if available
    if (item.categoryId && item.kinkId && item.fieldId) {
      return (
        item.categoryId === stableIds.categoryId &&
        item.kinkId === stableIds.kinkId &&
        item.fieldId === stableIds.fieldId
      )
    }
    // Fallback to name matching
    return (
      item.category === categoryName &&
      item.kink === kinkName &&
      item.field === field
    )
  })
}

/**
 * Filtert Kinks und Kategorien, um nur ausgefüllte oder kommentierte Einträge zu behalten
 */
const filterFilledOrCommentedKinks = (
  kinks: KinksData,
  selection: Selection[],
  enhancedKinks?: any
): KinksData => {
  const filteredKinks: KinksData = {}
  const notEntered = i18n.t('legend.notEntered')
  Object.keys(kinks).forEach((categoryName) => {
    const category = kinks[categoryName]
    const filteredKinkList: string[] = []
    const filteredDescriptions: string[] = []
    category.kinks.forEach((kinkName, index) => {
      // Prüfe, ob mindestens ein Field für diesen Kink ausgefüllt oder kommentiert ist
      const hasFilledOrCommentedField = category.fields.some((field) => {
        const selectionItem = findSelectionItem(
          selection,
          categoryName,
          kinkName,
          field,
          enhancedKinks
        )
        // Kink ist relevant, wenn:
        // 1. Es eine Auswahl gibt und sie nicht "Not Entered" ist
        // 2. Oder es einen Kommentar gibt
        return (
          selectionItem &&
          (selectionItem.value !== notEntered ||
            (selectionItem.comment && selectionItem.comment.trim().length > 0))
        )
      })
      if (hasFilledOrCommentedField) {
        filteredKinkList.push(kinkName)
        filteredDescriptions.push(category.descriptions?.[index] || '')
      }
    })
    // Nur Kategorien mit mindestens einem relevanten Kink hinzufügen
    if (filteredKinkList.length > 0) {
      filteredKinks[categoryName] = {
        ...category,
        kinks: filteredKinkList,
        descriptions: filteredDescriptions,
      }
    }
  })
  return filteredKinks
}

/**
 * Konvertiert Kinklist-Daten in ein standardisiertes Export-Format
 * Exportiert nur ausgefüllte oder kommentierte Kinks
 */
export const convertToExportData = (
  kinks: KinksData,
  levels: LevelsData,
  selection: Selection[],
  username?: string,
  enhancedKinks?: any
): ExportData => {
  const filteredKinks = filterFilledOrCommentedKinks(
    kinks,
    selection,
    enhancedKinks
  )
  const notEntered = i18n.t('legend.notEntered')
  const categories = Object.keys(filteredKinks).map((categoryName) => {
    const category = filteredKinks[categoryName]
    const categoryKinks = category.kinks.map((kinkName, index) => {
      const kinkSelections: {
        [field: string]: { level: string; comment?: string }
      } = {}
      category.fields.forEach((field) => {
        const selectionItem = findSelectionItem(
          selection,
          categoryName,
          kinkName,
          field,
          enhancedKinks
        )
        kinkSelections[field] = {
          level: selectionItem?.value || notEntered,
          comment: selectionItem?.comment || undefined,
        }
      })
      return {
        name: kinkName,
        description: category.descriptions?.[index],
        selections: kinkSelections,
      }
    })
    return {
      name: categoryName,
      fields: category.fields,
      kinks: categoryKinks,
    }
  })
  return {
    metadata: {
      exportDate: new Date().toISOString(),
      version: getAppVersion(),
      username,
      totalCategories: Object.keys(filteredKinks).length,
      totalKinks: Object.values(filteredKinks).reduce(
        (sum, cat) => sum + cat.kinks.length,
        0
      ),
      totalSelections: selection.filter((s) => s.value !== notEntered).length,
    },
    levels,
    categories,
  }
}

/**
 * Exportiert Daten als JSON
 */
export const exportAsJSON = async (
  data: ExportData,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.json`
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: i18n.t('export.errors.jsonExportFailed', { error: String(error) }),
    }
  }
}

/**
 * Exportiert Daten als XML
 */
export const exportAsXML = async (
  data: ExportData,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.xml`

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<kinklist>\n'

    // Metadata
    if (options.includeMetadata) {
      xml += '  <metadata>\n'
      xml += `    <exportDate>${escapeXml(data.metadata.exportDate)}</exportDate>\n`
      xml += `    <version>${escapeXml(data.metadata.version)}</version>\n`
      if (data.metadata.username) {
        xml += `    <username>${escapeXml(data.metadata.username)}</username>\n`
      }
      xml += `    <totalCategories>${data.metadata.totalCategories}</totalCategories>\n`
      xml += `    <totalKinks>${data.metadata.totalKinks}</totalKinks>\n`
      xml += `    <totalSelections>${data.metadata.totalSelections}</totalSelections>\n`
      xml += '  </metadata>\n'
    }

    // Levels
    xml += '  <levels>\n'
    Object.entries(data.levels).forEach(([levelKey, level]) => {
      xml += `    <level key="${escapeXml(levelKey)}">\n`
      xml += `      <name>${escapeXml(level.name)}</name>\n`
      xml += `      <color>${escapeXml(level.color)}</color>\n`
      xml += `      <class>${escapeXml(level.class)}</class>\n`
      xml += '    </level>\n'
    })
    xml += '  </levels>\n'

    // Categories
    xml += '  <categories>\n'
    data.categories.forEach((category) => {
      xml += '    <category>\n'
      xml += `      <name>${escapeXml(category.name)}</name>\n`
      xml += '      <fields>\n'
      category.fields.forEach((field) => {
        xml += `        <field>${escapeXml(field)}</field>\n`
      })
      xml += '      </fields>\n'
      xml += '      <kinks>\n'

      category.kinks.forEach((kink) => {
        xml += '        <kink>\n'
        xml += `          <name>${escapeXml(kink.name)}</name>\n`
        if (options.includeDescriptions && kink.description) {
          xml += `          <description>${escapeXml(kink.description)}</description>\n`
        }
        xml += '          <selections>\n'

        Object.entries(kink.selections).forEach(([field, selection]) => {
          xml += `            <selection field="${escapeXml(field)}">\n`
          xml += `              <level>${escapeXml(selection.level)}</level>\n`
          if (options.includeComments && selection.comment) {
            xml += `              <comment>${escapeXml(selection.comment)}</comment>\n`
          }
          xml += '            </selection>\n'
        })

        xml += '          </selections>\n'
        xml += '        </kink>\n'
      })

      xml += '      </kinks>\n'
      xml += '    </category>\n'
    })
    xml += '  </categories>\n'
    xml += '</kinklist>'

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' })
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: i18n.t('export.errors.xmlExportFailed', { error: String(error) }),
    }
  }
}

/**
 * Exportiert Daten als CSV
 */
export const exportAsCSV = async (
  data: ExportData,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.csv`

    const csvData: any[] = []

    // Header
    const headers = [
      i18n.t('export.csv.headers.category'),
      i18n.t('export.csv.headers.kink'),
      i18n.t('export.csv.headers.field'),
      i18n.t('export.csv.headers.level'),
      ...(options.includeComments
        ? [i18n.t('export.csv.headers.comment')]
        : []),
      ...(options.includeDescriptions
        ? [i18n.t('export.csv.headers.description')]
        : []),
    ]
    csvData.push(headers)

    // Data rows
    data.categories.forEach((category) => {
      category.kinks.forEach((kink) => {
        Object.entries(kink.selections).forEach(([field, selection]) => {
          const row = [
            category.name,
            kink.name,
            field,
            selection.level,
            ...(options.includeComments ? [selection.comment || ''] : []),
            ...(options.includeDescriptions ? [kink.description || ''] : []),
          ]
          csvData.push(row)
        })
      })
    })

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: i18n.t('export.errors.csvExportFailed', { error: String(error) }),
    }
  }
}

/**
 * Erstellt ein verbessertes professionelles PDF mit modernem Design entsprechend dem Bild-Export
 */
export const exportAsPDF = async (
  data: ExportData,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.pdf`

    // Übersetzungsfunktion mit Fallback
    const t = options.t || ((key: string) => key)

    // Hilfsfunktion für Kategorienamen-Übersetzung
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
        const translated = t(key)
        if (translated && translated !== key) {
          return translated
        }
      }

      // Fallback: verwende den ursprünglichen Namen
      return name
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - 2 * margin
    let currentY = margin

    // Moderner Gradient-ähnlicher Header (Grau-Verlauf simulation)
    pdf.setFillColor(248, 249, 250) // Heller Grau-Ton
    pdf.rect(0, 0, pageWidth, 40, 'F')

    // Hauptpanel-Simulation mit dezentem Schatten-Effekt
    pdf.setFillColor(255, 255, 255)
    pdf.rect(5, 35, pageWidth - 10, pageHeight - 45, 'F')
    pdf.setDrawColor(233, 236, 239)
    pdf.setLineWidth(1)
    pdf.rect(5, 35, pageWidth - 10, pageHeight - 45)

    // Moderner Header-Titel (ohne Emojis für PDF-Kompatibilität)
    pdf.setTextColor(44, 62, 80) // #2c3e50
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    const title = data.metadata.username
      ? t('export.pdf.userTitle', { username: data.metadata.username }) ||
        `${data.metadata.username}'s Kink List`
      : t('export.pdf.title') || 'Kink List'
    const titleWidth = pdf.getTextWidth(title)
    const titleX = (pageWidth - titleWidth) / 2
    pdf.text(title, titleX, 25)

    // Dezente Untertitel-Linie
    pdf.setDrawColor(206, 212, 218)
    pdf.setLineWidth(0.5)
    pdf.line(margin + 20, 32, pageWidth - margin - 20, 32)

    currentY = 50

    // Kompakte Info-Sektion (ohne Emojis)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(173, 181, 189) // #adb5bd
    const infoText = `Neo-Kinklist v${data.metadata.version} | ${new Date(data.metadata.exportDate).toLocaleDateString('de-DE')}`
    pdf.text(infoText, margin, currentY)

    // Statistiken rechts (ohne Emojis)
    const statsText =
      t('export.pdf.completedSelections', {
        completed: data.metadata.totalSelections,
        total: data.metadata.totalKinks,
      }) ||
      `${data.metadata.totalSelections}/${data.metadata.totalKinks} completed`
    const statsWidth = pdf.getTextWidth(statsText)
    pdf.text(statsText, pageWidth - margin - statsWidth, currentY)

    currentY += 15

    // Moderne Legende (ohne Emojis)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(44, 62, 80)
    pdf.text(t('legend.titleSimple') || 'Legend:', margin, currentY)
    currentY += 8

    // Legende in kompakter Form (ähnlich Canvas-Grid)
    const legendColumns = 4
    const legendItemWidth = contentWidth / legendColumns
    let legendX = margin
    let legendRowCount = 0

    Object.entries(data.levels).forEach(([levelName, level]) => {
      if (levelName === i18n.t('legend.notEntered')) return

      // Moderner Farbkreis (wie im Canvas-Export)
      const hexColor = level.color
      const rgb = hexToRgb(hexColor)
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.3)
        pdf.circle(legendX + 3, currentY - 1, 2, 'FD') // Gefüllter Kreis mit Rahmen
      }

      // Kompakte Label-Darstellung mit Übersetzung
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(33, 37, 41) // #212529

      // Übersetze den Level-Namen
      const levelKey = levelName.toLowerCase().replace(/\s+/g, '')
      const translationKey = levelKey === 'notentered' ? 'notEntered' : levelKey
      const translatedLevelName = t(`legend.${translationKey}`) || levelName

      const truncatedName =
        translatedLevelName.length > 12
          ? translatedLevelName.substring(0, 12) + '...'
          : translatedLevelName
      pdf.text(truncatedName, legendX + 8, currentY)

      legendX += legendItemWidth
      legendRowCount++

      if (legendRowCount >= legendColumns) {
        legendX = margin
        legendRowCount = 0
        currentY += 6
      }
    })

    if (legendRowCount > 0) {
      currentY += 8
    }
    currentY += 15

    // Moderne Kategorien mit Canvas-ähnlichem Design
    data.categories.forEach((category) => {
      // Check if we need a new page for category header
      if (currentY > pageHeight - 60) {
        pdf.addPage()
        // Wiederhole Hauptpanel für neue Seite
        pdf.setFillColor(255, 255, 255)
        pdf.rect(5, 5, pageWidth - 10, pageHeight - 10, 'F')
        pdf.setDrawColor(233, 236, 239)
        pdf.setLineWidth(1)
        pdf.rect(5, 5, pageWidth - 10, pageHeight - 10)
        currentY = margin
      }

      // Moderner Kategorie-Header (ohne Emojis)
      pdf.setFillColor(233, 236, 239) // #e9ecef
      pdf.rect(margin, currentY - 3, contentWidth, 12, 'F')

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(73, 80, 87) // #495057

      // Übersetze den Kategorienamen
      const translatedCategoryName = translateCategoryName(category.name)
      pdf.text(`[${translatedCategoryName}]`, margin + 3, currentY + 4)
      currentY += 12

      // Kompakte Fields-Anzeige (wie im Canvas)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(108, 117, 125) // #6c757d
      const fieldsText = category.fields.slice(0, 4).join(' • ')
      pdf.text(fieldsText, margin + 3, currentY + 3)
      currentY += 8

      // Kinks mit modernem Layout
      category.kinks.forEach((kink) => {
        // Schätze benötigte Höhe
        const baseHeight = 6
        const commentsHeight = options.includeComments
          ? Object.values(kink.selections).filter((s) => s.comment).length * 3
          : 0
        const estimatedHeight = baseHeight + commentsHeight + 2

        // Überprüfe Seitenumbruch
        if (currentY + estimatedHeight > pageHeight - margin) {
          pdf.addPage()
          pdf.setFillColor(255, 255, 255)
          pdf.rect(5, 5, pageWidth - 10, pageHeight - 10, 'F')
          pdf.setDrawColor(233, 236, 239)
          pdf.setLineWidth(1)
          pdf.rect(5, 5, pageWidth - 10, pageHeight - 10)
          currentY = margin
        }

        // Kink-Name mit Canvas-ähnlicher Typografie
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(33, 37, 41) // #212529

        // Kürze lange Namen falls nötig
        const maxKinkWidth = 100
        let displayName = kink.name
        while (
          pdf.getTextWidth(displayName) > maxKinkWidth &&
          displayName.length > 10
        ) {
          displayName = displayName.substring(0, displayName.length - 4) + '...'
        }
        pdf.text(displayName, margin + 3, currentY + 3)

        // Choice-Kreise (wie im Canvas-Export)
        let choiceX = margin + 105
        category.fields.slice(0, 4).forEach((field) => {
          const selection = kink.selections[field]
          if (selection && selection.level !== i18n.t('legend.notEntered')) {
            const level = data.levels[selection.level]
            if (level) {
              const rgb = hexToRgb(level.color)
              if (rgb) {
                pdf.setFillColor(rgb.r, rgb.g, rgb.b)
                pdf.setDrawColor(0, 0, 0)
                pdf.setLineWidth(0.2)
                pdf.circle(choiceX + 2, currentY + 2, 1.5, 'FD')
              }
            }
          } else {
            // Leerer Kreis für Not Entered
            pdf.setDrawColor(222, 226, 230) // #dee2e6
            pdf.setLineWidth(0.3)
            pdf.circle(choiceX + 2, currentY + 2, 1.5, 'D')
          }

          // Kommentar-Indikator (ohne Emoji)
          if (selection?.comment) {
            pdf.setFontSize(6)
            pdf.setTextColor(255, 193, 7) // #ffc107
            pdf.text(
              t('export.pdf.commentIndicator') || 'C',
              choiceX + 4,
              currentY + 3
            )
          }

          choiceX += 8
        })

        currentY += 6

        // Moderne Kommentare mit Textumbruch (wie beim Canvas-Export)
        if (options.includeComments) {
          Object.entries(kink.selections).forEach(([field, selection]) => {
            if (selection.comment) {
              // Textumbruch-Funktion für PDF
              const wrapTextForPDF = (
                text: string,
                maxWidth: number
              ): string[] => {
                const words = text.split(' ')
                const lines: string[] = []
                let currentLine = ''

                for (const word of words) {
                  const testLine = currentLine + (currentLine ? ' ' : '') + word
                  const testWidth = pdf.getTextWidth(testLine)

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

              // Bereite Kommentar-Text mit Field-Name vor
              const fullCommentText = `${field}: ${selection.comment}`
              const maxCommentWidth = contentWidth - 16 // Abzug für Padding

              // Setze Font für Breiten-Berechnung
              pdf.setFontSize(7)
              pdf.setFont('helvetica', 'normal')

              const commentLines = wrapTextForPDF(
                fullCommentText,
                maxCommentWidth
              )
              const commentHeight = commentLines.length * 3 + 4 // 3mm pro Zeile + Padding

              // Kommentar-Hintergrund mit dynamischer Höhe
              pdf.setFillColor(240, 240, 255) // Heller Lila-Ton
              pdf.rect(
                margin + 3,
                currentY - 1,
                contentWidth - 6,
                commentHeight + 4,
                'F'
              )

              // Dezenter Rahmen
              pdf.setDrawColor(200, 200, 200)
              pdf.setLineWidth(0.2)
              pdf.rect(
                margin + 3,
                currentY - 1,
                contentWidth - 6,
                commentHeight + 4
              )

              // Zeichne Kommentar-Zeilen
              commentLines.forEach((line, lineIndex) => {
                const lineY = currentY + 3 + lineIndex * 3

                if (lineIndex === 0) {
                  // Erste Zeile: Field-Name fett
                  const colonIndex = line.indexOf(': ')
                  if (colonIndex > -1) {
                    pdf.setFont('helvetica', 'bold')
                    pdf.setTextColor(108, 92, 231) // #6c5ce7
                    pdf.text(
                      line.substring(0, colonIndex + 2),
                      margin + 4,
                      lineY
                    )

                    const fieldWidth = pdf.getTextWidth(
                      line.substring(0, colonIndex + 2)
                    )
                    pdf.setFont('helvetica', 'normal')
                    pdf.setTextColor(60, 60, 60) // Dunkler Grau
                    pdf.text(
                      line.substring(colonIndex + 2),
                      margin + 5 + fieldWidth,
                      lineY
                    )
                  } else {
                    pdf.setFont('helvetica', 'normal')
                    pdf.setTextColor(60, 60, 60)
                    pdf.text(line, margin + 5, lineY)
                  }
                } else {
                  // Weitere Zeilen: normal, leicht eingerückt
                  pdf.setFont('helvetica', 'normal')
                  pdf.setTextColor(60, 60, 60)
                  pdf.text(line, margin + 8, lineY)
                }
              })

              currentY += commentHeight + 6 // Abstand zum nächsten Kommentar
            }
          })
        }

        currentY += 2
      })

      // Dezenter Kategorie-Abstand
      currentY += 6
    })

    // Moderner Footer (ähnlich Canvas-Export)
    const pageCount = (pdf as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)

      // Footer-Hintergrund
      pdf.setFillColor(248, 249, 250)
      pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F')

      // Footer-Text (ohne Emoji)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(173, 181, 189) // #adb5bd
      pdf.text(`Neo-Kinklist v${data.metadata.version}`, margin, pageHeight - 5)

      // Seitenzahl rechts
      pdf.text(
        `Seite ${i} von ${pageCount}`,
        pageWidth - margin - 20,
        pageHeight - 5
      )
    }

    pdf.save(filename)

    return {
      success: true,
      filename,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error:
        (options.t &&
          options.t('export.errors.pdfExportFailed', {
            error: String(error),
          })) ||
        `PDF export failed: ${error}`,
    }
  }
}

/**
 * Hilfsfunktion zur Konvertierung von Hex zu RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Exportiert Canvas als verschiedene Bildformate
 */
export const exportCanvasAsImage = async (
  canvas: HTMLCanvasElement,
  format: 'PNG' | 'JPEG' | 'WebP',
  filename: string,
  quality: number = 0.92
): Promise<ExportResult> => {
  try {
    let mimeType: string
    let extension: string

    switch (format) {
      case 'PNG':
        mimeType = 'image/png'
        extension = 'png'
        break
      case 'JPEG':
        mimeType = 'image/jpeg'
        extension = 'jpg'
        break
      case 'WebP':
        mimeType = 'image/webp'
        extension = 'webp'
        break
    }

    const finalFilename = filename.includes('.')
      ? filename.replace(/\.[^/.]+$/, `.${extension}`)
      : `${filename}.${extension}`

    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, finalFilename)
        }
      },
      mimeType,
      quality
    )

    return {
      success: true,
      filename: finalFilename,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: i18n.t('export.errors.imageExportFailed', {
        error: String(error),
      }),
    }
  }
}

/**
 * Exportiert als SVG
 */
export const exportAsSVG = async (
  options: ExportOptions,
  canvas: HTMLCanvasElement
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.svg`

    // Create SVG from canvas content
    const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <defs>
    <style>
      .kink-title { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; }
      .kink-desc { font-family: Arial, sans-serif; font-size: 10px; font-style: italic; fill: #666; }
      .category-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #3f51b5; }
      .comment { font-family: Arial, sans-serif; font-size: 10px; font-style: italic; fill: #0277bd; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
`

    let svgContent = svgHeader

    // Convert canvas to data URL and embed as image
    const dataURL = canvas.toDataURL('image/png')
    svgContent += `  <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}" x="0" y="0"/>`

    svgContent += '\n</svg>'

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: i18n.t('export.errors.svgExportFailed', { error: String(error) }),
    }
  }
}

/**
 * Importiert JSON-Daten zurück in die Anwendung
 */
export const importFromJSON = (jsonString: string): ImportResult => {
  try {
    const data: ExportData = JSON.parse(jsonString)

    // Validierung der Datenstruktur
    if (!data.metadata || !data.levels || !data.categories) {
      throw new Error(i18n.t('export.errors.invalidDataFormat'))
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: i18n.t('export.errors.importFailed', { error: String(error) }),
    }
  }
}

/**
 * Hilfsfunktion für XML-Escaping
 */
const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

/**
 * Exportiert als XML mit vollständiger Datenstruktur
 */
export const exportAsXMLFull = async (
  data: ExportData,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.xml`

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<kinklist>\n'

    // Metadata
    if (options.includeMetadata) {
      xml += '  <metadata>\n'
      xml += `    <exportDate>${escapeXml(data.metadata.exportDate)}</exportDate>\n`
      xml += `    <version>${escapeXml(data.metadata.version)}</version>\n`
      if (data.metadata.username) {
        xml += `    <username>${escapeXml(data.metadata.username)}</username>\n`
      }
      xml += `    <totalCategories>${data.metadata.totalCategories}</totalCategories>\n`
      xml += `    <totalKinks>${data.metadata.totalKinks}</totalKinks>\n`
      xml += `    <totalSelections>${data.metadata.totalSelections}</totalSelections>\n`
      xml += '  </metadata>\n'
    }

    // Levels
    xml += '  <levels>\n'
    Object.entries(data.levels).forEach(([levelKey, level]) => {
      xml += `    <level key="${escapeXml(levelKey)}">\n`
      xml += `      <name>${escapeXml(level.name)}</name>\n`
      xml += `      <color>${escapeXml(level.color)}</color>\n`
      xml += `      <class>${escapeXml(level.class)}</class>\n`
      xml += '    </level>\n'
    })
    xml += '  </levels>\n'

    // Categories
    xml += '  <categories>\n'
    data.categories.forEach((category) => {
      xml += '    <category>\n'
      xml += `      <name>${escapeXml(category.name)}</name>\n`
      xml += '      <fields>\n'
      category.fields.forEach((field) => {
        xml += `        <field>${escapeXml(field)}</field>\n`
      })
      xml += '      </fields>\n'
      xml += '      <kinks>\n'

      category.kinks.forEach((kink) => {
        xml += '        <kink>\n'
        xml += `          <name>${escapeXml(kink.name)}</name>\n`
        if (options.includeDescriptions && kink.description) {
          xml += `          <description>${escapeXml(kink.description)}</description>\n`
        }
        xml += '          <selections>\n'

        Object.entries(kink.selections).forEach(([field, selection]) => {
          xml += `            <selection field="${escapeXml(field)}">\n`
          xml += `              <level>${escapeXml(selection.level)}</level>\n`
          if (options.includeComments && selection.comment) {
            xml += `              <comment>${escapeXml(selection.comment)}</comment>\n`
          }
          xml += '            </selection>\n'
        })

        xml += '          </selections>\n'
        xml += '        </kink>\n'
      })

      xml += '      </kinks>\n'
      xml += '    </category>\n'
    })
    xml += '  </categories>\n'
    xml += '</kinklist>'

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' })
    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: i18n.t('export.errors.xmlExportFailed', { error: String(error) }),
    }
  }
}

/**
 * Importiert XML-Daten zurück in die Anwendung
 */
export const importFromXML = (xmlString: string): ImportResult => {
  try {
    // Normalisiere Line Endings und entferne potentielle BOM
    const cleanedXmlString = xmlString
      .replace(/\r\n/g, '\n')
      .replace(/^\uFEFF/, '')

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(cleanedXmlString, 'text/xml')

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      console.error(
        i18n.t('export.errors.xmlParseError'),
        parseError.textContent
      )
      throw new Error(
        i18n.t('export.errors.invalidXmlFormat', {
          error: parseError.textContent,
        })
      )
    }

    const root = xmlDoc.querySelector('kinklist')
    if (!root) {
      console.error(i18n.t('export.errors.noRootElement'))
      throw new Error(i18n.t('export.errors.invalidXmlStructure'))
    }

    // Parse metadata
    const metadataNode = root.querySelector('metadata')
    const metadata = {
      exportDate:
        metadataNode?.querySelector('exportDate')?.textContent ||
        new Date().toISOString(),
      version: metadataNode?.querySelector('version')?.textContent || '1.0.0',
      username:
        metadataNode?.querySelector('username')?.textContent || undefined,
      totalCategories: parseInt(
        metadataNode?.querySelector('totalCategories')?.textContent || '0'
      ),
      totalKinks: parseInt(
        metadataNode?.querySelector('totalKinks')?.textContent || '0'
      ),
      totalSelections: parseInt(
        metadataNode?.querySelector('totalSelections')?.textContent || '0'
      ),
    }

    // Parse levels
    const levels: {
      [key: string]: { name: string; color: string; class: string }
    } = {}
    root.querySelectorAll('levels > level').forEach((levelNode) => {
      const key = levelNode.getAttribute('key') || ''
      if (key) {
        // Support both <n> and <name> for level names
        const levelNameElement =
          levelNode.querySelector('n') || levelNode.querySelector('name')
        levels[key] = {
          name: levelNameElement?.textContent || key,
          color: levelNode.querySelector('color')?.textContent || '#000000',
          class:
            levelNode.querySelector('class')?.textContent ||
            key.toLowerCase().replace(/\s+/g, '-'),
        }
      }
    })

    // Falls keine Levels gefunden wurden, erstelle Standard-Levels
    if (Object.keys(levels).length === 0) {
      const defaultLevels = getInitialLevels(i18n)
      Object.entries(defaultLevels).forEach(([key, value]) => {
        levels[key] = value
      })
    }

    // Parse categories
    const categories: ExportData['categories'] = []
    // Finde das categories-Element und dann alle category-Children
    const categoriesElement = root.querySelector('categories')
    const categoryNodes = categoriesElement
      ? categoriesElement.querySelectorAll('category')
      : root.querySelectorAll('category')

    // Debug output for development
    // console.log('=== XML IMPORT DEBUG ===')
    // console.log('Root element:', root.tagName)
    // console.log(
    //   'Root children:',
    //   Array.from(root.children).map((child) => child.tagName)
    // )
    // console.log('Categories element exists:', !!categoriesElement)
    // console.log('Found category nodes:', categoryNodes.length)
    console.log(
      'Direct category query:',
      root.querySelectorAll('category').length
    )
    console.log(
      'CSS selector categories > category:',
      root.querySelectorAll('categories > category').length
    )

    // Debug: Zeige die vollständige XML-Struktur
    console.log('Full XML innerHTML:', root.innerHTML.substring(0, 500) + '...')

    categoryNodes.forEach((categoryNode, categoryIndex) => {
      // Support both <n> and <name> for category names
      const categoryNameElement =
        categoryNode.querySelector('n') || categoryNode.querySelector('name')
      const categoryName = categoryNameElement?.textContent || ''
      console.log(`Processing category ${categoryIndex}: "${categoryName}"`)

      const category = {
        name: categoryName,
        fields: Array.from(categoryNode.querySelectorAll('fields > field')).map(
          (fieldNode) => fieldNode.textContent || ''
        ),
        kinks: [] as ExportData['categories'][0]['kinks'],
      }
      console.log(
        `Category "${categoryName}" has ${category.fields.length} fields:`,
        category.fields
      )

      // Falls keine Felder gefunden wurden, setze ein Standard-Feld
      if (category.fields.length === 0) {
        category.fields = ['General']
        console.log(
          `No fields found for category "${categoryName}", using default: ['General']`
        )
      }

      const kinkNodes = categoryNode.querySelectorAll('kinks > kink')
      console.log(
        `Category "${categoryName}" has ${kinkNodes.length} kink nodes`
      )

      kinkNodes.forEach((kinkNode, kinkIndex) => {
        // Support both <n> and <name> for kink names
        const kinkNameElement =
          kinkNode.querySelector('n') || kinkNode.querySelector('name')
        const kinkName = kinkNameElement?.textContent || ''
        console.log(`Processing kink ${kinkIndex}: "${kinkName}"`)

        const kink = {
          name: kinkName,
          description:
            kinkNode.querySelector('description')?.textContent || undefined,
          selections: {} as {
            [field: string]: { level: string; comment?: string }
          },
        }

        // Parse selections
        const selectionNodes = kinkNode.querySelectorAll(
          'selections > selection'
        )
        console.log(
          `Kink "${kinkName}" has ${selectionNodes.length} selection nodes`
        )

        selectionNodes.forEach((selectionNode, selectionIndex) => {
          const field =
            selectionNode.getAttribute('field') ||
            category.fields[0] ||
            'General'
          const level =
            selectionNode.querySelector('level')?.textContent || 'Not Entered'
          const comment =
            selectionNode.querySelector('comment')?.textContent || undefined

          console.log(
            `Selection ${selectionIndex}: field="${field}", level="${level}"`
          )

          kink.selections[field] = {
            level,
            comment,
          }
        })

        // Stelle sicher, dass für jedes Feld eine Selection existiert
        category.fields.forEach((field) => {
          if (!kink.selections[field]) {
            kink.selections[field] = {
              level: 'Not Entered',
              comment: undefined,
            }
            console.log(
              `Added default selection for field "${field}" in kink "${kinkName}"`
            )
          }
        })

        // Füge Kink hinzu, auch wenn der Name leer ist (für Debug-Zwecke)
        if (kinkName.trim() || Object.keys(kink.selections).length > 0) {
          category.kinks.push(kink)
          console.log(`Added kink "${kinkName}" to category "${categoryName}"`)
        } else {
          console.log(`Skipped empty kink in category "${categoryName}"`)
        }
      })

      // Füge Kategorie hinzu, auch wenn sie leer ist (für Debug-Zwecke)
      if (categoryName.trim()) {
        categories.push(category)
        console.log(
          `Added category "${categoryName}" with ${category.kinks.length} kinks`
        )
      } else {
        console.log('Skipped category with empty name')
      }
    })

    console.log(`Total categories processed: ${categories.length}`)

    if (categories.length === 0) {
      console.error('No valid categories found. Check XML structure:')
      console.error('- Root element:', root.tagName)
      console.error(
        '- Categories element exists:',
        !!root.querySelector('categories')
      )
      console.error(
        '- Category elements:',
        root.querySelectorAll('category').length
      )
      console.error(
        '- Categories > category elements:',
        root.querySelectorAll('categories > category').length
      )

      // Zeige XML-Struktur für Debug
      console.error(
        '- First 500 chars of XML content:',
        xmlString.substring(0, 500)
      )

      throw new Error(
        'No valid categories found in XML. Please check the XML format and structure.'
      )
    }

    const data: ExportData = {
      metadata,
      levels,
      categories,
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error(i18n.t('export.errors.xmlImportError'), error)
    return {
      success: false,
      error: `XML Import failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Importiert CSV-Daten zurück in die Anwendung
 */
export const importFromCSV = (csvString: string): ImportResult => {
  try {
    const parsed = Papa.parse(csvString, { header: true })

    if (!parsed.data || parsed.data.length === 0) {
      throw new Error('Keine Daten in CSV gefunden')
    }

    const data = parsed.data as any[]
    const categoriesMap = new Map<string, any>()
    const levelsSet = new Set<string>()

    // Parse data rows
    data.forEach((row: any) => {
      if (!row.Category || !row.Kink || !row.Field || !row.Level) return

      const categoryName = row.Category
      const kinkName = row.Kink
      const field = row.Field
      const level = row.Level
      const comment = row.Comment || undefined
      const description = row.Description || undefined

      levelsSet.add(level)

      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, {
          name: categoryName,
          fields: new Set<string>(),
          kinks: new Map<string, any>(),
        })
      }

      const category = categoriesMap.get(categoryName)
      category.fields.add(field)

      if (!category.kinks.has(kinkName)) {
        category.kinks.set(kinkName, {
          name: kinkName,
          description,
          selections: {},
        })
      }

      const kink = category.kinks.get(kinkName)
      kink.selections[field] = {
        level,
        comment: comment || undefined,
      }
    })

    // Convert to ExportData format
    const categories = Array.from(categoriesMap.values()).map((cat) => ({
      name: cat.name as string,
      fields: Array.from(cat.fields) as string[],
      kinks: Array.from(
        cat.kinks.values()
      ) as ExportData['categories'][0]['kinks'],
    }))

    // Create basic levels structure
    const levels: {
      [key: string]: { name: string; color: string; class: string }
    } = {}
    const defaultColors = [
      '#ff0000',
      '#ff8800',
      '#ffff00',
      '#88ff00',
      '#00ff00',
    ]
    Array.from(levelsSet).forEach((level, index) => {
      levels[level] = {
        name: level,
        color: defaultColors[index % defaultColors.length] || '#888888',
        class: level.toLowerCase().replace(/\s+/g, '-'),
      }
    })

    const exportData: ExportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        totalCategories: categories.length,
        totalKinks: categories.reduce(
          (total, cat) => total + cat.kinks.length,
          0
        ),
        totalSelections: categories.reduce(
          (total, cat) =>
            total +
            cat.kinks.reduce(
              (kinkTotal: number, kink) =>
                kinkTotal + Object.keys(kink.selections).length,
              0
            ),
          0
        ),
      },
      levels,
      categories,
    }

    return {
      success: true,
      data: exportData,
    }
  } catch (error) {
    return {
      success: false,
      error: `CSV Import failed: ${error}`,
    }
  }
}

// Helper to get translated level names (copied from KinklistContext)
export const getInitialLevels = (i18n: any): LevelsData => ({
  [i18n.t('legend.notEntered')]: {
    name: i18n.t('legend.notEntered'),
    color: '#FFFFFF',
    class: 'notEntered',
  },
  [i18n.t('legend.favorite')]: {
    name: i18n.t('legend.favorite'),
    color: '#6DB5FE',
    class: 'favorite',
  },
  [i18n.t('legend.like')]: {
    name: i18n.t('legend.like'),
    color: '#23FD22',
    class: 'like',
  },
  [i18n.t('legend.okay')]: {
    name: i18n.t('legend.okay'),
    color: '#FDFD6B',
    class: 'okay',
  },
  [i18n.t('legend.maybe')]: {
    name: i18n.t('legend.maybe'),
    color: '#DB6C00',
    class: 'maybe',
  },
  [i18n.t('legend.no')]: {
    name: i18n.t('legend.no'),
    color: '#920000',
    class: 'no',
  },
})
