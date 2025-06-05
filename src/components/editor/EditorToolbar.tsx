import React, { useState, useRef } from 'react'
import { getSnippets, getHelpText, EditorSnippet } from './EditorUtils'
import type { KinkListEditorRef } from './KinkListEditor'

export interface EditorToolbarProps {
  editorRef: React.RefObject<KinkListEditorRef>
  onInsertSnippet?: (snippet: string) => void
  showValidation?: boolean
  validationErrors?: string[]
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorRef,
  onInsertSnippet,
  showValidation = false,
  validationErrors = [],
}) => {
  const [showSnippets, setShowSnippets] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFormatCode = () => {
    editorRef.current?.formatCode()
  }

  const handleInsertSnippet = (snippet: EditorSnippet) => {
    editorRef.current?.insertSnippet(snippet.insertText)
    onInsertSnippet?.(snippet.insertText)
    setShowSnippets(false)
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

  return (
    <div className="editor-toolbar">
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
            onClick={() => setShowSnippets(!showSnippets)}
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
          onClick={() => setShowHelp(!showHelp)}
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

      {showHelp && (
        <div className="help-panel">
          <div className="help-header">
            <span className="icon">📚</span>
            Syntax-Hilfe
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
            <pre>{getHelpText()}</pre>
          </div>
        </div>
      )}

      <div className="toolbar-shortcuts">
        <small>
          Shortcuts: <kbd>Ctrl+K</kbd> Autocomplete, <kbd>Alt+Shift+F</kbd>{' '}
          Formatieren, <kbd>Ctrl+Enter</kbd> Speichern, <kbd>Esc</kbd> Schließen
        </small>
      </div>
    </div>
  )
}

export default EditorToolbar
