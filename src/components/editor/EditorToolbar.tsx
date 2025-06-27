import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from '../Tooltip'
import BlockPicker from './BlockPicker'
import {
  EditorSnippet,
  getDetailedHelpText,
  getHelpText,
  getSnippets,
  PasteableBlock,
} from './EditorUtils'
import type { MonacoKinkListEditorRef } from './MonacoKinkListEditor'

export interface EditorToolbarProps {
  editorRef: React.RefObject<MonacoKinkListEditorRef>
  onInsertSnippet?: (snippet: string) => void
  showValidation?: boolean
  validationErrors?: string[]
  theme?: 'light' | 'dark' | 'auto'
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorRef,
  onInsertSnippet,
  showValidation = false,
  validationErrors = [],
  theme = 'auto',
}) => {
  const { t } = useTranslation()
  const [showSnippets, setShowSnippets] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showBlocks, setShowBlocks] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedHelpSection, setSelectedHelpSection] =
    useState<string>('syntax')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFormatCode = () => {
    editorRef.current?.formatCode()
  }

  const handleInsertSnippet = (snippet: EditorSnippet) => {
    editorRef.current?.insertSnippet(snippet.insertText)
    onInsertSnippet?.(snippet.insertText)
    setShowSnippets(false)
  }

  const handleInsertBlock = (block: PasteableBlock) => {
    editorRef.current?.insertSnippet(block.content)
    setShowBlocks(false)
  }

  const handleFocus = () => {
    editorRef.current?.focus()
  }

  const getFilteredSnippets = () => {
    const allSnippets = getSnippets()
    if (selectedCategory === 'all') {
      return allSnippets
    }
    // Filter basierend auf dem Label des Snippets
    return allSnippets.filter((snippet) => {
      const label = snippet.label.toLowerCase()
      switch (selectedCategory) {
        case 'category':
          return label.includes('cat') || label.includes('section')
        case 'kink':
          return label.includes('item') || label.includes('kink')
        case 'description':
          return label.includes('desc') || label.includes('help')
        case 'template':
          return (
            label.includes('template') ||
            label.includes('basic') ||
            label.includes('safety') ||
            label.includes('types')
          )
        default:
          return true
      }
    })
  }

  const snippetCategories = [
    { value: 'all', label: t('editor.snippets.categories.all') },
    { value: 'category', label: t('editor.snippets.categories.category') },
    { value: 'kink', label: t('editor.snippets.categories.kink') },
    {
      value: 'description',
      label: t('editor.snippets.categories.description'),
    },
    { value: 'template', label: t('editor.snippets.categories.template') },
  ]

  const helpSections = [
    { value: 'syntax', label: t('editor.help.sections.syntax') },
    { value: 'quickStart', label: t('editor.help.sections.quickStart') },
    {
      value: 'keyboardShortcuts',
      label: t('editor.help.sections.keyboardShortcuts'),
    },
    { value: 'advanced', label: t('editor.help.sections.advanced') },
  ]

  const detailedHelp = getDetailedHelpText()

  // Automatisch Snippets schließen, wenn außerhalb geklickt wird
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSnippets(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`editor-toolbar ${theme}`}>
      <div className="toolbar-group">
        <Tooltip content={t('editor.toolbar.formatTooltip')}>
          <button
            type="button"
            className="toolbar-button"
            onClick={handleFormatCode}
            aria-label={t('editor.toolbar.format')}
          >
            <span className="icon">📝</span>
            {t('editor.toolbar.format')}
          </button>
        </Tooltip>

        <div className="toolbar-dropdown" ref={dropdownRef}>
          <Tooltip content={t('editor.toolbar.snippetsTooltip')}>
            <button
              type="button"
              className="toolbar-button dropdown-toggle"
              onClick={() => {
                setShowSnippets(!showSnippets)
                setShowBlocks(false)
              }}
              aria-label={t('editor.toolbar.snippets')}
              aria-expanded={showSnippets}
            >
              <span className="icon">📋</span>
              {t('editor.toolbar.snippets')}
              <span className="dropdown-arrow">
                {showSnippets ? '▼' : '▶'}
              </span>
            </button>
          </Tooltip>

          {showSnippets && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-filter"
                  aria-label={t('editor.snippets.selectCategory')}
                >
                  {snippetCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="snippet-list">
                {getFilteredSnippets().map((snippet, index) => (
                  <Tooltip key={index} content={snippet.documentation}>
                    <button
                      type="button"
                      className="snippet-item"
                      onClick={() => handleInsertSnippet(snippet)}
                    >
                      <div className="snippet-label">{snippet.label}</div>
                      <div className="snippet-detail">{snippet.detail}</div>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>

        <Tooltip content={t('editor.toolbar.blocksTooltip')}>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => {
              setShowBlocks(!showBlocks)
              setShowSnippets(false)
            }}
            aria-label={t('editor.toolbar.blocks')}
            aria-expanded={showBlocks}
          >
            <span className="icon">📦</span>
            {t('editor.toolbar.blocks')}
          </button>
        </Tooltip>

        <Tooltip content={t('editor.toolbar.helpTooltip')}>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => {
              setShowHelp(!showHelp)
              setShowSnippets(false)
              setShowBlocks(false)
            }}
            aria-label={t('editor.toolbar.help')}
            aria-expanded={showHelp}
          >
            <span className="icon">❓</span>
            {t('editor.toolbar.help')}
          </button>
        </Tooltip>

        <Tooltip content={t('editor.toolbar.focusTooltip')}>
          <button
            type="button"
            className="toolbar-button"
            onClick={handleFocus}
            aria-label={t('editor.toolbar.focus')}
          >
            <span className="icon">🎯</span>
            {t('editor.toolbar.focus')}
          </button>
        </Tooltip>
      </div>

      {/* Erweiterte Block-Auswahl */}
      {showBlocks && (
        <BlockPicker
          onSelectBlock={handleInsertBlock}
          position="bottom"
          showSearch={true}
        />
      )}

      {/* Validierungsfehler */}
      {showValidation && validationErrors.length > 0 && (
        <div className="validation-panel">
          <div className="validation-header">
            <span className="icon error">⚠️</span>
            {t('editor.validation.errors')} ({validationErrors.length})
          </div>
          <ul className="validation-errors">
            {validationErrors.map((error, index) => (
              <li key={index} className="validation-error">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Erweiterter Hilfebereich */}
      {showHelp && (
        <div className="help-panel">
          <div className="help-header">
            <span className="icon">📚</span>
            {t('editor.help.title')}
            <div className="help-tabs">
              {helpSections.map((section) => (
                <button
                  key={section.value}
                  type="button"
                  className={`help-tab ${selectedHelpSection === section.value ? 'active' : ''}`}
                  onClick={() => setSelectedHelpSection(section.value)}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="close-button"
              onClick={() => setShowHelp(false)}
              aria-label={t('editor.help.close')}
            >
              ✕
            </button>
          </div>
          <div className="help-content">
            <pre>{detailedHelp[selectedHelpSection] || getHelpText()}</pre>
          </div>
        </div>
      )}

      <div className="toolbar-shortcuts">
        <small>
          {t('editor.shortcuts.description')} <kbd>Strg+K</kbd>{' '}
          {t('editor.shortcuts.autocomplete')}, <kbd>Alt+Shift+F</kbd>{' '}
          {t('editor.shortcuts.format')}, <kbd>Strg+Enter</kbd>{' '}
          {t('editor.shortcuts.save')}, <kbd>Esc</kbd>{' '}
          {t('editor.shortcuts.close')}
        </small>
      </div>
    </div>
  )
}

export default EditorToolbar
