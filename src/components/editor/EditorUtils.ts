import { getKinkTemplate } from '../../utils/kinkTemplates'

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
  return `Kinklist-Editor Hilfe:

SYNTAX (NUR diese Präfixe sind gültig):
# Kategorie Name - Definiert eine neue Kategorie (z.B. #Basics)
(Feldbezeichnung) - Optionales Feld nach #-Zeile (z.B. (General))
* Kink Name - Definiert einen Kink-Eintrag
? Beschreibung - Beschreibung des vorherigen Kinks
// Kommentar - Kommentarzeile

BEISPIEL (Standard-Schema):
#Basics
(General)
* I enjoy working with cisgender people
? I feel comfortable and positive about engaging in hypnosis with cisgender individuals.
* I drop very easily
? I enter trance states quickly and with little resistance, often after minimal induction.

FARB-CODING:
# Kategorien - Grün und fett
() Felder - Blau und kursiv
* Kinks - Orange/gelb und fett
? Beschreibungen - Braun/grau und kursiv
// Kommentare - Grau und kursiv

TASTENKÜRZEL (Monaco Editor):
Strg+Space - IntelliSense/Autocomplete
Strg+Shift+I - Formatieren
Strg+F - Suchen
Strg+H - Suchen und Ersetzen
Strg+G - Zu Zeile springen
F1 - Befehlspalette
Alt+Z - Zeilenumbruch aktivieren/deaktivieren

SNIPPETS:
- cat: Neue Kategorie
- item: Neuer Kink-Eintrag
- section: Kategorie mit Kinks
- template: Vollständiges Standard-Template

TIPPS:
- Verwenden Sie leere Zeilen zur besseren Lesbarkeit
- Kategorien sollten mit # beginnen
- Jeder Kink sollte eine Beschreibung mit ? haben
- Nur die oben gezeigten Präfixe sind gültig`
}

// Snippets basierend auf dem Default-Template
export const getSnippets = (): EditorSnippet[] => {
  return [
    {
      label: 'cat',
      insertText: '#${1:Kategorie Name}\n(${2:General})\n',
      detail: 'Neue Kategorie',
      documentation:
        'Erstellt eine neue Kategorie mit optionaler Feldbezeichnung',
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
        '#${1:Kategorie}\n(${2:General})\n* ${3:Kink 1}\n? ${4:Beschreibung 1}\n* ${5:Kink 2}\n? ${6:Beschreibung 2}\n',
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
        "#Safety and consent\n(General)\n* Trust\n? Trust is the foundation of any hypnotic interaction; I need to feel safe with my partner.\n* Unknown play partner\n? I may feel uneasy or require extra caution when engaging with someone I don't know well.\n* A lot of safety talk / triggers\n? I prefer thorough discussions about boundaries, triggers, and safety before starting.\n",
      detail: 'Safety Sektion',
      documentation: 'Erstellt eine Safety and Consent-Sektion',
    },
    {
      label: 'comment',
      insertText: '// ${1:Kommentar}\n',
      detail: 'Kommentar',
      documentation: 'Fügt eine Kommentarzeile hinzu',
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
    syntax: `Kinklist Syntax Übersicht (NUR diese Präfixe sind gültig):

# Kategorie Name          - Definiert eine neue Kategorie (grün, fett)
(Feldbezeichnung)         - Optionale Feldbezeichnung nach #-Zeile (blau, kursiv)
* Kink Name               - Kink-Eintrag (orange/gelb, fett)
? Beschreibung            - Beschreibung des vorherigen Kinks (braun/grau, kursiv)
// Kommentar              - Kommentarzeile (grau, kursiv)

BEISPIEL (Standard-Schema):
#Basics
(General)
* I enjoy working with cisgender people
? I feel comfortable and positive about engaging in hypnosis with cisgender individuals.
* I drop very easily
? I enter trance states quickly and with little resistance, often after minimal induction.

// Kommentar für Notizen

WICHTIG: Nur die oben gezeigten 5 Präfixe (#, (), *, ?, //) sind gültig!
`,
    quickStart: `Schnellstart:
1. Beginnen Sie mit einer Kategorie (#Basics)
2. Fügen Sie optional eine Feldbezeichnung hinzu ((General))
3. Listen Sie Kinks mit * auf (* Trust)
4. Fügen Sie Beschreibungen mit ? hinzu (? Trust is the foundation...)
5. Nutzen Sie // für Kommentare (// This is a comment)
6. Nutzen Sie die Snippets für schnelleres Arbeiten:
   - 'cat' für neue Kategorie
   - 'item' für neuen Kink
   - 'section' für vollständige Sektion
   - 'template' für das Standard-Template
7. Formatieren Sie Ihren Code mit Strg+Shift+I
8. Fügen Sie Blöcke ein, um schnell komplexe Inhalte zu erstellen
`,
    keyboardShortcuts: `Tastenkürzel (Monaco Editor):
Strg+Space         - IntelliSense/Autocomplete anzeigen
Strg+Shift+I       - Code formatieren (wichtig!)
Strg+F             - Suchen
Strg+H             - Suchen und Ersetzen
Strg+G             - Zu Zeile springen
Strg+D             - Nächstes Vorkommen auswählen
Strg+L             - Zeile auswählen
Strg+/             - Zeile kommentieren/auskommentieren
Alt+Z              - Zeilenumbruch ein/ausschalten
F1                 - Befehlspalette öffnen
Strg+Enter         - Änderungen übernehmen und Editor schließen
`,
    advanced: `Erweiterte Funktionen:
- Snippets: Verwenden Sie die integrierten Code-Snippets für schnellere Eingabe
- IntelliSense: Strg+Space zeigt Vorschläge basierend auf dem Kontext
- Formatierung: Strg+Shift+I formatiert das gesamte Dokument korrekt
- Validierung: Der Editor hebt Syntaxfehler automatisch hervor
- Standard-Template: Nutzen Sie das 'template' Snippet für das vollständige Standard-Schema
- Kommentare: Verwenden Sie // für Notizen und Strukturierung
- Nur gültige Syntax: Nur #, (), *, ?, // Präfixe werden unterstützt

Tipp: Schauen Sie sich das Standard-Template an, um die korrekte Syntax zu verstehen.
`,
  }
}
