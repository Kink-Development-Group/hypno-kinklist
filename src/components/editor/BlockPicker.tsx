import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from '../Tooltip'
import { getPasteableBlocks, PasteableBlock } from './EditorUtils'

const ALL_CATEGORY_VALUE = 'all'

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
  const { t } = useTranslation()
  const [blocks, setBlocks] = useState<PasteableBlock[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<PasteableBlock[]>([])
  const [selectedCategory, setSelectedCategory] =
    useState<string>(ALL_CATEGORY_VALUE)
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
    if (selectedCategory !== ALL_CATEGORY_VALUE) {
      result = result.filter((block) => block.category === selectedCategory)
    }

    // Nach Suchbegriff filtern
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(
        (block) =>
          block.name.toLowerCase().includes(lowerQuery) ||
          block.description.toLowerCase().includes(lowerQuery) ||
          block.category.toLowerCase().includes(lowerQuery) ||
          block.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
    }

    setFilteredBlocks(result)
  }, [selectedCategory, searchQuery, blocks])

  // Eindeutige Kategorien für Filter
  const categoryOptions = [
    { value: ALL_CATEGORY_VALUE, label: t('editor.blocks.all') },
    ...[...new Set(blocks.map((block) => block.category))].map((category) => ({
      value: category,
      label: category,
    })),
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
        <h3>{t('editor.blocks.title')}</h3>

        {showSearch && (
          <div className="block-picker-search">
            <input
              type="text"
              placeholder={t('editor.blocks.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('editor.blocks.search')}
            />
          </div>
        )}

        <div className="block-picker-categories">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label={t('editor.snippets.selectCategory')}
          >
            {categoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
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
                  <Tooltip content={`Klicken zum Einfügen: ${block.name}`}>
                    <button
                      type="button"
                      className="block-title"
                      onClick={() => handleSelectBlock(block)}
                    >
                      {block.name}
                    </button>
                  </Tooltip>
                  <div className="block-actions">
                    <Tooltip content="Vorschau anzeigen/ausblenden">
                      <button
                        type="button"
                        className="block-preview-toggle"
                        onClick={() => toggleBlockPreview(block.id)}
                        aria-expanded={expandedBlockId === block.id}
                      >
                        {expandedBlockId === block.id ? '▼' : '▶'}
                      </button>
                    </Tooltip>
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
