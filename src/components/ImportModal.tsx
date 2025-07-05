/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const {
    setKinks,
    setLevels,
    setSelection,
    setOriginalKinksText,
    resetImportState,
  } = useKinklist()
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
        `${t('import.errors.unsupportedFileType', { extension: fileExtension, allowed: allowedTypes.join(', ') })}`
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
        console.log('Starting import process for:', filename)
        console.log('Text length:', text.length)
        console.log('First 100 chars:', text.substring(0, 100))

        const extension = filename.split('.').pop()?.toLowerCase() || ''
        let result

        // Verbesserte Format-Erkennung
        const trimmedText = text.trim()

        switch (extension) {
          case 'json':
            console.log('Importing as JSON')
            result = importFromJSON(text)
            break
          case 'xml':
            console.log('Importing as XML')
            result = importFromXML(text)
            break
          case 'csv':
            console.log('Importing as CSV')
            // Verbesserte CSV-Validierung
            if (!trimmedText || trimmedText.length < 10) {
              throw new Error('CSV-Datei ist leer oder zu kurz')
            }
            result = importFromCSV(text)
            break
          default:
            // Fallback: try to detect format by content
            console.log('Auto-detecting format')
            if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
              console.log('Detected JSON format')
              result = importFromJSON(text)
            } else if (
              trimmedText.startsWith('<?xml') ||
              trimmedText.includes('<kinklist')
            ) {
              console.log('Detected XML format')
              result = importFromXML(text)
            } else {
              console.log('Detected CSV format')
              if (!trimmedText || trimmedText.length < 10) {
                throw new Error('CSV-Datei ist leer oder zu kurz')
              }
              result = importFromCSV(text)
            }
        }

        console.log('Import result:', result)

        if (!result) {
          throw new Error('Import-Funktion gab kein Ergebnis zurück')
        }

        if (result.success && result.data) {
          console.log('Validating export data...')
          if (validateExportData(result.data)) {
            console.log('Export data is valid, converting...')
            const {
              kinks: newKinks,
              levels: newLevels,
              selection: newSelection,
            } = convertFromExportData(result.data)

            console.log('Converted data:', {
              kinks: Object.keys(newKinks).length + ' categories',
              levels: Object.keys(newLevels).length + ' levels',
              selection: newSelection.length + ' selections',
            })

            // Validiere konvertierte Daten
            if (Object.keys(newKinks).length === 0) {
              throw new Error(
                'Keine Kategorien in den importierten Daten gefunden'
              )
            }
            if (Object.keys(newLevels).length === 0) {
              throw new Error('Keine Level in den importierten Daten gefunden')
            }

            // Verwende React's unstable_batchedUpdates für atomare State-Updates
            // Dies verhindert Race Conditions und stellt sicher, dass alle Updates zusammen verarbeitet werden
            try {
              console.log('Starting atomic state update...')

              // Reset import tracking state vor dem Update
              resetImportState()

              // Verwende React's Batching für atomare Updates
              const { unstable_batchedUpdates } = await import('react-dom')

              unstable_batchedUpdates(() => {
                // Setze alle States in einem Batch
                setLevels(newLevels)
                setKinks(newKinks)
                setSelection(newSelection)
                const newKinksText = kinksToText(newKinks)
                setOriginalKinksText(newKinksText)
              })

              // Warte kurz, damit React die Updates verarbeiten kann
              await new Promise((resolve) => setTimeout(resolve, 100))

              console.log('All states updated successfully in batched update')

              setIsSuccess(true)
              setTimeout(() => setIsSuccess(false), 3000)
              // Schließe Modal nach erfolgreichem Import
              setTimeout(() => onClose(), 1000)
            } catch (stateUpdateError) {
              console.error('Error during state updates:', stateUpdateError)

              // Versuche einzelne State-Updates als Fallback
              console.log('Falling back to individual state updates...')
              try {
                setLevels(newLevels)
                await new Promise((resolve) => setTimeout(resolve, 50))

                setKinks(newKinks)
                await new Promise((resolve) => setTimeout(resolve, 50))

                setSelection(newSelection)
                await new Promise((resolve) => setTimeout(resolve, 50))

                const newKinksText = kinksToText(newKinks)
                setOriginalKinksText(newKinksText)

                console.log('Fallback state updates completed successfully')
              } catch (fallbackError) {
                console.error(
                  'Fallback state updates also failed:',
                  fallbackError
                )
                setError(
                  t('import.errors.failedWithMessage', {
                    message: 'Fehler beim Aktualisieren der Anwendungsdaten',
                  })
                )
                return
              }
            }
          } else {
            console.error('Export data validation failed')
            setError(t('import.errors.invalidFormat'))
          }
        } else {
          console.error('Import failed:', result.error)
          setError(result.error || t('import.errors.importFailed'))
        }
      } catch (error) {
        console.error('Import process error:', error)
        if (error instanceof Error) {
          setError(
            t('import.errors.failedWithMessage', { message: error.message })
          )
        } else {
          setError(
            t('import.errors.failedWithMessage', {
              message: JSON.stringify(error),
            })
          )
        }
      } finally {
        setIsLoading(false)
      }
    },
    [setKinks, setLevels, setSelection, setOriginalKinksText, onClose, t]
  )

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      await processImportText(text, file.name)

      event.target.value = ''
    },
    [processImportText, t]
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
          {' '}
          <h2>{t('import.heading')}</h2>
          {/* Dropzone Overlay */}
          {showDropzone && (
            <div className="import-dropzone-overlay">
              <div className="import-dropzone-content">
                <h3>{t('import.dragActive')}</h3>
                <p>{t('import.supportedFormats')}</p>
              </div>
            </div>
          )}
          <p className="import-subtitle">{t('import.subtitle')}</p>{' '}
          <div className="import-methods">
            <div className="import-method">
              <h3>{t('import.methods.file.title')}</h3>
              <p>{t('import.methods.file.description')}</p>
              <button
                className="btn btn-primary import-button"
                onClick={handleImport}
                disabled={isLoading}
              >
                {t('import.methods.file.button')}
              </button>
            </div>

            <div className="import-method">
              <h3>{t('import.methods.text.title')}</h3>
              <p>{t('import.methods.text.description')}</p>
              <textarea
                className="import-textarea"
                placeholder={t('import.methods.text.placeholder')}
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
                {t('import.methods.text.button')}
              </button>
            </div>
          </div>{' '}
          <div className="import-info">
            <h3>{t('import.supportedFormats')}</h3>
            <ul>
              <li>
                <strong>{t('import.formats.json.title')}</strong>{' '}
                {t('import.formats.json.description')}
              </li>
              <li>
                <strong>{t('import.formats.xml.title')}</strong>{' '}
                {t('import.formats.xml.description')}
              </li>
              <li>
                <strong>{t('import.formats.csv.title')}</strong>{' '}
                {t('import.formats.csv.description')}
              </li>
            </ul>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              {t('buttons.close')}
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
        aria-label={t('import.accessibility.selectFile')}
      />
      {error && <ErrorModal message={error} onClose={handleCloseError} />}{' '}
      {isSuccess && (
        <div className="overlay visible">
          <div className="modal-content success-modal">
            <h2>✅ {t('import.importSuccessful')}</h2>
            <p>{t('import.dataImported')}</p>
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
      )}{' '}
      {isLoading && (
        <div className="overlay visible">
          <div className="modal-content loading-modal">
            <h2>{t('import.processing')}</h2>
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
            </div>
            <p>{t('import.pleaseWait')}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default ImportModal
