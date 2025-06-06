import React, { useState, useRef } from 'react'
import {
  getSnippets,
  getHelpText,
  EditorSnippet,
  getDetailedHelpText,
  PasteableBlock,
} from './EditorUtils'
import type { MonacoKinkListEditorRef } from './MonacoKinkListEditor'
import BlockPicker from './BlockPicker'

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
    { value: 'all', label: 'Alle' },
    { value: 'category', label: 'Kategorien' },
    { value: 'kink', label: 'Kinks' },
    { value: 'description', label: 'Beschreibungen' },
    { value: 'template', label: 'Vorlagen' },
  ]

  const helpSections = [
    { value: 'syntax', label: 'Syntax' },
    { value: 'quickStart', label: 'Schnellstart' },
    { value: 'keyboardShortcuts', label: 'Tastenkürzel' },
    { value: 'advanced', label: 'Erweitert' },
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
        <button
          type="button"
          className="toolbar-button"
          onClick={handleFormatCode}
          title="Code formatieren (Alt+Shift+F)"
          aria-label="Code formatieren"
        >
          <span className="icon">📝</span>
          Formatieren
        </button>

        <div className="toolbar-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="toolbar-button dropdown-toggle"
            onClick={() => {
              setShowSnippets(!showSnippets)
              setShowBlocks(false)
            }}
            title="Snippet einfügen (Ctrl+K für Autocomplete)"
            aria-label="Snippet-Menü öffnen"
            aria-expanded={showSnippets}
          >
            <span className="icon">📋</span>
            Snippets
            <span className="dropdown-arrow">{showSnippets ? '▼' : '▶'}</span>
          </button>

          {showSnippets && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-filter"
                  aria-label="Snippet-Kategorie auswählen"
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
                  <button
                    key={index}
                    type="button"
                    className="snippet-item"
                    onClick={() => handleInsertSnippet(snippet)}
                    title={snippet.documentation}
                  >
                    <div className="snippet-label">{snippet.label}</div>
                    <div className="snippet-detail">{snippet.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="toolbar-button"
          onClick={() => {
            setShowBlocks(!showBlocks)
            setShowSnippets(false)
          }}
          title="Vorgefertigte Blöcke einfügen"
          aria-label="Block-Menü öffnen"
          aria-expanded={showBlocks}
        >
          <span className="icon">📦</span>
          Blöcke
        </button>

        <button
          type="button"
          className="toolbar-button"
          onClick={() => {
            setShowHelp(!showHelp)
            setShowSnippets(false)
            setShowBlocks(false)
          }}
          title="Syntax-Hilfe anzeigen"
          aria-label="Hilfe anzeigen"
          aria-expanded={showHelp}
        >
          <span className="icon">❓</span>
          Hilfe
        </button>

        <button
          type="button"
          className="toolbar-button"
          onClick={handleFocus}
          title="Editor fokussieren"
          aria-label="Editor fokussieren"
        >
          <span className="icon">🎯</span>
          Fokus
        </button>
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
            Validierungsfehler ({validationErrors.length})
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
            Syntax-Hilfe
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
              aria-label="Hilfe schließen"
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
          Shortcuts: <kbd>Strg+K</kbd> Autocomplete, <kbd>Alt+Shift+F</kbd>{' '}
          Formatieren, <kbd>Strg+Enter</kbd> Speichern, <kbd>Esc</kbd> Schließen
        </small>
      </div>
    </div>
  )
}

export default EditorToolbar
