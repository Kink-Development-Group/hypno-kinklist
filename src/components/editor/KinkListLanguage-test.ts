import * as monaco from 'monaco-editor'

export interface KinkListToken {
  type:
    | 'category'
    | 'fields'
    | 'kink'
    | 'description'
    | 'comment'
    | 'kink-positive'
    | 'kink-negative'
    | 'kink-neutral'
    | 'kink-question'
    | 'keyword'
    | 'meta'
  text: string
  line: number
  startColumn: number
  endColumn: number
}

export const kinkListLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
  },
  brackets: [
    ['{', '}'],
    ['(', ')'],
    ['[', ']'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
  ],
  folding: {
    markers: {
      start: /^#/,
      end: /^(?=#|\()/,
    },
  },
}

// Erweiterter Token Provider mit umfassender Syntax-Hervorhebung
export const kinkListTokenProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: 'text',

  tokenizer: {
    root: [
      // Kategorien
      [/^#(.*)$/, 'category'],

      // Unterkategorien
      [/^\(([^)]*)\)$/, 'subcategory'],

      // Kinks mit verschiedenen Status
      [/^\+\s+(.*)$/, 'kink-positive'],
      [/^-\s+(.*)$/, 'kink-negative'],
      [/^\*\s+(.*)$/, 'kink-neutral'],
      [/^\?\s+(.*)$/, 'kink-question'],

      // Beschreibungen
      [/^\?\s+(.*)$/, 'description'],

      // Kommentare
      [/^\/\/.*$/, 'comment'],

      // Schlüsselwörter
      [/\b(must|never|always|sometimes)\b/i, 'keyword'],

      // Tags und Metadaten
      [/\[([^\]]*)\]/, 'meta'],
    ],
  },
}

// Grundlegendes Licht-Theme
export const kinkListTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'category', foreground: '2e7d32', fontStyle: 'bold' },
    { token: 'subcategory', foreground: '1565c0', fontStyle: 'italic' },
    { token: 'kink-positive', foreground: '388e3c', fontStyle: 'bold' },
    { token: 'kink-negative', foreground: 'd32f2f', fontStyle: 'bold' },
    { token: 'kink-neutral', foreground: 'f57c00', fontStyle: 'bold' },
    { token: 'kink-question', foreground: '0288d1', fontStyle: 'bold' },
    { token: 'description', foreground: '5d4037', fontStyle: 'italic' },
    { token: 'comment', foreground: '757575', fontStyle: 'italic' },
    { token: 'keyword', foreground: '6a1b9a', fontStyle: 'bold' },
    { token: 'meta', foreground: '00695c', fontStyle: 'italic' },
    { token: 'text', foreground: '000000' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f5f5f5',
    'editorCursor.foreground': '#000000',
    'editor.selectionBackground': '#b3e5fc',
    'editorLineNumber.foreground': '#616161',
  },
}

// Dunkles Theme
export const kinkListDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'category', foreground: '81c784', fontStyle: 'bold' },
    { token: 'subcategory', foreground: '64b5f6', fontStyle: 'italic' },
    { token: 'kink-positive', foreground: 'a5d6a7', fontStyle: 'bold' },
    { token: 'kink-negative', foreground: 'ef9a9a', fontStyle: 'bold' },
    { token: 'kink-neutral', foreground: 'ffcc80', fontStyle: 'bold' },
    { token: 'kink-question', foreground: '90caf9', fontStyle: 'bold' },
    { token: 'description', foreground: 'bcaaa4', fontStyle: 'italic' },
    { token: 'comment', foreground: '9e9e9e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ce93d8', fontStyle: 'bold' },
    { token: 'meta', foreground: '80cbc4', fontStyle: 'italic' },
    { token: 'text', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2d2d2d',
    'editorCursor.foreground': '#ffffff',
    'editor.selectionBackground': '#264f78',
    'editorLineNumber.foreground': '#858585',
  },
}

let isLanguageRegistered = false
let themesRegistered = false

export const registerKinkListLanguage = () => {
  const languageId = 'kinklist'

  // Verhindere mehrfache Registrierung
  if (isLanguageRegistered) {
    console.log('Language already registered:', languageId)
    return languageId
  }

  console.log('Registering language:', languageId)

  // Registriere die Sprache
  monaco.languages.register({ id: languageId })

  // Setze die Sprachkonfiguration
  monaco.languages.setLanguageConfiguration(languageId, kinkListLanguageConfig)

  // Setze den Token-Provider
  monaco.languages.setMonarchTokensProvider(languageId, kinkListTokenProvider)

  // Registriere Autovervollständigung
  monaco.languages.registerCompletionItemProvider(languageId, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions = [
        // Kategorie-Snippets
        {
          label: 'cat',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '#${1:Kategorie Name}\n(${2:Unterkategorie})\n',
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation:
            'Erstellt eine neue Kategorie mit optionaler Unterkategorie',
          range: range,
        },

        // Kink-Snippets
        {
          label: 'item',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '* ${1:Kink Name}\n? ${2:Beschreibung des Kinks}\n',
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Erstellt einen neuen Kink-Eintrag mit Beschreibung',
          range: range,
        },

        // Weitere Snippets können hier hinzugefügt werden
      ]

      return { suggestions }
    },
  })

  console.log('Language registered successfully:', languageId)
  isLanguageRegistered = true
  return languageId
}

export const registerKinkListThemes = () => {
  if (themesRegistered) {
    console.log('Themes already registered')
    return
  }

  console.log('Registering themes...')

  // Definiere Themes
  monaco.editor.defineTheme('kink-list-light', kinkListTheme)
  monaco.editor.defineTheme('kink-list-dark', kinkListDarkTheme)

  console.log('Themes registered successfully')
  themesRegistered = true
}

// Verbesserte Validierungsfunktion
export const validateKinkListSyntax = (
  text: string
): monaco.editor.IMarkerData[] => {
  const lines = text.split('\n')
  const markers: monaco.editor.IMarkerData[] = []

  let currentCategory = ''
  let hasAnyContent = false
  let lastKinkLine = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    if (line === '') continue

    hasAnyContent = true

    if (line.startsWith('#')) {
      currentCategory = line
      // Prüfe auf gültigen Kategorienamen
      if (line.length <= 1) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Kategorie muss einen Namen haben',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.startsWith('(') && line.endsWith(')')) {
      // Unterkategorie - sollte nach einer Kategorie kommen
      if (!currentCategory) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Unterkategorie ohne vorherige Kategorie',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.match(/^[*+\-?]\s/)) {
      // Kink-Eintrag
      lastKinkLine = lineNumber
      if (!currentCategory) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Kink-Eintrag ohne Kategorie',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
      if (line.length <= 2) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Kink-Eintrag sollte einen Namen haben',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.startsWith('?')) {
      // Beschreibung - sollte nach einem Kink kommen
      if (lastKinkLine !== lineNumber - 1) {
        markers.push({
          severity: monaco.MarkerSeverity.Info,
          message: 'Beschreibung sollte direkt nach einem Kink folgen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }

      if (line.length <= 1) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Leere Beschreibung',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (!line.startsWith('//')) {
      // Ignoriere Kommentare
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: `Unbekanntes Format - "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`,
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
      })
    }
  }

  if (!hasAnyContent) {
    markers.push({
      severity: monaco.MarkerSeverity.Info,
      message: 'Dokument ist leer',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    })
  }

  return markers
}
