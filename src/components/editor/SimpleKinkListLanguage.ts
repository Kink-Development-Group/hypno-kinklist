import * as monaco from 'monaco-editor'

// Sehr einfacher Tokenizer, der definitiv funktioniert
export const createSimpleKinkListLanguage = () => {
  const LANGUAGE_ID = 'kinklist-simple'

  // Register basic language
  monaco.languages.register({ id: LANGUAGE_ID })

  // Simple tokenizer - eine Regel pro Zeilenanfang
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/^#.*/, 'category'],
        [/^\(.*\)/, 'fields'],
        [/^\/\/.*/, 'comment'],
        [/^\?\s.*/, 'description'],
        [/^\+.*/, 'kink-yes'],
        [/^-.*/, 'kink-no'],
        [/^\*.*/, 'kink-neutral'],
        [/^\?[^\s].*/, 'kink-maybe'],
        [/^$/, 'empty'],
        [/.*/, 'text'],
      ],
    },
  })

  // Simple theme
  monaco.editor.defineTheme('kinklist-simple-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'category', foreground: '2e7d32', fontStyle: 'bold' }, // Grün
      { token: 'fields', foreground: '1565c0', fontStyle: 'italic' }, // Blau
      { token: 'comment', foreground: '757575', fontStyle: 'italic' }, // Grau
      { token: 'description', foreground: '5d4037', fontStyle: 'italic' }, // Braun
      { token: 'kink-yes', foreground: '388e3c', fontStyle: 'bold' }, // Grün
      { token: 'kink-no', foreground: 'd32f2f', fontStyle: 'bold' }, // Rot
      { token: 'kink-neutral', foreground: 'f57c00', fontStyle: 'bold' }, // Orange
      { token: 'kink-maybe', foreground: 'ff6f00', fontStyle: 'bold' }, // Orange
      { token: 'text', foreground: '000000' },
      { token: 'empty', foreground: '000000' },
    ],
    colors: {},
  })

  monaco.editor.defineTheme('kinklist-simple-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'category', foreground: '81c784', fontStyle: 'bold' },
      { token: 'fields', foreground: '64b5f6', fontStyle: 'italic' },
      { token: 'comment', foreground: '9e9e9e', fontStyle: 'italic' },
      { token: 'description', foreground: 'bcaaa4', fontStyle: 'italic' },
      { token: 'kink-yes', foreground: '81c784', fontStyle: 'bold' },
      { token: 'kink-no', foreground: 'ef5350', fontStyle: 'bold' },
      { token: 'kink-neutral', foreground: 'ffb74d', fontStyle: 'bold' },
      { token: 'kink-maybe', foreground: 'ff9800', fontStyle: 'bold' },
      { token: 'text', foreground: 'd4d4d4' },
      { token: 'empty', foreground: 'd4d4d4' },
    ],
    colors: {},
  })

  console.log('Simple KinkList language registered:', LANGUAGE_ID)
  return LANGUAGE_ID
}
