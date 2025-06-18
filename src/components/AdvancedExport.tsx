import React, { useCallback, useRef, useState } from 'react'
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
  importFromCSV,
  importFromJSON,
  importFromXML,
} from '../utils/exportUtils'
import { convertFromExportData, validateExportData } from '../utils/importUtils'
import { getAppVersion } from '../utils/version'
import ErrorModal from './ErrorModal'
import NameModal from './NameModal'

interface AdvancedExportProps {}

const AdvancedExport: React.FC<AdvancedExportProps> = () => {
  const { kinks, levels, selection, setKinks, setLevels, setSelection } =
    useKinklist()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PNG')
  const [selectedMode, setSelectedMode] = useState<ExportMode>('quick')
  const [showImportDropzone, setShowImportDropzone] = useState(false)
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export-Modi definieren
  const exportModes: ExportModeOption[] = [
    {
      mode: 'quick',
      title: 'Schnellexport',
      description: 'Direkte Exports mit Standardeinstellungen',
      formats: ['PNG', 'JSON', 'PDF'],
      defaultOptions: {
        includeComments: true,
        includeDescriptions: false,
        includeMetadata: true,
      },
    },
    {
      mode: 'advanced',
      title: 'Erweiterte Optionen',
      description: 'Alle Formate mit detaillierten Einstellungen',
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
    PNG: 'Hochqualitatives Rasterbild, ideal für Screenshots',
    JPEG: 'Komprimiertes Bild, kleinere Dateigröße',
    WebP: 'Modernes Bildformat mit optimaler Kompression',
    SVG: 'Vektorgrafik, skalierbar und editierbar',
    PDF: 'Professionelles A4-Layout zum Drucken',
    JSON: 'Strukturierte Daten, vollständig importierbar',
    XML: 'Standardisiertes Datenformat, vollständig importierbar',
    CSV: 'Tabellendaten für Excel/Google Sheets',
    SSV: 'Space-separated values für spezielle Anwendungen',
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

  // Canvas-Erstellung für Bildexporte mit vollständiger Logik
  const createExportCanvas = useCallback(
    async (username: string): Promise<HTMLCanvasElement> => {
      // Implementiere die vollständige Canvas-Logik basierend auf der ursprünglichen Export-Komponente
      const numCols = 4 // Optimale Spaltenanzahl
      const simpleTitleHeight = 45
      const rowHeight = 32
      const columnWidth = 200
      const offsets = { left: 20, right: 20, top: 80, bottom: 40 }

      // Erstelle Spalten-Layout
      const columns: any[] = []
      for (let i = 0; i < numCols; i++) {
        columns.push({ drawStack: [], height: 0 })
      }

      let currentColumn = 0
      Object.keys(kinks).forEach((category) => {
        const categoryData = kinks[category]

        // Füge Kategorie-Header hinzu
        columns[currentColumn].drawStack.push({
          type: 'simpleTitle',
          data: category,
          y: columns[currentColumn].height,
        })
        columns[currentColumn].height += simpleTitleHeight

        // Füge Kinks hinzu
        categoryData.kinks.forEach((kinkName: string) => {
          const kinkSelections = selection.filter(
            (sel) => sel.category === category && sel.kink === kinkName
          )

          const choices: string[] = []
          const colors: { [key: string]: string } = {}

          categoryData.fields.forEach((field: string) => {
            const sel = kinkSelections.find((s) => s.field === field)
            if (sel && sel.value !== 'Not Entered') {
              choices.push(sel.value)
              colors[sel.value] = levels[sel.value]?.color || '#cccccc'
            }
          })

          if (choices.length > 0) {
            columns[currentColumn].drawStack.push({
              type: 'kinkRow',
              data: {
                text: kinkName,
                choices,
                colors,
                description: '', // Könnte erweitert werden
                hasComment: false, // Könnte erweitert werden
                comments: [],
              },
              y: columns[currentColumn].height,
            })
            columns[currentColumn].height += rowHeight
          }
        })

        // Wechsle zur nächsten Spalte für bessere Verteilung
        currentColumn = (currentColumn + 1) % numCols
      })

      // Finde höchste Spalte
      let tallestColumnHeight = 0
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].height > tallestColumnHeight) {
          tallestColumnHeight = columns[i].height
        }
      }

      const canvasWidth = offsets.left + offsets.right + columnWidth * numCols
      const canvasHeight = offsets.top + offsets.bottom + tallestColumnHeight

      // Erstelle Canvas
      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const context = canvas.getContext('2d')!
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Header
      context.font = 'bold 16px Arial, sans-serif'
      context.fillStyle = '#333333'
      const headerText = `Kinklist ${username || ''}`
      context.fillText(headerText, 12, 28)

      // Legende
      const legendY = 50
      const levelNames = Object.keys(levels).filter(
        (name) => name !== 'Not Entered'
      )

      context.font = 'bold 12px Arial'
      context.fillStyle = '#3f51b5'
      context.fillText('Legende:', 12, legendY)

      levelNames.forEach((levelName, index) => {
        const x = 80 + index * 120
        const level = levels[levelName]

        if (level) {
          // Kreis
          context.beginPath()
          context.arc(x, legendY - 5, 8, 0, 2 * Math.PI)
          context.fillStyle = level.color
          context.fill()
          context.strokeStyle = 'rgba(0, 0, 0, 0.5)'
          context.lineWidth = 1
          context.stroke()

          // Text
          context.fillStyle = '#333333'
          context.font = '11px Arial'
          context.fillText(levelName, x + 15, legendY - 1)
        }
      })

      // Zeichne Spalten-Inhalte
      const drawCallHandlers = {
        simpleTitle: (
          context: CanvasRenderingContext2D,
          drawCall: any
        ): void => {
          context.save()
          context.fillStyle = 'rgba(245, 245, 250, 0.7)'
          context.fillRect(
            drawCall.x,
            drawCall.y,
            columnWidth - 12,
            simpleTitleHeight - 10
          )

          context.font = 'bold 13px Arial, sans-serif'
          context.fillStyle = '#3f51b5'
          context.fillText(drawCall.data, drawCall.x + 6, drawCall.y + 18)
          context.restore()
        },

        kinkRow: (context: CanvasRenderingContext2D, drawCall: any): void => {
          context.save()

          // Hintergrund
          context.fillStyle = 'rgba(248, 248, 255, 0.3)'
          context.fillRect(
            drawCall.x,
            drawCall.y - 5,
            columnWidth - 8,
            rowHeight
          )

          // Kreise für Auswahlen
          const circleSize = 5
          const circleSpacing = 12
          drawCall.data.choices.forEach((choice: string, index: number) => {
            const cx = drawCall.x + 10 + index * circleSpacing
            const cy = drawCall.y + 5
            const color = drawCall.data.colors[choice]

            context.beginPath()
            context.arc(cx, cy, circleSize, 0, 2 * Math.PI)
            context.fillStyle = color
            context.fill()
            context.strokeStyle = 'rgba(0, 0, 0, 0.7)'
            context.lineWidth = 0.5
            context.stroke()
          })

          // Text
          const textX =
            drawCall.x + 10 + drawCall.data.choices.length * circleSpacing + 10
          context.font = '11px Arial, sans-serif'
          context.fillStyle = '#333333'
          context.fillText(drawCall.data.text, textX, drawCall.y + 8)

          context.restore()
        },
      }

      // Zeichne alle Elemente
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i]
        const drawX = offsets.left + columnWidth * i

        column.drawStack.forEach((drawCall: any) => {
          drawCall.x = drawX
          drawCall.y += offsets.top

          const handler =
            drawCallHandlers[drawCall.type as keyof typeof drawCallHandlers]
          if (handler) {
            handler(context, drawCall)
          }
        })
      }

      // Footer
      const footerText = `Created with https://kink.hypnose-stammtisch.de | v${getAppVersion()}`
      context.save()
      context.font = 'italic 10px Arial'
      context.fillStyle = '#888888'
      const textMetrics = context.measureText(footerText)
      const x = canvasWidth - textMetrics.width - 8
      const y = canvasHeight - 8
      context.fillText(footerText, x, y)
      context.restore()

      return canvas
    },
    [kinks, levels, selection]
  )

  const performExport = useCallback(async () => {
    if (!pendingExport) return

    setIsLoading(true)
    setIsSuccess(false)
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
          // Erstelle Canvas für Bildexporte
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
          throw new Error(`Unbekanntes Format: ${format}`)
      }

      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => setIsSuccess(false), 3000)
      } else {
        setError(result.error || 'Export fehlgeschlagen')
      }
    } catch (error) {
      setError(`Export fehlgeschlagen: ${error}`)
      console.error('Export error:', error)
    } finally {
      setIsLoading(false)
      setPendingExport(null)
    }
  }, [
    pendingExport,
    kinks,
    levels,
    selection,
    exportOptions,
    createExportCanvas,
  ])

  // Import-Funktionalität
  const handleImport = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.json,.xml,.csv,.ssv'
      fileInputRef.current.click()
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowImportDropzone(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Nur verstecken wenn wir wirklich den Container verlassen
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowImportDropzone(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowImportDropzone(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    const allowedTypes = ['.json', '.xml', '.csv', '.ssv']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      setError(
        `Unsupported file type: ${fileExtension}. Allowed: ${allowedTypes.join(', ')}`
      )
      return
    }

    // Lese Dateiinhalt
    const text = await file.text()
    await processImportText(text, file.name)
  }, [])

  const processImportText = useCallback(
    async (text: string, filename: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const extension = filename.split('.').pop()?.toLowerCase() || ''
        let result

        switch (extension) {
          case 'json':
            result = importFromJSON(text)
            break
          case 'xml':
            result = importFromXML(text)
            break
          case 'csv':
            result = importFromCSV(text)
            break
          default:
            // Fallback: try to detect format by content
            if (text.trim().startsWith('{')) {
              result = importFromJSON(text)
            } else if (text.trim().startsWith('<?xml')) {
              result = importFromXML(text)
            } else {
              result = importFromCSV(text)
            }
        }

        if (result.success && result.data) {
          // Validiere importierte Daten
          if (validateExportData(result.data)) {
            // Konvertiere zurück in Anwendungsformat
            const {
              kinks: newKinks,
              levels: newLevels,
              selection: newSelection,
            } = convertFromExportData(result.data)

            // Aktualisiere den Anwendungsstatus
            setKinks(newKinks)
            setLevels(newLevels)
            setSelection(newSelection)

            setIsSuccess(true)
            setTimeout(() => setIsSuccess(false), 3000)
          } else {
            setError('Ungültiges Datenformat')
          }
        } else {
          setError(result.error || 'Import fehlgeschlagen')
        }
      } catch (error) {
        setError(`Import fehlgeschlagen: ${error}`)
      } finally {
        setIsLoading(false)
      }
    },
    [setKinks, setLevels, setSelection]
  )

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      await processImportText(text, file.name)

      // Reset file input
      event.target.value = ''
    },
    [processImportText]
  )

  // Effect für automatischen Export
  React.useEffect(() => {
    if (pendingExport) {
      performExport()
    }
  }, [pendingExport, performExport])

  const handleCloseError = () => setError(null)

  return (
    <div
      className="advanced-export-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <NameModal
        open={isNameModalOpen}
        onSubmit={handleNameSubmit}
        onClose={() => setIsNameModalOpen(false)}
      />

      {error && <ErrorModal message={error} onClose={handleCloseError} />}

      <div
        className={`export-success-message ${isSuccess ? 'visible' : ''}`}
        aria-live="polite"
      >
        Export erfolgreich abgeschlossen!
      </div>

      {/* Import Dropzone Overlay */}
      {showImportDropzone && (
        <div className="import-dropzone-overlay">
          <div className="import-dropzone-content">
            <h3>📁 Datei hier ablegen</h3>
            <p>Unterstützte Formate: JSON, XML, CSV, SSV</p>
          </div>
        </div>
      )}

      {/* Export Mode Selection */}
      <div className="export-mode-selection">
        <h3>Export-Modus</h3>
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
                <h4>{mode.title}</h4>
                <span className="mode-format-count">
                  {mode.formats.length} Formate
                </span>
              </div>
              <p className="mode-description">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Export Options - only show in advanced mode */}
      {selectedMode === 'advanced' && (
        <div className="export-options">
          <h3>Export-Optionen</h3>

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
              Kommentare einschließen
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
              Beschreibungen einschließen
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
              Metadaten einschließen
            </label>
          </div>
        </div>
      )}

      <div className="export-formats">
        <h3>{selectedMode === 'quick' ? 'Schnellexport' : 'Export-Formate'}</h3>

        <div className="format-grid">
          {exportModes
            .find((mode) => mode.mode === selectedMode)
            ?.formats.map((format) => (
              <div key={format} className="format-card">
                <div className="format-header">
                  <h4>{format}</h4>
                  <span className="format-type">
                    {['PNG', 'JPEG', 'WebP', 'SVG'].includes(format)
                      ? 'Bild'
                      : ['JSON', 'XML', 'CSV', 'SSV'].includes(format)
                        ? 'Daten'
                        : 'Dokument'}
                  </span>
                </div>
                <p className="format-description">
                  {formatDescriptions[format]}
                </p>
                <button
                  className={`export-button ${format.toLowerCase()}`}
                  onClick={() => handleExport(format as ExportFormat)}
                  disabled={isLoading}
                >
                  Als {format} exportieren
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Enhanced Import Section */}
      <div className="import-section">
        <div className="import-header">
          <h3>💾 Daten importieren</h3>
          <span className="import-subtitle">
            Importiere zuvor exportierte Daten zurück in die Anwendung
          </span>
        </div>

        <div className="import-methods">
          <div className="import-method">
            <h4>📁 Datei auswählen</h4>
            <p>Wähle eine JSON-, XML-, CSV- oder SSV-Datei aus</p>
            <button
              className="import-button file-select"
              onClick={handleImport}
            >
              <span className="icon">📂</span>
              Datei auswählen
            </button>
          </div>

          <div className="import-divider">
            <span>oder</span>
          </div>

          <div className="import-method">
            <h4>🎯 Drag & Drop</h4>
            <p>Ziehe eine Datei einfach auf diesen Bereich</p>
            <div className="dropzone-hint">
              <span className="icon">⬆️</span>
              Ziehe Dateien hierher
            </div>
          </div>
        </div>

        <div className="supported-formats">
          <h5>Unterstützte Formate:</h5>
          <div className="format-tags">
            <span className="format-tag json">JSON</span>
            <span className="format-tag xml">XML</span>
            <span className="format-tag csv">CSV</span>
            <span className="format-tag ssv">SSV</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.xml,.csv,.ssv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          aria-label="Datei zum Import auswählen"
        />
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>
            {selectedFormat ? 'Export wird vorbereitet...' : 'Import läuft...'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AdvancedExport
