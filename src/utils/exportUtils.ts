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
 * Erstellt ein verbessertes professionelles PDF mit A4-Layout und erweitertem Design
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
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let currentY = margin

    // Professional Header with Background
    pdf.setFillColor(63, 81, 181) // Material Blue
    pdf.rect(0, 0, pageWidth, 35, 'F')

    // Title in white
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(28)
    pdf.setFont('helvetica', 'bold')
    const title = `Kinklist${data.metadata.username ? ` - ${data.metadata.username}` : ''}`
    const titleWidth = pdf.getTextWidth(title)
    const titleX = (pageWidth - titleWidth) / 2
    pdf.text(title, titleX, 25)

    // Reset colors and position
    pdf.setTextColor(0, 0, 0)
    currentY = 50

    // Document info section with subtle background
    pdf.setFillColor(248, 249, 250)
    pdf.rect(margin, currentY - 5, contentWidth, 25, 'F')

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100)
    const infoLines = [
      `Erstellt am: ${new Date(data.metadata.exportDate).toLocaleDateString('de-DE')}`,
      `Version: ${data.metadata.version}`,
      `Kategorien: ${data.metadata.totalCategories} | Kinks: ${data.metadata.totalKinks} | Bewertungen: ${data.metadata.totalSelections}`,
    ]

    infoLines.forEach((line, index) => {
      pdf.text(line, margin + 5, currentY + 5 + index * 5)
    })
    currentY += 35

    // Legend Section with enhanced design
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(63, 81, 181)
    pdf.text('Bewertungslegende', margin, currentY)
    currentY += 10

    // Legend grid with improved layout
    const legendColumns = 3
    const legendItemWidth = contentWidth / legendColumns
    let legendX = margin
    let legendRowCount = 0

    Object.entries(data.levels).forEach(([levelName, level]) => {
      if (levelName === 'Not Entered') return

      // Draw colored rectangle instead of circle for better visibility
      const hexColor = level.color
      const rgb = hexToRgb(hexColor)
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        pdf.rect(legendX, currentY - 3, 8, 4, 'F')
      }

      // Label with better spacing
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0)
      pdf.text(levelName, legendX + 12, currentY)

      legendX += legendItemWidth
      legendRowCount++

      if (legendRowCount >= legendColumns) {
        legendX = margin
        legendRowCount = 0
        currentY += 8
      }
    })

    if (legendRowCount > 0) {
      currentY += 8
    }
    currentY += 15

    // Categories with improved design
    data.categories.forEach((category, categoryIndex) => {
      // Check if we need a new page for category header
      if (currentY > pageHeight - 60) {
        pdf.addPage()
        currentY = margin
      }

      // Category header with background and border
      pdf.setFillColor(63, 81, 181, 0.1)
      pdf.rect(margin, currentY - 5, contentWidth, 15, 'F')

      pdf.setDrawColor(63, 81, 181)
      pdf.setLineWidth(0.5)
      pdf.rect(margin, currentY - 5, contentWidth, 15)

      // Category title
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(63, 81, 181)
      pdf.text(category.name, margin + 5, currentY + 3)
      currentY += 12

      // Fields subtitle with improved styling
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100)
      pdf.text(`Bereiche: ${category.fields.join(', ')}`, margin + 5, currentY)
      currentY += 12

      // Kinks in a more structured layout
      category.kinks.forEach((kink, kinkIndex) => {
        // Estimate height needed for this kink
        const baseHeight = 8
        const descriptionHeight =
          options.includeDescriptions && kink.description
            ? Math.ceil(
                pdf.getTextWidth(kink.description) / (contentWidth - 30)
              ) * 4
            : 0
        const commentsHeight = options.includeComments
          ? Object.values(kink.selections).filter((s) => s.comment).length * 4
          : 0
        const estimatedHeight =
          baseHeight + descriptionHeight + commentsHeight + 5

        // Check if we need a new page
        if (currentY + estimatedHeight > pageHeight - margin) {
          pdf.addPage()
          currentY = margin
        }

        // Alternating row backgrounds for better readability
        if (kinkIndex % 2 === 0) {
          pdf.setFillColor(250, 250, 250)
          pdf.rect(
            margin + 5,
            currentY - 2,
            contentWidth - 10,
            estimatedHeight,
            'F'
          )
        }

        // Kink name with enhanced typography
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(0)
        pdf.text(kink.name, margin + 10, currentY + 3)

        // Selection indicators with improved visual design
        let indicatorX = margin + 10 + pdf.getTextWidth(kink.name) + 15
        Object.entries(kink.selections).forEach(([field, selection]) => {
          if (selection.level !== 'Not Entered') {
            const level = data.levels[selection.level]
            if (level) {
              const rgb = hexToRgb(level.color)
              if (rgb) {
                pdf.setFillColor(rgb.r, rgb.g, rgb.b)
                pdf.rect(indicatorX, currentY - 1, 6, 4, 'F')

                // Add field initial as text overlay
                pdf.setFontSize(6)
                pdf.setTextColor(255)
                pdf.text(field[0].toUpperCase(), indicatorX + 1.5, currentY + 2)

                indicatorX += 10
              }
            }
          }
        })

        currentY += 8

        // Description with better formatting
        if (options.includeDescriptions && kink.description) {
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(100)
          const descLines = pdf.splitTextToSize(
            kink.description,
            contentWidth - 25
          )
          pdf.text(descLines, margin + 15, currentY)
          currentY += descLines.length * 4 + 2
        }

        // Comments with enhanced styling
        if (options.includeComments) {
          Object.entries(kink.selections).forEach(([field, selection]) => {
            if (selection.comment) {
              pdf.setFontSize(8)
              pdf.setFont('helvetica', 'normal')
              pdf.setTextColor(2, 119, 189)

              // Comment icon
              pdf.text('💬', margin + 15, currentY)

              const commentText = `${field}: ${selection.comment}`
              const commentLines = pdf.splitTextToSize(
                commentText,
                contentWidth - 30
              )
              pdf.text(commentLines, margin + 20, currentY)
              currentY += commentLines.length * 4 + 1
            }
          })
        }

        currentY += 3
      })

      // Add spacing between categories
      currentY += 8

      // Add subtle separator line between categories (except for last)
      if (categoryIndex < data.categories.length - 1) {
        pdf.setDrawColor(200)
        pdf.setLineWidth(0.3)
        pdf.line(margin, currentY, pageWidth - margin, currentY)
        currentY += 5
      }
    })

    // Professional footer on every page
    const pageCount = (pdf as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)

      // Footer background
      pdf.setFillColor(248, 249, 250)
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F')

      // Footer text
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(150)

      const footerText = 'Erstellt mit https://kink.hypnose-stammtisch.de'
      const footerWidth = pdf.getTextWidth(footerText)
      pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8)

      // Page number
      pdf.text(
        `Seite ${i} von ${pageCount}`,
        pageWidth - margin,
        pageHeight - 8
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
