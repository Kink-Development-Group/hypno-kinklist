import React, { useCallback, useState } from 'react'
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
  exportAsSSV,
  exportAsSVG,
  exportAsXML,
  exportCanvasAsImage,
} from '../utils/exportUtils'
import ErrorModal from './ErrorModal'
import NameModal from './NameModal'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose }) => {
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
      formats: [
        'PNG',
        'JPEG',
        'WebP',
        'SVG',
        'PDF',
        'JSON',
        'XML',
        'CSV',
        'SSV',
      ],
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

  // Canvas-Erstellung für Bildexporte (vereinfacht für Modal)
  const createExportCanvas = useCallback(
    async (username: string): Promise<HTMLCanvasElement> => {
      // Vereinfachte Canvas-Erstellung für Modal
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')!

      // Einfacher Platzhalter - hier würde die echte Canvas-Logik stehen
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000000'
      ctx.font = '20px Arial'
      ctx.fillText(`Export für ${username}`, 50, 50)

      return canvas
    },
    []
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
        case 'SSV':
          result = await exportAsSSV(exportData, options)
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
        setError(result.error || 'Export fehlgeschlagen')
      }
    } catch (error) {
      setError(`Export fehlgeschlagen: ${error}`)
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
          <h2>📤 Kinklist exportieren</h2>

          {/* Export-Modi-Auswahl */}
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
                    <strong>{mode.title}</strong>
                    <span className="mode-format-count">
                      {mode.formats.length} Formate
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
              <h3>Export-Einstellungen</h3>
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

          {/* Format-Auswahl */}
          <div className="export-formats">
            <h3>
              {selectedMode === 'quick' ? 'Schnellexport' : 'Export-Formate'}
            </h3>
            <div className="format-grid">
              {exportModes
                .find((mode) => mode.mode === selectedMode)
                ?.formats.map((format) => (
                  <div key={format} className="format-card">
                    <div className="format-header">
                      <strong>{format}</strong>
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
                      className="btn btn-primary export-format-btn"
                      onClick={() => handleExport(format as ExportFormat)}
                      disabled={isLoading}
                    >
                      Als {format} exportieren
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Schließen
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
            <h2>✅ Export erfolgreich!</h2>
            <p>Der Export wurde erfolgreich abgeschlossen.</p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => setIsSuccess(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="overlay visible">
          <div className="modal-content loading-modal">
            <h2>Export wird vorbereitet...</h2>
            <div className="loading-spinner"></div>
            <p>Bitte warten Sie, während Ihr Export erstellt wird.</p>
          </div>
        </div>
      )}
    </>
  )
}

export default ExportModal
