import { StreamLanguage } from '@codemirror/language'
import { CompletionContext } from '@codemirror/autocomplete'
import {
  getSnippets,
  getDefaultCategories,
  getKinkExamples,
} from './EditorUtils'

// Erweiterte Zustände für den Parser
interface KinklistState {
  inLine: boolean
  inCategory: boolean
  inSubCategory: boolean
  inKink: boolean
  inDescription: boolean
  inComment: boolean
  lastCategory: string
}

// Erweiterte Token-Definitionen
export const KINKLIST_TOKENS = {
  CATEGORY: 'heading',
  SUBCATEGORY: 'emphasis',
  KINK: 'strong',
  KINK_POSITIVE: 'positive',
  KINK_NEGATIVE: 'negative',
  KINK_NEUTRAL: 'neutral',
  KINK_QUESTION: 'question',
  DESCRIPTION: 'quote',
  COMMENT: 'comment',
  KEYWORD: 'keyword',
  META: 'meta',
  DEFAULT: 'content',
}

// Erweiterte Sprachdefinition mit verbessertem Token-Handling
const kinklistStreamParser = {
  name: 'kinklist',

  startState(): KinklistState {
    return {
      inLine: false,
      inCategory: false,
      inSubCategory: false,
      inKink: false,
      inDescription: false,
      inComment: false,
      lastCategory: '',
    }
  },

  token(stream: any, state: KinklistState) {
    // Zeilenstart zurücksetzen
    if (stream.sol()) {
      state.inLine = false
      state.inCategory = false
      state.inSubCategory = false
      state.inKink = false
      state.inDescription = false
      state.inComment = false
      stream.eatSpace()
    }

    // Kommentare haben höchste Priorität
    if (stream.sol() && stream.match(/^\/\//)) {
      state.inComment = true
      stream.skipToEnd()
      return KINKLIST_TOKENS.COMMENT
    }

    // Kategorien: Zeilen die mit # beginnen
    if (stream.sol() && stream.match(/^#/)) {
      state.inCategory = true
      state.lastCategory = stream.string.substring(1).trim()
      stream.skipToEnd()
      return KINKLIST_TOKENS.CATEGORY
    }

    // Unterkategorien: Zeilen die mit ( beginnen und mit ) enden
    if (stream.sol() && stream.match(/^\(/)) {
      state.inSubCategory = true
      // Prüfe, ob die Zeile mit ) endet
      if (stream.string.endsWith(')')) {
        stream.skipToEnd()
        return KINKLIST_TOKENS.SUBCATEGORY
      }

      // Sonst analysiere zeichenweise
      while (!stream.eol()) {
        if (stream.eat(')')) {
          break
        }
        stream.next()
      }
      return KINKLIST_TOKENS.SUBCATEGORY
    }

    // Kinks mit verschiedenen Status-Symbolen
    if (stream.sol()) {
      if (stream.match(/^\+/)) {
        state.inKink = true
        stream.skipToEnd()
        return KINKLIST_TOKENS.KINK_POSITIVE
      } else if (stream.match(/^-/)) {
        state.inKink = true
        stream.skipToEnd()
        return KINKLIST_TOKENS.KINK_NEGATIVE
      } else if (stream.match(/^\*/)) {
        state.inKink = true
        stream.skipToEnd()
        return KINKLIST_TOKENS.KINK_NEUTRAL
      } else if (stream.match(/^\?/)) {
        // Kontextabhängig: Wenn nach einem Kink, dann Beschreibung
        if (stream.eatSpace()) {
          state.inDescription = true
          stream.skipToEnd()
          return KINKLIST_TOKENS.DESCRIPTION
        }
        // Sonst als Kink mit Fragezeichen-Status
        state.inKink = true
        stream.skipToEnd()
        return KINKLIST_TOKENS.KINK_QUESTION
      }
    }

    // Schlüsselwörter in Kink-Definitionen
    if (state.inKink && stream.match(/\b(must|never|always|sometimes)\b/i)) {
      return KINKLIST_TOKENS.KEYWORD
    }

    // Metadaten in Kink-Definitionen (wie Tags in [...])
    if (state.inKink && stream.match(/\[.*?\]/)) {
      return KINKLIST_TOKENS.META
    }

    // Standard: Rest der Zeile konsumieren
    stream.skipToEnd()
    return KINKLIST_TOKENS.DEFAULT
  },
}

export const kinklistLanguage = StreamLanguage.define(kinklistStreamParser)

// Autovervollständigung für Kinklist
export function kinklistCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/)
  if (!word || word.from === word.to) return null

  const snippets = getSnippets()
  const categories = getDefaultCategories()
  const kinkExamples = getKinkExamples()

  // Vorschlagsliste erstellen
  const suggestions = [
    // Snippets
    ...snippets.map((snippet) => ({
      label: snippet.label,
      detail: snippet.detail,
      info: snippet.documentation,
      type: 'snippet',
      apply: snippet.insertText,
    })),

    // Kategorien
    ...categories.map((cat) => ({
      label: `#${cat}`,
      detail: 'Kategorie',
      info: `Fügt die Kategorie "${cat}" ein`,
      type: 'category',
    })),

    // Kink-Beispiele
    ...kinkExamples.map((kink) => ({
      label: `* ${kink}`,
      detail: 'Kink',
      info: `Fügt den Kink "${kink}" ein`,
      type: 'kink',
    })),
  ]

  return {
    from: word.from,
    options: suggestions.filter((s) =>
      s.label.toLowerCase().includes(word.text.toLowerCase())
    ),
  }
}
