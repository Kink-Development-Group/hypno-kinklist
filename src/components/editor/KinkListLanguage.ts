// Kein globales monaco importieren! Das Monaco-Objekt muss immer als Argument übergeben werden.

export interface KinkListToken {
  type: 'category' | 'subcategory' | 'kink' | 'description' | 'comment' | 'meta'
  text: string
  line: number
  startColumn: number
  endColumn: number
}

export const kinkListLanguageConfig = {
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

export const kinkListTokenProvider = {
  defaultToken: 'text',
  ignoreCase: false,
  tokenizer: {
    root: [
      [/^\s*\/\/.*/, 'comment'],
      [/^\s*\+\s*\[[A-Z]{2}\]\s*#.*/, 'multilingual-category'],
      [/^\s*\+\s*\[[A-Z]{2}\]\s*\([^)]*\)\s*$/, 'multilingual-subcategory'],
      [/^\s*\+\s*\[[A-Z]{2}\]\s*\*.*/, 'multilingual-kink'],
      [/^\s*\+\s*\[[A-Z]{2}\]\s*\?.*/, 'multilingual-description'],
      [/^\s*#.*/, 'category'],
      [/^\s*\([^)]*\)\s*$/, 'subcategory'],
      [/^\s*\*.*/, 'kink-neutral'],
      [/^\s*\?.*/, 'description'],
      [/\[([^\]]*)\]/, 'meta'],
      [/.*/, 'text'],
    ],
  },
}

export const kinkListTheme = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'category', foreground: '2e7d32', fontStyle: 'bold' },
    {
      token: 'multilingual-category',
      foreground: '1b5e20',
      fontStyle: 'bold italic',
    },
    { token: 'subcategory', foreground: '1565c0', fontStyle: 'italic' },
    {
      token: 'multilingual-subcategory',
      foreground: '0d47a1',
      fontStyle: 'italic',
    },
    { token: 'kink-neutral', foreground: 'f57c00', fontStyle: 'bold' },
    {
      token: 'multilingual-kink',
      foreground: 'e65100',
      fontStyle: 'bold italic',
    },
    { token: 'description', foreground: '5d4037', fontStyle: 'italic' },
    {
      token: 'multilingual-description',
      foreground: '3e2723',
      fontStyle: 'italic',
    },
    { token: 'comment', foreground: '757575', fontStyle: 'italic' },
    { token: 'meta', foreground: '00695c', fontStyle: 'italic' },
    { token: 'text', foreground: '212121' },
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

export const kinkListDarkTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'category', foreground: '81c784', fontStyle: 'bold' },
    {
      token: 'multilingual-category',
      foreground: '4caf50',
      fontStyle: 'bold italic',
    },
    { token: 'subcategory', foreground: '64b5f6', fontStyle: 'italic' },
    {
      token: 'multilingual-subcategory',
      foreground: '2196f3',
      fontStyle: 'italic',
    },
    { token: 'kink-neutral', foreground: 'ffb74d', fontStyle: 'bold' },
    {
      token: 'multilingual-kink',
      foreground: 'ff9800',
      fontStyle: 'bold italic',
    },
    { token: 'description', foreground: 'bcaaa4', fontStyle: 'italic' },
    {
      token: 'multilingual-description',
      foreground: '8d6e63',
      fontStyle: 'italic',
    },
    { token: 'comment', foreground: '9e9e9e', fontStyle: 'italic' },
    { token: 'meta', foreground: '80cbc4', fontStyle: 'italic' },
    { token: 'text', foreground: 'e0e0e0' },
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

export const registerKinkListLanguage = (monaco) => {
  const languageId = 'kinklist'
  if (isLanguageRegistered) {
    console.log('Language already registered:', languageId)
    return languageId
  }

  try {
    monaco.languages.register({ id: languageId })
    monaco.languages.setLanguageConfiguration(
      languageId,
      kinkListLanguageConfig
    )
    monaco.languages.setMonarchTokensProvider(languageId, kinkListTokenProvider)
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
          {
            label: 'cat',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#${1:Kategorie Name}\n(${2:General})\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation:
              'Erstellt eine neue Kategorie mit optionaler Feldbezeichnung',
            range: range,
          },
          {
            label: 'mcat',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              '#${1:Category Name}\n+ [DE] #${2:Deutscher Name}\n+ [SV] #${3:Svenska namn}\n(${4:General})\n+ [DE] (${5:Allgemein})\n+ [SV] (${6:Allmänt})\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation:
              'Erstellt eine multilingual Kategorie mit Übersetzungen',
            range: range,
          },
          {
            label: 'item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '* ${1:Kink Name}\n? ${2:Beschreibung des Kinks}\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Erstellt einen neuen Kink-Eintrag mit Beschreibung',
            range: range,
          },
          {
            label: 'mitem',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              '* ${1:Kink Name}\n+ [DE] * ${2:Deutscher Kink Name}\n+ [SV] * ${3:Svenska kink namn}\n? ${4:Description}\n+ [DE] ? ${5:Deutsche Beschreibung}\n+ [SV] ? ${6:Svenska beskrivning}\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation:
              'Erstellt einen multilinguale Kink-Eintrag mit Übersetzungen',
            range: range,
          },
          {
            label: 'trans',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '+ [${1:DE}] ${2:Übersetzung}\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Fügt eine Übersetzungszeile hinzu',
            range: range,
          },
          {
            label: 'comment',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '// ${1:Kommentar}\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Fügt eine Kommentarzeile hinzu',
            range: range,
          },
        ]
        return { suggestions }
      },
    })

    isLanguageRegistered = true
    return languageId
  } catch (error) {
    console.error('Error registering language:', error)
    throw error
  }
}

export const registerKinkListThemes = (monaco) => {
  if (themesRegistered) {
    return
  }
  try {
    monaco.editor.defineTheme('kink-list-light', kinkListTheme)
    monaco.editor.defineTheme('kink-list-dark', kinkListDarkTheme)
    themesRegistered = true
  } catch (error) {
    console.error('Error registering themes:', error)
    throw error
  }
}

// Die Validierungsfunktion benötigt jetzt das Monaco-Objekt als Argument!
export const validateKinkListSyntax = (monaco, text) => {
  const lines = text.split('\n')
  const markers: any[] = []

  let currentCategory = ''
  let hasAnyContent = false
  let lastKinkLine = -1
  let lastCategoryLine = -1
  let lastFieldLine = -1
  let lastDescriptionLine = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    if (line === '') continue

    hasAnyContent = true

    // Multilingual translation lines
    if (line.match(/^\+\s*\[[A-Z]{2}\]/)) {
      const translationMatch = line.match(/^\+\s*\[([A-Z]{2})\]\s*(.*)$/)
      if (!translationMatch) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Ungültiges Übersetzungsformat. Erwartet: + [XX] content',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
        continue
      }

      const [, lang, content] = translationMatch

      // Validate language code
      if (lang.length !== 2) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Sprachcode muss aus genau 2 Buchstaben bestehen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }

      // Check if translation content is appropriate
      if (
        content.startsWith('#') &&
        lastCategoryLine !== i - 1 &&
        lastCategoryLine !== i - 2
      ) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message:
            'Kategorieübersetzung sollte direkt nach der Kategorie stehen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      } else if (
        content.startsWith('(') &&
        lastFieldLine !== i - 1 &&
        lastFieldLine !== i - 2
      ) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message:
            'Feldübersetzung sollte direkt nach der Feldbezeichnung stehen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      } else if (
        content.startsWith('*') &&
        lastKinkLine !== i - 1 &&
        lastKinkLine !== i - 2
      ) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Kink-Übersetzung sollte direkt nach dem Kink stehen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      } else if (
        content.startsWith('?') &&
        lastDescriptionLine !== i - 1 &&
        lastDescriptionLine !== i - 2
      ) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message:
            'Beschreibungsübersetzung sollte direkt nach der Beschreibung stehen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }

      continue
    }

    // Regular content lines
    if (line.startsWith('#')) {
      currentCategory = line
      lastCategoryLine = i
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
      lastFieldLine = i
      // Feldbezeichnung - sollte nach einer Kategorie kommen
      if (!currentCategory) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Feldbezeichnung ohne vorherige Kategorie',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.startsWith('*')) {
      lastKinkLine = i
      // Kink-Eintrag - sollte nach einer Kategorie kommen
      if (!currentCategory) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Kink-Eintrag ohne vorherige Kategorie',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
      // Prüfe auf leeren Kink-Namen
      if (line.length <= 1 || line.substring(1).trim() === '') {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Kink-Eintrag muss einen Namen haben',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.startsWith('?')) {
      lastDescriptionLine = i
      // Beschreibung - sollte nach einem Kink kommen
      if (lastKinkLine === -1 || i - lastKinkLine > 10) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Beschreibung ohne zugehörigen Kink-Eintrag',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.startsWith('//')) {
      // Kommentar - ist immer OK
      continue
    } else {
      // Unbekannte Zeile
      markers.push({
        severity: monaco.MarkerSeverity.Info,
        message:
          'Unbekanntes Format. Zeilen sollten mit #, (, *, ?, // oder + [XX] beginnen',
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
      })
    }
  }

  // Prüfe ob mindestens ein Inhalt vorhanden ist
  if (!hasAnyContent) {
    markers.push({
      severity: monaco.MarkerSeverity.Warning,
      message: 'Dokument ist leer',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    })
  }

  return markers
}
