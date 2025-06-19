import i18n from '../../i18n'
import {
  getEnhancedKinkTemplate,
  getKinkTemplate,
} from '../../utils/kinkTemplates'

// Interface für Snippets
export interface EditorSnippet {
  label: string
  insertText: string
  detail: string
  documentation: string
}

// Neue Funktionen für einfüllbare Blöcke
export interface PasteableBlock {
  id: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
}

// Hilfstext für den Editor
export const getHelpText = (): string => {
  return i18n.t('editor.content.helpText')
}

// Snippets basierend auf dem Default-Template
export const getSnippets = (): EditorSnippet[] => {
  return [
    {
      label: i18n.t('editor.content.snippets.cat.label'),
      insertText: '#${1:Kategorie Name}\n(${2:General})\n',
      detail: i18n.t('editor.content.snippets.cat.detail'),
      documentation: i18n.t('editor.content.snippets.cat.documentation'),
    },
    {
      label: i18n.t('editor.content.snippets.item.label'),
      insertText: '* ${1:Kink Name}\n? ${2:Beschreibung des Kinks}\n',
      detail: i18n.t('editor.content.snippets.item.detail'),
      documentation: i18n.t('editor.content.snippets.item.documentation'),
    },
    {
      label: i18n.t('editor.content.snippets.section.label'),
      insertText:
        '#${1:Kategorie}\n(${2:General})\n* ${3:Kink 1}\n? ${4:Beschreibung 1}\n* ${5:Kink 2}\n? ${6:Beschreibung 2}\n',
      detail: i18n.t('editor.content.snippets.section.detail'),
      documentation: i18n.t('editor.content.snippets.section.documentation'),
    },
    {
      label: i18n.t('editor.content.snippets.template.label'),
      insertText: getDefaultTemplate(),
      detail: i18n.t('editor.content.snippets.template.detail'),
      documentation: i18n.t('editor.content.snippets.template.documentation'),
    },
    {
      label: i18n.t('editor.content.snippets.basicSection.label'),
      insertText:
        "#Basics\n(General)\n* I enjoy working with cisgender people\n? I feel comfortable and positive about engaging in hypnosis with cisgender individuals.\n* I enjoy working with trans people\n? I am open to and enjoy hypnotic experiences with transgender people, respecting their identities.\n* Gender doesn't matter to me\n? The gender of my hypnosis partner is not important to me; I focus on the experience itself.\n",
      detail: i18n.t('editor.content.snippets.basicSection.detail'),
      documentation: i18n.t(
        'editor.content.snippets.basicSection.documentation'
      ),
    },
    {
      label: i18n.t('editor.content.snippets.safetySection.label'),
      insertText:
        "#Safety and consent\n(General)\n* Trust\n? Trust is the foundation of any hypnotic interaction; I need to feel safe with my partner.\n* Unknown play partner\n? I may feel uneasy or require extra caution when engaging with someone I don't know well.\n* A lot of safety talk / triggers\n? I prefer thorough discussions about boundaries, triggers, and safety before starting.\n",
      detail: i18n.t('editor.content.snippets.safetySection.detail'),
      documentation: i18n.t(
        'editor.content.snippets.safetySection.documentation'
      ),
    },
    {
      label: i18n.t('editor.content.snippets.comment.label'),
      insertText: '// ${1:Kommentar}\n',
      detail: i18n.t('editor.content.snippets.comment.detail'),
      documentation: i18n.t('editor.content.snippets.comment.documentation'),
    },
    {
      label: i18n.t('editor.content.snippets.multilingualCat.label'),
      insertText:
        '#${1:Category Name}\n+ [DE] #${2:Deutscher Name}\n+ [SV] #${3:Svenska namn}\n(${4:General})\n+ [DE] (${5:Allgemein})\n+ [SV] (${6:Allmänt})\n',
      detail: i18n.t('editor.content.snippets.multilingualCat.detail'),
      documentation: i18n.t(
        'editor.content.snippets.multilingualCat.documentation'
      ),
    },
    {
      label: i18n.t('editor.content.snippets.multilingualItem.label'),
      insertText:
        '* ${1:Kink Name}\n+ [DE] * ${2:Deutscher Kink Name}\n+ [SV] * ${3:Svenska kink namn}\n? ${4:Description}\n+ [DE] ? ${5:Deutsche Beschreibung}\n+ [SV] ? ${6:Svenska beskrivning}\n',
      detail: i18n.t('editor.content.snippets.multilingualItem.detail'),
      documentation: i18n.t(
        'editor.content.snippets.multilingualItem.documentation'
      ),
    },
    {
      label: i18n.t('editor.content.snippets.translationLine.label'),
      insertText: '+ [${1:DE}] ${2:übersetzter Inhalt}\n',
      detail: i18n.t('editor.content.snippets.translationLine.detail'),
      documentation: i18n.t(
        'editor.content.snippets.translationLine.documentation'
      ),
    },
    {
      label: i18n.t('editor.content.snippets.enhancedTemplate.label'),
      insertText: getEnhancedDefaultTemplate(),
      detail: i18n.t('editor.content.snippets.enhancedTemplate.detail'),
      documentation: i18n.t(
        'editor.content.snippets.enhancedTemplate.documentation'
      ),
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
      // Feldbezeichnungen: Direkt nach Kategorie
      formattedLines.push(trimmedLine)
    } else if (trimmedLine.startsWith('*')) {
      // Kink-Einträge: Standard-Einrückung
      formattedLines.push(trimmedLine)
    } else if (trimmedLine.startsWith('?')) {
      // Beschreibungen: Standard-Einrückung
      formattedLines.push(trimmedLine)
    } else if (trimmedLine.startsWith('//')) {
      // Kommentare: Standard-Einrückung
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
      // Feldbezeichnung - sollte nach einer Kategorie kommen
      if (!currentCategory) {
        warnings.push(
          `Zeile ${lineNumber}: Feldbezeichnung ohne vorherige Kategorie`
        )
      }
    } else if (line.startsWith('*')) {
      // Kink-Eintrag
      if (!currentCategory) {
        warnings.push(`Zeile ${lineNumber}: Kink-Eintrag ohne Kategorie`)
      }
      if (line.length <= 2) {
        warnings.push(
          `Zeile ${lineNumber}: Kink-Eintrag sollte einen Namen haben`
        )
      }
    } else if (line.startsWith('+ [') && line.includes(']')) {
      // Multilinguale Übersetzungszeile
      const match = line.match(/^\+\s*\[([A-Z]{2})\]\s*(.*)$/)
      if (!match) {
        errors.push(
          `Zeile ${lineNumber}: Ungültiges Format für Übersetzungszeile. Format: + [LANG] Inhalt`
        )
      } else {
        const [, langCode, content] = match
        if (langCode.length !== 2) {
          errors.push(
            `Zeile ${lineNumber}: Sprachcode muss genau 2 Zeichen haben (z.B. DE, EN, SV)`
          )
        }
        if (!content.trim()) {
          warnings.push(`Zeile ${lineNumber}: Übersetzungszeile ist leer`)
        }
      }
    } else if (line.startsWith('?')) {
      // Beschreibung
      if (line.length <= 1) {
        warnings.push(`Zeile ${lineNumber}: Leere Beschreibung`)
      }
    } else if (line.startsWith('//')) {
      // Kommentar - immer gültig
      // Keine Validierung notwendig
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
export const getDefaultTemplate = (language: string = 'en'): string => {
  return getKinkTemplate(language)
}

// Funktion zum Extrahieren von Kategorien aus dem Standard-Template
export const getDefaultCategories = (language: string = 'en'): string[] => {
  const lines = getKinkTemplate(language).split('\n')
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
export const getKinkExamples = (
  category?: string,
  language: string = 'en'
): string[] => {
  const templateText = getKinkTemplate(language)
  const lines = templateText.split('\n')
  const examples: string[] = []
  let inTargetCategory = !category // Wenn keine Kategorie angegeben, alle sammeln

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('#')) {
      const categoryName = trimmedLine.substring(1).trim().toLowerCase()
      inTargetCategory =
        !category || categoryName.includes(category.toLowerCase())
    } else if (inTargetCategory && trimmedLine.startsWith('*')) {
      const kinkName = trimmedLine.substring(1).trim()
      if (kinkName && examples.length < 10) {
        // Maximal 10 Beispiele
        examples.push(kinkName)
      }
    }
  }

  return examples
}

// Vordefinierte einfüllbare Blöcke
export const getPasteableBlocks = (): PasteableBlock[] => {
  return [
    {
      id: 'basic-category',
      name: 'Grundlegende Kategorie',
      description: 'Eine einfache Kategorie mit Feldbezeichnung',
      content: '#Kategorie Name\n(General)\n',
      category: 'Struktur',
      tags: ['kategorie', 'basic'],
    },
    {
      id: 'kink-with-description',
      name: 'Kink mit Beschreibung',
      description: 'Ein Kink-Eintrag mit ausführlicher Beschreibung',
      content:
        '* Kink Name\n? Hier steht eine detaillierte Beschreibung des Kinks.\n',
      category: 'Kink',
      tags: ['kink', 'description'],
    },
    {
      id: 'full-category-block',
      name: 'Vollständige Kategorie',
      description: 'Eine Kategorie mit mehreren Kinks und Beschreibungen',
      content: `#Kategorie Name
(General)
* Erster Kink
? Beschreibung des ersten Kinks
* Zweiter Kink
? Beschreibung des zweiten Kinks
* Dritter Kink
? Beschreibung des dritten Kinks
`,
      category: 'Vorlagen',
      tags: ['template', 'full'],
    },
    {
      id: 'safety-category',
      name: 'Sicherheit & Einverständnis',
      description: 'Eine Kategorie für Sicherheitsaspekte',
      content: `#Safety and consent
(General)
* Trust
? Trust is the foundation of any hypnotic interaction; I need to feel safe with my partner.
* Unknown play partner
? I may feel uneasy or require extra caution when engaging with someone I don't know well.
* A lot of safety talk / triggers
? I prefer thorough discussions about boundaries, triggers, and safety before starting.
`,
      category: 'Vorlagen',
      tags: ['safety', 'consent'],
    },
    {
      id: 'comment-block',
      name: 'Kommentarblock',
      description: 'Ein Block mit Kommentaren für Notizen',
      content: `// ------------------------------------
// NOTIZEN:
// - Punkt 1
// - Punkt 2
// - Punkt 3
// ------------------------------------
`,
      category: 'Hilfe',
      tags: ['comment', 'notes'],
    },
    {
      id: 'basics-template',
      name: 'Basics Template',
      description: 'Standard Basics-Sektion aus dem Default-Template',
      content: `#Basics
(General)
* I enjoy working with cisgender people
? I feel comfortable and positive about engaging in hypnosis with cisgender individuals.
* I enjoy working with trans people
? I am open to and enjoy hypnotic experiences with transgender people, respecting their identities.
* Gender doesn't matter to me
? The gender of my hypnosis partner is not important to me; I focus on the experience itself.
`,
      category: 'Vorlagen',
      tags: ['basics', 'template'],
    },
  ]
}

// Hilfsfunktion zum Filtern von Blöcken nach Kategorie
export const getBlocksByCategory = (category: string): PasteableBlock[] => {
  return getPasteableBlocks().filter(
    (block) => block.category.toLowerCase() === category.toLowerCase()
  )
}

// Hilfsfunktion zum Filtern von Blöcken nach Tags
export const getBlocksByTags = (tags: string[]): PasteableBlock[] => {
  return getPasteableBlocks().filter((block) =>
    block.tags.some((tag) =>
      tags.some((t) => tag.toLowerCase().includes(t.toLowerCase()))
    )
  )
}

// Hilfsfunktion zum Suchen von Blöcken nach Suchbegriff
export const searchBlocks = (query: string): PasteableBlock[] => {
  const lowerQuery = query.toLowerCase()
  return getPasteableBlocks().filter(
    (block) =>
      block.name.toLowerCase().includes(lowerQuery) ||
      block.description.toLowerCase().includes(lowerQuery) ||
      block.category.toLowerCase().includes(lowerQuery) ||
      block.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

// Erweiterte Hilfetexte
export const getDetailedHelpText = (): { [key: string]: string } => {
  return {
    syntax: i18n.t('editor.content.detailedHelp.syntax'),
    quickStart: i18n.t('editor.content.detailedHelp.quickStart'),
    keyboardShortcuts: i18n.t('editor.content.detailedHelp.keyboardShortcuts'),
    advanced: i18n.t('editor.content.detailedHelp.advanced'),
  }
}

// Funktion zum Abrufen des Enhanced-Templates
export const getEnhancedDefaultTemplate = (): string => {
  return getEnhancedKinkTemplate()
}

// Hilfsfunktion um zu prüfen, ob Text multilinguale Syntax enthält
export const hasMultilingualSyntax = (text: string): boolean => {
  const lines = text.split('\n')
  return lines.some((line) => /^\+\s*\[[A-Z]{2}\]\s*/.test(line.trim()))
}
