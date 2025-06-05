import { StreamLanguage } from '@codemirror/language'

// Simple stream-based parser for Kinklist syntax
const kinklistStreamParser = {
  name: 'kinklist',

  startState() {
    return { inLine: false }
  },

  token(stream: any, state: any) {
    // Skip whitespace at start of line
    if (stream.sol()) {
      stream.eatSpace()
    }

    // Categories: lines starting with #
    if (stream.sol() && stream.match(/^#/)) {
      stream.skipToEnd()
      return 'heading'
    }

    // Fields: lines starting with ( and ending with )
    if (stream.sol() && stream.match(/^\(/)) {
      stream.skipToEnd()
      return 'emphasis'
    }

    // Comments: lines starting with //
    if (stream.sol() && stream.match(/^\/\//)) {
      stream.skipToEnd()
      return 'comment'
    }

    // Kink entries: lines starting with *
    if (stream.sol() && stream.match(/^\*/)) {
      stream.skipToEnd()
      return 'strong'
    }

    // Descriptions: lines starting with ?
    if (stream.sol() && stream.match(/^\?/)) {
      stream.skipToEnd()
      return 'quote'
    }

    // Default: consume everything else
    stream.skipToEnd()
    return null
  }
}

export const kinklistLanguage = StreamLanguage.define(kinklistStreamParser)
