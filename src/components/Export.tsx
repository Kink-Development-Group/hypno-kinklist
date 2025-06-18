import React, { useState } from 'react'
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'

const Export: React.FC = () => {
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
          aria-label="Kinklist exportieren"
        >
          📤 Exportieren
        </button>

        <button
          className="import-action-button"
          onClick={handleOpenImportModal}
          aria-label="Kinklist importieren"
        >
          📥 Importieren
        </button>
      </div>

      <ExportModal open={exportModalOpen} onClose={handleCloseExportModal} />

      <ImportModal open={importModalOpen} onClose={handleCloseImportModal} />
    </>
  )
}

export default Export
