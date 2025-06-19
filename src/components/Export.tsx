import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'

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
        >
          📤 {t('export.export')}
        </button>

        <button
          className="import-action-button"
          onClick={handleOpenImportModal}
          aria-label={t('export.import')}
        >
          📥 {t('export.import')}
        </button>
      </div>

      <ExportModal open={exportModalOpen} onClose={handleCloseExportModal} />

      <ImportModal open={importModalOpen} onClose={handleCloseImportModal} />
    </>
  )
}

export default Export
