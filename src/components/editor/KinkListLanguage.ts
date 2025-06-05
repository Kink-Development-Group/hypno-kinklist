import * as monaco from 'monaco-editor'

export interface KinkListToken {
  type: 'category' | 'fields' | 'kink' | 'description' | 'comment'
  text: string
  line: number
  startColumn: number
  endColumn: number
}

export const kinkListLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
  ],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  indentationRules: {
    increaseIndentPattern: /^.*\{[^}]*$/,
    decreaseIndentPattern: /^.*\}.*$/,
  },
}

export const kinkListTokenProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: 'default',
  tokenPostfix: '.kinklist',

  tokenizer: {
    root: [
      // Kommentare (beginnen mit //)
      [/\/\/.*$/, 'comment'],

      // Kategorien (beginnen mit #) - einfacher Regex
      [/^#/, 'category'],

      // Felder (in Klammern) - einfacher Regex
      [/^\(/, 'fields'],

      // Beschreibungen (beginnen mit ? und haben Leerzeichen) - vor anderen ?-Regeln
      [/^\?\s/, 'description'],

      // Kinks mit verschiedenen Status
      [/^\+/, 'kink-yes'], // Mag ich / Ja (grün)
      [/^-/, 'kink-no'], // Mag ich nicht / Nein (rot)
      [/^\*/, 'kink-neutral'], // Standard/Neutral (gelb)
      [/^\?/, 'kink-maybe'], // Interessiert / Vielleicht (orange)

      // Default für alles andere
      [/.*/, 'default'],
    ],
  },
}

export const kinkListTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'default', foreground: '000000' },
    { token: 'category', foreground: '2e7d32', fontStyle: 'bold' },
    { token: 'fields', foreground: '1565c0', fontStyle: 'italic' },
    { token: 'kink-neutral', foreground: 'f57c00', fontStyle: 'bold' }, // Gelb für Standard/Neutral (*)
    { token: 'kink-yes', foreground: '388e3c', fontStyle: 'bold' }, // Grün für Ja (+)
    { token: 'kink-no', foreground: 'd32f2f', fontStyle: 'bold' }, // Rot für Nein (-)
    { token: 'kink-maybe', foreground: 'ff9800', fontStyle: 'bold' }, // Orange für Vielleicht (?)
    { token: 'description', foreground: '5d4037', fontStyle: 'italic' },
    { token: 'comment', foreground: '757575', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background': '#fafafa',
    'editor.foreground': '#212121',
  },
}

export const kinkListDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'default', foreground: 'd4d4d4' },
    { token: 'category', foreground: '81c784', fontStyle: 'bold' },
    { token: 'fields', foreground: '64b5f6', fontStyle: 'italic' },
    { token: 'kink-neutral', foreground: 'ffb74d', fontStyle: 'bold' }, // Gelb für Standard/Neutral (*)
    { token: 'kink-yes', foreground: '81c784', fontStyle: 'bold' }, // Grün für Ja (+)
    { token: 'kink-no', foreground: 'ef5350', fontStyle: 'bold' }, // Rot für Nein (-)
    { token: 'kink-maybe', foreground: 'ffb74d', fontStyle: 'bold' }, // Orange für Vielleicht (?)
    { token: 'description', foreground: 'bcaaa4', fontStyle: 'italic' },
    { token: 'comment', foreground: '9e9e9e', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
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

export const validateKinkListSyntax = (
  text: string
): monaco.editor.IMarkerData[] => {
  const markers: monaco.editor.IMarkerData[] = []
  const lines = text.split('\n')

  let currentCategory: string | null = null
  let lineNum = 0

  for (const line of lines) {
    lineNum++
    const trimmedLine = line.trim()

    if (!trimmedLine) continue

    if (trimmedLine.startsWith('#')) {
      // Neue Kategorie
      if (trimmedLine.length <= 1) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Kategoriename darf nicht leer sein',
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: line.length + 1,
        })
      } else {
        currentCategory = trimmedLine.substring(1).trim()
      }
    } else if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      // Felder Definition
      if (!currentCategory) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Felder müssen innerhalb einer Kategorie definiert werden',
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: line.length + 1,
        })
      } else {
        const fieldsContent = trimmedLine
          .substring(1, trimmedLine.length - 1)
          .trim()
        if (!fieldsContent) {
          markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: 'Felder-Definition ist leer',
            startLineNumber: lineNum,
            startColumn: 1,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
          })
        }
      }
    } else if (trimmedLine.match(/^[*+-](?:\s|$)/)) {
      // Kink Definition (*, +, -)
      if (!currentCategory) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Kinks müssen innerhalb einer Kategorie definiert werden',
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: line.length + 1,
        })
      }

      const kinkName = trimmedLine.substring(1).trim()
      if (!kinkName) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Kink-Name darf nicht leer sein',
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: line.length + 1,
        })
      }
    } else if (trimmedLine.startsWith('?')) {
      // Beschreibung (beginnt am Zeilenanfang mit ?)
      const description = trimmedLine.substring(1).trim()
      if (!description) {
        markers.push({
          severity: monaco.MarkerSeverity.Info,
          message: 'Beschreibung ist leer',
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: line.length + 1,
        })
      }
    } else if (trimmedLine.startsWith('//')) {
      // Kommentar - valide, keine Validierung nötig
    } else {
      // Unbekannte Syntax
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message:
          'Unbekannte Syntax. Verwenden Sie #, (, *, ? oder // am Zeilenanfang',
        startLineNumber: lineNum,
        startColumn: 1,
        endLineNumber: lineNum,
        endColumn: line.length + 1,
      })
    }
  }

  return markers
}
