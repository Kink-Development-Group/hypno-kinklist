import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import { KinksData, LevelsData, Selection } from '../types'
import {
  ExportData,
  ExportOptions,
  ExportResult,
  ImportResult,
} from '../types/export'
import { getAppVersion } from './version'

/**
 * Konvertiert Kinklist-Daten in ein standardisiertes Export-Format
 */
export const convertToExportData = (
  kinks: KinksData,
  levels: LevelsData,
  selection: Selection[],
  username?: string
): ExportData => {
  const categories = Object.keys(kinks).map((categoryName) => {
    const category = kinks[categoryName]
    const categoryKinks = category.kinks.map((kinkName, index) => {
      const kinkSelections: {
        [field: string]: { level: string; comment?: string }
      } = {}

      category.fields.forEach((field) => {
        const selectionItem = selection.find(
          (item) =>
            item.category === categoryName &&
            item.kink === kinkName &&
            item.field === field
        )

        kinkSelections[field] = {
          level: selectionItem?.value || 'Not Entered',
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
      totalCategories: Object.keys(kinks).length,
      totalKinks: Object.values(kinks).reduce(
        (sum, cat) => sum + cat.kinks.length,
        0
      ),
      totalSelections: selection.filter((s) => s.value !== 'Not Entered')
        .length,
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
      error: `JSON Export failed: ${error}`,
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
      error: `XML Export failed: ${error}`,
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
      'Category',
      'Kink',
      'Field',
      'Level',
      ...(options.includeComments ? ['Comment'] : []),
      ...(options.includeDescriptions ? ['Description'] : []),
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
      error: `CSV Export failed: ${error}`,
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
      ? `${data.metadata.username}'s Kink List`
      : 'Kink List'
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
    const statsText = `${data.metadata.totalSelections}/${data.metadata.totalKinks} ausgefüllt`
    const statsWidth = pdf.getTextWidth(statsText)
    pdf.text(statsText, pageWidth - margin - statsWidth, currentY)

    currentY += 15

    // Moderne Legende (ohne Emojis)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(44, 62, 80)
    pdf.text('Bewertungslegende', margin, currentY)
    currentY += 8

    // Legende in kompakter Form (ähnlich Canvas-Grid)
    const legendColumns = 4
    const legendItemWidth = contentWidth / legendColumns
    let legendX = margin
    let legendRowCount = 0

    Object.entries(data.levels).forEach(([levelName, level]) => {
      if (levelName === 'Not Entered') return

      // Moderner Farbkreis (wie im Canvas-Export)
      const hexColor = level.color
      const rgb = hexToRgb(hexColor)
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.3)
        pdf.circle(legendX + 3, currentY - 1, 2, 'FD') // Gefüllter Kreis mit Rahmen
      }

      // Kompakte Label-Darstellung
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(33, 37, 41) // #212529
      const truncatedName =
        levelName.length > 12 ? levelName.substring(0, 12) + '...' : levelName
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
      pdf.text(`[${category.name}]`, margin + 3, currentY + 4)
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
          if (selection && selection.level !== 'Not Entered') {
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
            // Leerer Kreis für "Not Entered"
            pdf.setDrawColor(222, 226, 230) // #dee2e6
            pdf.setLineWidth(0.3)
            pdf.circle(choiceX + 2, currentY + 2, 1.5, 'D')
          }

          // Kommentar-Indikator (ohne Emoji)
          if (selection?.comment) {
            pdf.setFontSize(6)
            pdf.setTextColor(255, 193, 7) // #ffc107
            pdf.text('C', choiceX + 4, currentY + 3) // 'C' für Comment
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
      error: `PDF Export failed: ${error}`,
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
      error: `Image Export failed: ${error}`,
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
      error: `SVG Export failed: ${error}`,
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
      throw new Error('Invalid data format')
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: `Import failed: ${error}`,
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
      error: `XML Export failed: ${error}`,
    }
  }
}

/**
 * Exportiert als SSV (Space-Separated Values) für einfache Datenanalyse
 */
export const exportAsSSV = async (
  data: ExportData,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const filename = options.filename || `kinklist_${Date.now()}.ssv`

    const ssvData: string[][] = []

    // Header
    const headers = [
      'Category',
      'Kink',
      'Field',
      'Level',
      ...(options.includeComments ? ['Comment'] : []),
      ...(options.includeDescriptions ? ['Description'] : []),
    ]
    ssvData.push(headers)

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
          ssvData.push(row)
        })
      })
    })

    // Convert to SSV format (space-separated, quoted if contains spaces)
    const ssvContent = ssvData
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell)
            // Quote if contains spaces, quotes, or special characters
            if (
              str.includes(' ') ||
              str.includes('"') ||
              str.includes('\n') ||
              str.includes('\t')
            ) {
              return '"' + str.replace(/"/g, '""') + '"'
            }
            return str
          })
          .join(' ')
      )
      .join('\n')

    const blob = new Blob([ssvContent], { type: 'text/plain;charset=utf-8;' })
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
      error: `SSV Export failed: ${error}`,
    }
  }
}

/**
 * Importiert XML-Daten zurück in die Anwendung
 */
export const importFromXML = (xmlString: string): ImportResult => {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      throw new Error('Invalid XML format')
    }

    const root = xmlDoc.querySelector('kinklist')
    if (!root) {
      throw new Error('Invalid kinklist XML structure')
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
      levels[key] = {
        name: levelNode.querySelector('name')?.textContent || '',
        color: levelNode.querySelector('color')?.textContent || '#000000',
        class: levelNode.querySelector('class')?.textContent || '',
      }
    })

    // Parse categories
    const categories: ExportData['categories'] = []
    root.querySelectorAll('categories > category').forEach((categoryNode) => {
      const category = {
        name: categoryNode.querySelector('name')?.textContent || '',
        fields: Array.from(categoryNode.querySelectorAll('fields > field')).map(
          (fieldNode) => fieldNode.textContent || ''
        ),
        kinks: [] as ExportData['categories'][0]['kinks'],
      }

      categoryNode.querySelectorAll('kinks > kink').forEach((kinkNode) => {
        const kink = {
          name: kinkNode.querySelector('name')?.textContent || '',
          description:
            kinkNode.querySelector('description')?.textContent || undefined,
          selections: {} as {
            [field: string]: { level: string; comment?: string }
          },
        }

        kinkNode
          .querySelectorAll('selections > selection')
          .forEach((selectionNode) => {
            const field = selectionNode.getAttribute('field') || ''
            kink.selections[field] = {
              level:
                selectionNode.querySelector('level')?.textContent ||
                'Not Entered',
              comment:
                selectionNode.querySelector('comment')?.textContent ||
                undefined,
            }
          })

        category.kinks.push(kink)
      })

      categories.push(category)
    })

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
    return {
      success: false,
      error: `XML Import failed: ${error}`,
    }
  }
}

/**
 * Importiert SSV-Daten zurück in die Anwendung
 */
export const importFromSSV = (ssvString: string): ImportResult => {
  try {
    const lines = ssvString.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('Invalid SSV format: insufficient data')
    }

    // Parse header
    const header = parseSSVLine(lines[0])
    const expectedColumns = ['Category', 'Kink', 'Field', 'Level']

    if (!expectedColumns.every((col) => header.includes(col))) {
      throw new Error('Invalid SSV format: missing required columns')
    }

    const categoryIndex = header.indexOf('Category')
    const kinkIndex = header.indexOf('Kink')
    const fieldIndex = header.indexOf('Field')
    const levelIndex = header.indexOf('Level')
    const commentIndex = header.indexOf('Comment')
    const descriptionIndex = header.indexOf('Description')

    // Parse data
    const categoriesMap = new Map<string, any>()
    const levelsSet = new Set<string>()

    for (let i = 1; i < lines.length; i++) {
      const row = parseSSVLine(lines[i])
      if (row.length < expectedColumns.length) continue

      const categoryName = row[categoryIndex]
      const kinkName = row[kinkIndex]
      const field = row[fieldIndex]
      const level = row[levelIndex]
      const comment = commentIndex >= 0 ? row[commentIndex] : undefined
      const description =
        descriptionIndex >= 0 ? row[descriptionIndex] : undefined

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
    }

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

    const data: ExportData = {
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
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: `SSV Import failed: ${error}`,
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

/**
 * Hilfsfunktion zum Parsen von SSV-Zeilen
 */
const parseSSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ' ' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
      i++
      // Skip additional spaces
      while (i < line.length && line[i] === ' ') {
        i++
      }
    } else {
      current += char
      i++
    }
  }

  if (current || result.length > 0) {
    result.push(current)
  }

  return result
}
