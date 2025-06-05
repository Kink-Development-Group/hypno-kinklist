import { defaultKinksText } from '../../App'

// Interface für Snippets
export interface EditorSnippet {
  label: string
  insertText: string
  detail: string
  documentation: string
}

// Hilfstext für den Editor
export const getHelpText = (): string => {
  return `Kink-Listen-Editor Hilfe:

SYNTAX:
# Kategorie Name - Definiert eine neue Kategorie
(Unterkategorie) - Optionale Unterkategorie nach #-Zeile
* Kink Name - Definiert einen Kink mit Standard-Status "?"
? Beschreibung - Beschreibung des Kinks (optional)

STATUS-SYMBOLE:
* Standard/Neutral (gelb)
+ Mag ich / Ja (grün)
- Mag ich nicht / Nein (rot)
? Interessiert / Vielleicht (orange)

TASTENKÜRZEL:
Strg+Space - Snippet-Vorschläge
Strg+Shift+F - Formatieren
F1 - Hilfe anzeigen

SNIPPETS:
- cat: Neue Kategorie
- item: Neuer Kink-Eintrag
- section: Kategorie mit Kinks
- template: Vollständiges Standard-Template

TIPPS:
- Verwenden Sie leere Zeilen zur besseren Lesbarkeit
- Kategorien sollten mit # beginnen
- Jeder Kink sollte mit *, +, - oder ? beginnen
- Beschreibungen sind optional aber empfohlen`
}

// Snippets basierend auf dem Default-Template
export const getSnippets = (): EditorSnippet[] => {
  return [
    {
      label: 'cat',
      insertText: '#${1:Kategorie Name}\n(${2:Unterkategorie})\n',
      detail: 'Neue Kategorie',
      documentation:
        'Erstellt eine neue Kategorie mit optionaler Unterkategorie',
    },
    {
      label: 'item',
      insertText: '* ${1:Kink Name}\n? ${2:Beschreibung des Kinks}\n',
      detail: 'Neuer Kink-Eintrag',
      documentation: 'Erstellt einen neuen Kink-Eintrag mit Beschreibung',
    },
    {
      label: 'section',
      insertText:
        '#${1:Kategorie}\n(${2:Unterkategorie})\n* ${3:Kink 1}\n? ${4:Beschreibung 1}\n* ${5:Kink 2}\n? ${6:Beschreibung 2}\n',
      detail: 'Kategorie mit Kinks',
      documentation:
        'Erstellt eine vollständige Sektion mit Kategorie und mehreren Kinks',
    },
    {
      label: 'template',
      insertText: getDefaultTemplate(),
      detail: 'Standard-Template',
      documentation: 'Fügt das vollständige Standard-Template ein',
    },
    {
      label: 'basic-section',
      insertText:
        "#Basics\n(General)\n* I enjoy working with cisgender people\n? I feel comfortable and positive about engaging in hypnosis with cisgender individuals.\n* I enjoy working with trans people\n? I am open to and enjoy hypnotic experiences with transgender people, respecting their identities.\n* Gender doesn't matter to me\n? The gender of my hypnosis partner is not important to me; I focus on the experience itself.\n",
      detail: 'Basics Sektion',
      documentation:
        'Erstellt eine Basics-Sektion basierend auf dem Standard-Template',
    },
    {
      label: 'safety-section',
      insertText:
        '#Safety and consent\n(General)\n* Trust\n? Trust is the foundation of any hypnotic interaction; I need to feel safe with my partner.\n* Clear consent before going under\n? I require explicit, enthusiastic consent before any hypnotic activity begins.\n* Post talk/Aftercare\n? I value time after trance to discuss the experience, decompress, and ensure well-being.\n',
      detail: 'Safety Sektion',
      documentation: 'Erstellt eine Safety and Consent-Sektion',
    },
    {
      label: 'types-section',
      insertText:
        '#Types Of Hypnosis\n(General)\n* Erotic hypnosis\n? Hypnosis with a focus on sexual arousal, pleasure, or erotic scenarios.\n* Recreational hypnosis\n? Hypnosis for fun, relaxation, or entertainment, without therapeutic or sexual intent.\n* Therapeutic hypnosis\n? Hypnosis used for healing, self-improvement, or addressing psychological issues.\n',
      detail: 'Types Sektion',
      documentation: 'Erstellt eine Types of Hypnosis-Sektion',
    },
  ]
}

// Formatierungsfunktion für den Editor-Inhalt
export const formatKinkListText = (text: string): string => {
  const lines = text.split('\n')
  const formattedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (trimmedLine === '') {
      // Leere Zeilen beibehalten
      formattedLines.push('')
    } else if (trimmedLine.startsWith('#')) {
      // Kategorien: Sorge für Leerzeile davor (außer am Anfang)
      if (
        formattedLines.length > 0 &&
        formattedLines[formattedLines.length - 1] !== ''
      ) {
        formattedLines.push('')
      }
      formattedLines.push(trimmedLine)
    } else if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      // Unterkategorien: Direkt nach Kategorie
      formattedLines.push(trimmedLine)
    } else if (trimmedLine.match(/^[*+\-?]\s/)) {
      // Kink-Einträge: Standard-Einrückung
      formattedLines.push(trimmedLine)
    } else if (trimmedLine.startsWith('?')) {
      // Beschreibungen: Standard-Einrückung
      formattedLines.push(trimmedLine)
    } else {
      // Andere Zeilen: Unverändert
      formattedLines.push(trimmedLine)
    }
  }

  return formattedLines.join('\n')
}

// Validierungsfunktion
export const validateKinkListText = (
  text: string
): { errors: string[]; warnings: string[] } => {
  const errors: string[] = []
  const warnings: string[] = []
  const lines = text.split('\n')

  let currentCategory = ''
  let hasAnyContent = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    if (line === '') continue

    hasAnyContent = true

    if (line.startsWith('#')) {
      currentCategory = line
      // Prüfe auf gültigen Kategorienamen
      if (line.length <= 1) {
        errors.push(`Zeile ${lineNumber}: Kategorie muss einen Namen haben`)
      }
    } else if (line.startsWith('(') && line.endsWith(')')) {
      // Unterkategorie - sollte nach einer Kategorie kommen
      if (!currentCategory) {
        warnings.push(
          `Zeile ${lineNumber}: Unterkategorie ohne vorherige Kategorie`
        )
      }
    } else if (line.match(/^[*+\-?]\s/)) {
      // Kink-Eintrag
      if (!currentCategory) {
        warnings.push(`Zeile ${lineNumber}: Kink-Eintrag ohne Kategorie`)
      }
      if (line.length <= 2) {
        warnings.push(
          `Zeile ${lineNumber}: Kink-Eintrag sollte einen Namen haben`
        )
      }
    } else if (line.startsWith('?')) {
      // Beschreibung
      if (line.length <= 1) {
        warnings.push(`Zeile ${lineNumber}: Leere Beschreibung`)
      }
    } else {
      warnings.push(
        `Zeile ${lineNumber}: Unbekanntes Format - "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`
      )
    }
  }

  if (!hasAnyContent) {
    warnings.push('Dokument ist leer')
  }

  return { errors, warnings }
}

// Funktion zum Abrufen des Standard-Templates
export const getDefaultTemplate = (): string => {
  return defaultKinksText
}

// Funktion zum Extrahieren von Kategorien aus dem Standard-Template
export const getDefaultCategories = (): string[] => {
  const lines = defaultKinksText.split('\n')
  const categories: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('#')) {
      categories.push(trimmedLine.substring(1).trim())
    }
  }

  return categories
}

// Funktion zum Extrahieren von Kink-Beispielen aus bestimmten Kategorien
export const getKinkExamples = (category?: string): string[] => {
  const lines = defaultKinksText.split('\n')
  const examples: string[] = []
  let inTargetCategory = !category // Wenn keine Kategorie angegeben, alle sammeln

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('#')) {
      const categoryName = trimmedLine.substring(1).trim().toLowerCase()
      inTargetCategory =
        !category || categoryName.includes(category.toLowerCase())
    } else if (inTargetCategory && trimmedLine.match(/^[*+\-?]\s/)) {
      const kinkName = trimmedLine.substring(2).trim()
      if (kinkName && examples.length < 10) {
        // Maximal 10 Beispiele
        examples.push(kinkName)
      }
    }
  }

  return examples
}
