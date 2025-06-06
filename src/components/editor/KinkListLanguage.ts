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
    { token: 'subcategory', foreground: '1565c0', fontStyle: 'italic' },
    { token: 'kink-neutral', foreground: 'f57c00', fontStyle: 'bold' },
    { token: 'description', foreground: '5d4037', fontStyle: 'italic' },
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
    { token: 'subcategory', foreground: '64b5f6', fontStyle: 'italic' },
    { token: 'kink-neutral', foreground: 'ffb74d', fontStyle: 'bold' },
    { token: 'description', foreground: 'bcaaa4', fontStyle: 'italic' },
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
  console.log('=== REGISTERING KINKLIST LANGUAGE ===')
  console.log('1. Registering language:', languageId)
  try {
    monaco.languages.register({ id: languageId })
    console.log('2. Language registered successfully')
    monaco.languages.setLanguageConfiguration(
      languageId,
      kinkListLanguageConfig
    )
    console.log('3. Language configuration set')
    monaco.languages.setMonarchTokensProvider(languageId, kinkListTokenProvider)
    console.log('4. Token provider set - rules registered for:')
    console.log('   - Comments (//)')
    console.log('   - Categories (#)')
    console.log('   - Subcategories (())')
    console.log('   - Kinks (*)')
    console.log('   - Descriptions (?)')
    console.log('   - Meta [tags]')
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
            label: 'item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '* ${1:Kink Name}\n? ${2:Beschreibung des Kinks}\n',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Erstellt einen neuen Kink-Eintrag mit Beschreibung',
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
    console.log('5. Completion provider registered successfully')
    console.log(
      'Language and completion provider registered successfully:',
      languageId
    )
    isLanguageRegistered = true
    return languageId
  } catch (error) {
    console.error('Error registering language:', error)
    throw error
  }
}

export const registerKinkListThemes = (monaco) => {
  if (themesRegistered) {
    console.log('Themes already registered')
    return
  }
  console.log('=== REGISTERING KINKLIST THEMES ===')
  console.log('1. Defining light theme...')
  try {
    monaco.editor.defineTheme('kink-list-light', kinkListTheme)
    console.log(
      '2. Light theme defined with rules:',
      kinkListTheme.rules.length,
      'rules'
    )
    monaco.editor.defineTheme('kink-list-dark', kinkListDarkTheme)
    console.log(
      '3. Dark theme defined with rules:',
      kinkListDarkTheme.rules.length,
      'rules'
    )
    console.log('4. Themes registered successfully')
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
      // Kink-Eintrag (nur * ist gültig!)
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
    } else if (line.startsWith('?')) {
      // Beschreibung - sollte nach einem Kink kommen
      if (lastKinkLine !== lineNumber - 1) {
        markers.push({
          severity: monaco.MarkerSeverity.Info,
          message: 'Beschreibung sollte direkt nach einem Kink-Eintrag stehen',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
        })
      }
    } else if (line.startsWith('//')) {
      // Kommentar - keine spezielle Validierung
    } else {
      // Unbekannte Zeile
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: 'Unbekannte Zeile oder Format',
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
      message: 'Die Liste ist leer.',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    })
  }

  return markers
}
