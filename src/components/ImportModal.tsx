/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useRef, useState } from 'react'
import { useKinklist } from '../context/KinklistContext'
import {
  importFromCSV,
  importFromJSON,
  importFromXML,
} from '../utils/exportUtils'
import { convertFromExportData, validateExportData } from '../utils/importUtils'
import { kinksToText } from '../utils/index'
import ErrorModal from './ErrorModal'

interface ImportModalProps {
  open: boolean
  onClose: () => void
}

const ImportModal: React.FC<ImportModalProps> = ({ open, onClose }) => {
  const { setKinks, setLevels, setSelection, setOriginalKinksText } =
    useKinklist()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropzone, setShowDropzone] = useState(false)
  const [importText, setImportText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.json,.xml,.csv'
      fileInputRef.current.click()
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropzone(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowDropzone(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropzone(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    const allowedTypes = ['.json', '.xml', '.csv']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      setError(
        `Unsupported file type: ${fileExtension}. Allowed: ${allowedTypes.join(', ')}`
      )
      return
    }

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
          if (validateExportData(result.data)) {
            const {
              kinks: newKinks,
              levels: newLevels,
              selection: newSelection,
            } = convertFromExportData(result.data)

            // Setze alle Daten im Context
            setKinks(newKinks)
            setLevels(newLevels)
            setSelection(newSelection) // Aktualisiere auch den originalKinksText für den Editor
            const newKinksText = kinksToText(newKinks)
            setOriginalKinksText(newKinksText)

            setIsSuccess(true)
            setTimeout(() => setIsSuccess(false), 3000)
            // Schließe Modal nach erfolgreichem Import
            setTimeout(() => onClose(), 1000)
          } else {
            setError('Ungültiges Datenformat')
          }
        } else {
          setError(result.error || 'Import fehlgeschlagen')
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(`Import fehlgeschlagen: ${error.message}`)
        } else {
          setError(`Import fehlgeschlagen: ${JSON.stringify(error)}`)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [setKinks, setLevels, setSelection, setOriginalKinksText, onClose]
  )

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      await processImportText(text, file.name)

      event.target.value = ''
    },
    [processImportText]
  )

  const handleTextImport = useCallback(async () => {
    if (!importText.trim()) return
    await processImportText(importText, 'pasted-data.txt')
    setImportText('')
  }, [importText, processImportText])

  const handleCloseError = () => setError(null)

  if (!open) return null

  return (
    <>
      <div
        className="overlay visible"
        role="dialog"
        aria-modal="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="modal-content import-modal">
          <h2>📥 Kinklist importieren</h2>

          {/* Dropzone Overlay */}
          {showDropzone && (
            <div className="import-dropzone-overlay">
              <div className="import-dropzone-content">
                <h3>📁 Datei hier ablegen</h3>
                <p>Unterstützte Formate: JSON, XML, CSV</p>
              </div>
            </div>
          )}

          <p className="import-subtitle">
            Importiere zuvor exportierte Daten zurück in die Anwendung
          </p>

          <div className="import-methods">
            <div className="import-method">
              <h3>📁 Datei auswählen</h3>
              <p>Wähle eine JSON-, XML- oder CSV-Datei aus</p>
              <button
                className="btn btn-primary import-button"
                onClick={handleImport}
                disabled={isLoading}
              >
                Datei auswählen
              </button>
            </div>

            <div className="import-method">
              <h3>📋 Daten einfügen</h3>
              <p>Füge exportierte Daten direkt als Text ein</p>
              <textarea
                className="import-textarea"
                placeholder="Hier JSON-, XML- oder CSV-Daten einfügen..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                disabled={isLoading}
              />
              <button
                className="btn btn-primary import-button"
                onClick={handleTextImport}
                disabled={isLoading || !importText.trim()}
              >
                Daten importieren
              </button>
            </div>
          </div>

          <div className="import-info">
            <h3>ℹ️ Unterstützte Formate</h3>
            <ul>
              <li>
                <strong>JSON:</strong> Vollständiger Import aller Daten und
                Einstellungen
              </li>
              <li>
                <strong>XML:</strong> Strukturierter Import aller Daten
              </li>
              <li>
                <strong>CSV:</strong> Import von Kink-Auswahlen und Bewertungen
              </li>
            </ul>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Schließen
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.xml,.csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Datei für Import auswählen"
      />

      {error && <ErrorModal message={error} onClose={handleCloseError} />}

      {isSuccess && (
        <div className="overlay visible">
          <div className="modal-content success-modal">
            <h2>✅ Import erfolgreich!</h2>
            <p>Die Daten wurden erfolgreich importiert.</p>
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
            <h2>Import wird verarbeitet...</h2>
            <div className="loading-spinner"></div>
            <p>Bitte warten Sie, während Ihre Daten importiert werden.</p>
          </div>
        </div>
      )}
    </>
  )
}

export default ImportModal
