import React, { Suspense, lazy, useState } from 'react'
import { useTranslation } from 'react-i18next'

const ExportModal = lazy(() => import('./ExportModal'))
const ImportModal = lazy(() => import('./ImportModal'))

const Export: React.FC = () => {
  const { t } = useTranslation()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const handleOpenExportModal = () => {
    setExportModalOpen(true)
  }

  const handleCloseExportModal = () => {
    setExportModalOpen(false)
  }

  const handleOpenImportModal = () => {
    setImportModalOpen(true)
  }

  const handleCloseImportModal = () => {
    setImportModalOpen(false)
  }

  return (
    <>
      <div className="export-button-container">
        <button
          className="export-action-button"
          onClick={handleOpenExportModal}
          aria-label={t('export.export')}
          type="button"
        >
          📤 {t('export.export')}
        </button>

        <button
          className="import-action-button"
          onClick={handleOpenImportModal}
          aria-label={t('export.import')}
          type="button"
        >
          📥 {t('export.import')}
        </button>
      </div>

      {exportModalOpen && (
        <Suspense
          fallback={
            <div
              className="overlay visible lazy-overlay-fallback"
              role="status"
              aria-live="polite"
              aria-label={t('common.loading')}
            >
              <div className="loading-spinner">
                <div className="spinner-circle"></div>
                <p>{t('common.loading')}</p>
              </div>
            </div>
          }
        >
          <ExportModal
            open={exportModalOpen}
            onClose={handleCloseExportModal}
          />
        </Suspense>
      )}

      {importModalOpen && (
        <Suspense
          fallback={
            <div
              className="overlay visible lazy-overlay-fallback"
              role="status"
              aria-live="polite"
              aria-label={t('common.loading')}
            >
              <div className="loading-spinner">
                <div className="spinner-circle"></div>
                <p>{t('common.loading')}</p>
              </div>
            </div>
          }
        >
          <ImportModal
            open={importModalOpen}
            onClose={handleCloseImportModal}
          />
        </Suspense>
      )}
    </>
  )
}

export default Export
