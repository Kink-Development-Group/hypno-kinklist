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
  },
}

// EINFACHSTER TEST: Nur Test-Token
export const kinkListTokenProvider: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      // TEST: Alle Zeilen die mit # anfangen sollen rot werden
      [/^#/, 'test-red'],
      [/#/, 'test-blue'],
      [/\w+/, 'test-green'],
      [/./, 'test-default'],
    ],
  },
}

export const kinkListTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'test-red', foreground: 'ff0000', fontStyle: 'bold' },
    { token: 'test-blue', foreground: '0000ff', fontStyle: 'bold' },
    { token: 'test-green', foreground: '00ff00', fontStyle: 'bold' },
    { token: 'test-default', foreground: '000000' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
  },
}

export const kinkListDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'test-red', foreground: 'ff6b6b', fontStyle: 'bold' },
    { token: 'test-blue', foreground: '74b9ff', fontStyle: 'bold' },
    { token: 'test-green', foreground: '55a3ff', fontStyle: 'bold' },
    { token: 'test-default', foreground: 'd4d4d4' },
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
  return [] // Temporär deaktiviert für den Test
}
