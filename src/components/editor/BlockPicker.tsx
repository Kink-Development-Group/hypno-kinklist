import React, { useState, useEffect } from 'react'
import {
  getPasteableBlocks,
  PasteableBlock,
  getBlocksByCategory,
  searchBlocks,
} from './EditorUtils'

interface BlockPickerProps {
  onSelectBlock: (block: PasteableBlock) => void
  position?: 'bottom' | 'right'
  showSearch?: boolean
  className?: string
}

const BlockPicker: React.FC<BlockPickerProps> = ({
  onSelectBlock,
  position = 'bottom',
  showSearch = true,
  className = '',
}) => {
  const [blocks, setBlocks] = useState<PasteableBlock[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<PasteableBlock[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)

  // Laden aller Blöcke beim Start
  useEffect(() => {
    const allBlocks = getPasteableBlocks()
    setBlocks(allBlocks)
    setFilteredBlocks(allBlocks)
  }, [])

  // Filtern nach Kategorie und Suchbegriff
  useEffect(() => {
    let result = blocks

    // Nach Kategorie filtern
    if (selectedCategory !== 'Alle') {
      result = getBlocksByCategory(selectedCategory)
    }

    // Nach Suchbegriff filtern
    if (searchQuery) {
      result = searchBlocks(searchQuery).filter(
        (block) =>
          selectedCategory === 'Alle' || block.category === selectedCategory
      )
    }

    setFilteredBlocks(result)
  }, [selectedCategory, searchQuery, blocks])

  // Eindeutige Kategorien für Filter
  const uniqueCategories = [
    'Alle',
    ...new Set(blocks.map((block) => block.category)),
  ]

  // Block-Auswahl-Handler
  const handleSelectBlock = (block: PasteableBlock) => {
    onSelectBlock(block)
    setExpandedBlockId(null) // Schließe Vorschau nach Auswahl
  }

  // Vorschau ein/ausklappen
  const toggleBlockPreview = (blockId: string) => {
    setExpandedBlockId(expandedBlockId === blockId ? null : blockId)
  }

  return (
    <div className={`block-picker ${position} ${className}`}>
      <div className="block-picker-header">
        <h3>Einfügbare Blöcke</h3>

        {showSearch && (
          <div className="block-picker-search">
            <input
              type="text"
              placeholder="Suche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Blöcke durchsuchen"
            />
          </div>
        )}

        <div className="block-picker-categories">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Kategorie auswählen"
          >
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="block-picker-content">
        {filteredBlocks.length === 0 ? (
          <div className="block-picker-empty">Keine Blöcke gefunden.</div>
        ) : (
          <ul className="block-list">
            {filteredBlocks.map((block) => (
              <li key={block.id} className="block-item">
                <div className="block-item-header">
                  <button
                    type="button"
                    className="block-title"
                    onClick={() => handleSelectBlock(block)}
                    title={`Klicken zum Einfügen: ${block.name}`}
                  >
                    {block.name}
                  </button>
                  <div className="block-actions">
                    <button
                      type="button"
                      className="block-preview-toggle"
                      onClick={() => toggleBlockPreview(block.id)}
                      aria-expanded={expandedBlockId === block.id}
                      title="Vorschau anzeigen/ausblenden"
                    >
                      {expandedBlockId === block.id ? '▼' : '▶'}
                    </button>
                  </div>
                </div>

                <div className="block-meta">
                  <span className="block-category">{block.category}</span>
                  {block.tags.map((tag) => (
                    <span key={tag} className="block-tag">
                      #{tag}
                    </span>
                  ))}
                </div>

                {expandedBlockId === block.id && (
                  <div className="block-preview">
                    <div className="block-description">{block.description}</div>
                    <pre className="block-content">{block.content}</pre>
                    <button
                      type="button"
                      className="block-insert-button"
                      onClick={() => handleSelectBlock(block)}
                    >
                      Einfügen
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default BlockPicker
