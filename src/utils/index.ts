import i18n from '../i18n'
import { KinksData, LevelsData, Selection } from '../types'
import {
  EnhancedKinksData,
  getStableIdsFromOriginal,
  parseEnhancedKinksText,
  resolveEnhancedKinksData,
} from './multilingualTemplates'

export const strToClass = (str: string): string => {
  let className = ''
  str = str.toLowerCase()
  const validChars = 'abcdefghijklmnopqrstuvwxyz'
  let newWord = false

  for (let i = 0; i < str.length; i++) {
    const chr = str[i]
    if (validChars.indexOf(chr) >= 0) {
      if (newWord) {
        className += chr.toUpperCase()
      } else {
        className += chr
      }
      newWord = false
    } else {
      newWord = true
    }
  }

  return className
}

export const log = (val: number, base: number): number => {
  return Math.log(val) / Math.log(base)
}

export const parseKinksText = (
  text: string,
  _errorHandler: (msg: string) => void = (msg) => window.alert(msg)
): KinksData | null => {
  const newKinks: KinksData = {}
  const lines = text.replace(/\r/g, '').split('\n')

  let cat: (Partial<KinksData[string]> & { descriptions?: string[] }) | null =
    null
  let catName: string | null = null
  let lastKinkIdx: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.length) continue

    if (line[0] === '#') {
      if (
        catName &&
        cat &&
        Array.isArray(cat.fields) &&
        cat.fields.length > 0 &&
        Array.isArray(cat.kinks) &&
        cat.kinks.length > 0
      ) {
        newKinks[catName] = { ...cat, name: catName } as KinksData[string]
      }
      catName = line.substring(1).trim()
      cat = { kinks: [], descriptions: [] }
      lastKinkIdx = null
    }

    if (!catName) continue

    if (line[0] === '(') {
      if (cat) {
        cat.fields = line
          .substring(1, line.length - 1)
          .trim()
          .split(',')
          .map((field) => field.trim())
      }
    } else if (line[0] === '*') {
      const kink = line.substring(1).trim()
      if (cat && Array.isArray(cat.kinks) && Array.isArray(cat.descriptions)) {
        cat.kinks.push(kink)
        cat.descriptions.push('') // Platzhalter für Beschreibung
        lastKinkIdx = cat.kinks.length - 1
      }
    } else if (
      line[0] === '?' &&
      cat &&
      Array.isArray(cat.descriptions) &&
      lastKinkIdx !== null
    ) {
      // Beschreibung für den letzten Kink
      cat.descriptions[lastKinkIdx] = line.substring(1).trim()
    }
  }

  if (
    catName &&
    cat &&
    Array.isArray(cat.fields) &&
    cat.fields.length > 0 &&
    Array.isArray(cat.kinks) &&
    cat.kinks.length > 0
  ) {
    newKinks[catName] = { ...cat, name: catName } as KinksData[string]
  }

  return newKinks
}

export const kinksToText = (kinks: KinksData): string => {
  let kinksText = ''
  const kinkCats = Object.keys(kinks)

  for (let i = 0; i < kinkCats.length; i++) {
    const catName = kinkCats[i]
    const catFields = kinks[catName].fields
    const catKinks = kinks[catName].kinks
    const catDescriptions = kinks[catName].descriptions || []

    kinksText += '#' + catName + '\r\n'
    kinksText += '(' + catFields.join(', ') + ')\r\n'

    for (let j = 0; j < catKinks.length; j++) {
      kinksText += '* ' + catKinks[j] + '\r\n'
      if (catDescriptions[j] && catDescriptions[j].trim().length > 0) {
        kinksText += '? ' + catDescriptions[j].trim() + '\r\n'
      }
    }

    kinksText += '\r\n'
  }

  return kinksText
}

// Helper functions for URL hash encoding/decoding
const hashChars =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.=+*^!@'

const maxPow = (base: number, maxVal: number): number => {
  let maxPow = 1
  for (let pow = 1; Math.pow(base, pow) <= maxVal; pow++) {
    maxPow = pow
  }
  return maxPow
}

const prefix = (input: string, len: number, char: string): string => {
  let result = input
  while (result.length < len) {
    result = char + result
  }
  return result
}

export const encode = (base: number, input: number[]): string => {
  const hashBase = hashChars.length
  const outputPow = maxPow(hashBase, Number.MAX_SAFE_INTEGER)
  const inputPow = maxPow(base, Math.pow(hashBase, outputPow))

  let output = ''
  const numChunks = Math.ceil(input.length / inputPow)
  let inputIndex = 0

  for (let chunkId = 0; chunkId < numChunks; chunkId++) {
    let inputIntValue = 0
    for (let pow = 0; pow < inputPow; pow++) {
      const inputVal = input[inputIndex++]
      if (typeof inputVal === 'undefined') break
      const val = inputVal * Math.pow(base, pow)
      inputIntValue += val
    }

    let outputCharValue = ''
    while (inputIntValue > 0) {
      const maxPow = Math.floor(log(inputIntValue, hashBase))
      const powVal = Math.pow(hashBase, maxPow)
      const charInt = Math.floor(inputIntValue / powVal)
      const subtract = charInt * powVal
      const char = hashChars[charInt]
      outputCharValue += char
      inputIntValue -= subtract
    }

    const chunk = prefix(outputCharValue, outputPow, hashChars[0])
    output += chunk
  }

  return output
}

export const decode = (base: number, output: string): number[] => {
  const hashBase = hashChars.length
  const outputPow = maxPow(hashBase, Number.MAX_SAFE_INTEGER)

  const values: number[] = []
  const numChunks = Math.max(output.length / outputPow)

  for (let i = 0; i < numChunks; i++) {
    const chunk = output.substring(i * outputPow, (i + 1) * outputPow)
    const chunkValues = decodeChunk(base, chunk)

    for (let j = 0; j < chunkValues.length; j++) {
      values.push(chunkValues[j])
    }
  }

  return values
}

const decodeChunk = (base: number, chunk: string): number[] => {
  const hashBase = hashChars.length
  const outputPow = maxPow(hashBase, Number.MAX_SAFE_INTEGER)
  const inputPow = maxPow(base, Math.pow(hashBase, outputPow))

  let chunkInt = 0
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i]
    const charInt = hashChars.indexOf(char)
    const pow = chunk.length - 1 - i
    const intVal = Math.pow(hashBase, pow) * charInt
    chunkInt += intVal
  }

  const output: number[] = []
  for (let pow = inputPow - 1; pow >= 0; pow--) {
    const posBase = Math.floor(Math.pow(base, pow))
    const posVal = Math.floor(chunkInt / posBase)
    const subtract = posBase * posVal
    output.push(posVal)
    chunkInt -= subtract
  }

  output.reverse()
  return output
}

export const updateHash = (
  selection: Selection[],
  levels: LevelsData
): string => {
  if (selection.length === 0) {
    return ''
  }

  // New approach: Use ID-based encoding for both values and comments
  const selectionData: {
    [stableId: string]: {
      level: number
      comment?: string
    }
  } = {}
  const levelNames = Object.keys(levels)

  selection.forEach((item) => {
    // Generate stable key
    const stableKey =
      item.categoryId && item.kinkId && item.fieldId
        ? `${item.categoryId}-${item.kinkId}-${item.fieldId}`
        : `${item.category}-${item.kink}-${item.field}`

    // Only include non-default values or items with comments in hash to keep it compact
    const levelIndex = levelNames.indexOf(item.value)
    const finalIndex = levelIndex >= 0 ? levelIndex : 0
    const hasComment = item.comment && item.comment.trim().length > 0

    // Store if it has a non-default value OR has a comment
    if (finalIndex > 0 || hasComment) {
      const data: { level: number; comment?: string } = { level: finalIndex }
      if (hasComment) {
        data.comment = item.comment!.trim()
      }
      selectionData[stableKey] = data
    }
  })

  // Create a compact JSON representation for non-default values
  const compactData = JSON.stringify(selectionData)

  // Encode using base64 to make it URL-safe
  const hash = btoa(encodeURIComponent(compactData))

  window.location.hash = hash
  return hash
}

export const parseHash = (
  levels: LevelsData,
  kinks: KinksData,
  enhancedKinks?: EnhancedKinksData | null
): Selection[] | null => {
  const fullHash = window.location.hash.substring(1)

  if (fullHash.length < 10) {
    return null
  }

  try {
    // Decode the new ID-based hash format
    const decodedData = decodeURIComponent(atob(fullHash))
    const selectionData = JSON.parse(decodedData) as {
      [stableId: string]: { level: number; comment?: string } | number
    }

    // Use getAllKinksEnhanced to get the current kink structure
    const allKinks = getAllKinksEnhanced(kinks, levels, enhancedKinks)

    const updatedSelection: Selection[] = []

    // Map the stored selections back to the current kink structure
    const levelNames = Object.keys(levels)

    allKinks.forEach((kink) => {
      const stableKey =
        kink.categoryId && kink.kinkId && kink.fieldId
          ? `${kink.categoryId}-${kink.kinkId}-${kink.fieldId}`
          : `${kink.category}-${kink.kink}-${kink.field}`

      // Check if we have a stored value for this kink
      const storedData = selectionData[stableKey]
      let value = Object.keys(levels)[0] // Default value
      let comment: string | undefined = undefined

      if (storedData !== undefined) {
        // Handle both old format (number) and new format (object)
        if (typeof storedData === 'number') {
          // Old format: just the level index
          if (storedData < levelNames.length) {
            value = levelNames[storedData]
          }
        } else {
          // New format: object with level and comment
          if (storedData.level < levelNames.length) {
            value = levelNames[storedData.level]
          }
          comment = storedData.comment
        }
      }

      updatedSelection.push({
        ...kink,
        value,
        comment,
      })
    })

    return updatedSelection
  } catch (error) {
    console.error('parseHash: Error parsing new format:', error)

    // Fallback to old format if new format fails
    return parseHashLegacy(levels, kinks, enhancedKinks, fullHash)
  }
}

// Legacy hash parsing function for backward compatibility
function parseHashLegacy(
  levels: LevelsData,
  kinks: KinksData,
  enhancedKinks: EnhancedKinksData | null | undefined,
  fullHash: string
): Selection[] | null {
  // Trenne die Kommentare von den Auswahlen
  const parts = fullHash.split('|')
  const hash = parts[0]
  let comments: string[] = []

  // Dekodiere die Kommentare, falls vorhanden
  if (parts.length > 1) {
    try {
      const decodedComments = decodeURIComponent(atob(parts[1]))
      comments = JSON.parse(decodedComments)
    } catch (e) {
      console.error(i18n.t('utils.commentDecodeError'), e)
      comments = []
    }
  }

  const levelCount = Object.keys(levels).length
  const levelValues = decode(levelCount, hash)

  // Use getAllKinksEnhanced to ensure proper stable ID handling
  const allKinks = getAllKinksEnhanced(kinks, levels, enhancedKinks)
  const updatedSelection: Selection[] = []

  // IMPORTANT: Only process up to the minimum of available values and kinks
  const maxItems = Math.min(levelValues.length, allKinks.length)

  for (let i = 0; i < maxItems; i++) {
    const levelIndex = levelValues[i]
    const levelNames = Object.keys(levels)
    const levelName = levelNames[levelIndex] || levelNames[0]
    const baseSelection = allKinks[i]

    updatedSelection.push({
      ...baseSelection,
      value: levelName,
      comment: comments[i] || undefined,
      categoryId: baseSelection.categoryId,
      kinkId: baseSelection.kinkId,
      fieldId: baseSelection.fieldId,
    })
  }

  // If there are more kinks than hash values, add them with default values
  if (allKinks.length > levelValues.length) {
    for (let i = levelValues.length; i < allKinks.length; i++) {
      const baseSelection = allKinks[i]
      updatedSelection.push({
        ...baseSelection,
        value: Object.keys(levels)[0],
        comment: undefined,
        categoryId: baseSelection.categoryId,
        kinkId: baseSelection.kinkId,
        fieldId: baseSelection.fieldId,
      })
    }
  }

  return updatedSelection
}

export const getAllKinks = (
  kinks: KinksData,
  levels: LevelsData,
  existingSelection: Selection[] = []
): Selection[] => {
  const list: Selection[] = []
  const selectionMap = new Map<string, { value: string; comment?: string }>()

  // Create a map of existing selections using stable IDs when available, fallback to names
  existingSelection.forEach((item) => {
    const stableKey =
      item.categoryId && item.kinkId && item.fieldId
        ? `${item.categoryId}-${item.kinkId}-${item.fieldId}`
        : `${item.category}-${item.kink}-${item.field}`
    selectionMap.set(stableKey, { value: item.value, comment: item.comment })
  })

  const categories = Object.keys(kinks)
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    const categoryId = strToClass(category) // Use normalized category name as stable ID
    const fields = kinks[category].fields
    const kinkArr = kinks[category].kinks

    for (let j = 0; j < fields.length; j++) {
      const field = fields[j]
      const fieldId = strToClass(field) // Use normalized field name as stable ID
      for (let k = 0; k < kinkArr.length; k++) {
        const kink = kinkArr[k]
        const kinkId = strToClass(kink) // Use normalized kink name as stable ID

        // Try stable key first, then fallback to current names
        const stableKey = `${categoryId}-${kinkId}-${fieldId}`
        const fallbackKey = `${category}-${kink}-${field}`

        const existingData =
          selectionMap.get(stableKey) || selectionMap.get(fallbackKey)
        const value = existingData?.value || Object.keys(levels)[0]

        const obj: Selection = {
          category,
          kink,
          field,
          value,
          showField: fields.length >= 2,
          comment: existingData?.comment,
          // Add stable IDs for future language switches
          categoryId,
          kinkId,
          fieldId,
        }

        list.push(obj)
      }
    }
  }

  return list
}

// Enhanced version of getAllKinks that supports stable IDs for multilingual content
export const getAllKinksEnhanced = (
  kinks: KinksData,
  levels: LevelsData,
  enhancedKinks: EnhancedKinksData | null = null,
  existingSelection: Selection[] = []
): Selection[] => {
  const list: Selection[] = []
  const selectionMap = new Map<string, { value: string; comment?: string }>()

  // Create a map of existing selections using stable IDs when available, fallback to names
  existingSelection.forEach((item) => {
    const stableKey =
      item.categoryId && item.kinkId && item.fieldId
        ? `${item.categoryId}-${item.kinkId}-${item.fieldId}`
        : `${item.category}-${item.kink}-${item.field}`

    selectionMap.set(stableKey, { value: item.value, comment: item.comment })
  })

  const categories = Object.keys(kinks)
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    const fields = kinks[category].fields
    const kinkArr = kinks[category].kinks

    for (let j = 0; j < fields.length; j++) {
      const field = fields[j]

      for (let k = 0; k < kinkArr.length; k++) {
        const kink = kinkArr[k]

        // Generate stable IDs using original/language-independent data
        const stableIds = getStableIdsFromOriginal(
          enhancedKinks,
          kinks,
          category,
          kink,
          field
        )

        // Try stable key first, then fallback to current names
        const stableKey = `${stableIds.categoryId}-${stableIds.kinkId}-${stableIds.fieldId}`
        const fallbackKey = `${category}-${kink}-${field}`

        const existingData =
          selectionMap.get(stableKey) || selectionMap.get(fallbackKey)
        const value = existingData?.value || Object.keys(levels)[0]

        const obj: Selection = {
          category,
          kink,
          field,
          value,
          showField: fields.length >= 2,
          comment: existingData?.comment,
          // Use language-independent stable IDs
          categoryId: stableIds.categoryId,
          kinkId: stableIds.kinkId,
          fieldId: stableIds.fieldId,
        }

        list.push(obj)
      }
    }
  }

  return list
}

// Download image function
// Die Version wird im Dateinamen ergänzt, um Nachvollziehbarkeit zu gewährleisten
import { getAppVersion } from './version'
export const downloadImage = (
  canvas: HTMLCanvasElement,
  username: string
): void => {
  try {
    const version = getAppVersion()
    const filename = `kinklist_${username ? username.replace(/[^a-z0-9]/gi, '_').toLowerCase() : i18n.t('export.canvas.defaultFilename')}_v${version}_${new Date().toISOString().slice(0, 10)}.png`

    // Create a temporary link element to trigger the download
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    }, 100)
  } catch (error) {
    console.error(i18n.t('export.canvas.downloadError'), error)
    throw error
  }
}

// Canvas drawing functions
export const setupCanvas = (
  width: number,
  height: number,
  username: string,
  _levels: LevelsData
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')!
  // Klarer, neutraler Hintergrund
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Subtile Randlinie für bessere Abgrenzung
  context.strokeStyle = '#e0e0e0'
  context.lineWidth = 1
  context.strokeRect(0, 0, canvas.width, canvas.height)

  // Eleganter Header
  context.font = 'bold 16px Arial, sans-serif'
  context.fillStyle = '#333333'
  context.fillText(i18n.t('export.canvas.title', { username }), 12, 28)

  // Dezente Header-Trennlinie
  context.beginPath()
  context.moveTo(10, 36)
  context.lineTo(Math.min(width - 20, 350), 36)
  context.strokeStyle = '#cccccc'
  context.lineWidth = 1
  context.stroke()

  return canvas
}

export const drawLegend = (
  context: CanvasRenderingContext2D,
  levels: LevelsData
): void => {
  // Diese Funktion wird nicht mehr verwendet, da die Legende direkt in Export.tsx gezeichnet wird
  context.font = '12px Arial'
  context.fillStyle = '#555555'

  const levelNames = Object.keys(levels)
  const x = context.canvas.width - 15 - 120 * levelNames.length

  for (let i = 0; i < levelNames.length; i++) {
    context.beginPath()
    context.arc(x + 120 * i, 17, 8, 0, 2 * Math.PI, false)
    context.fillStyle = levels[levelNames[i]].color
    context.fill()
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    context.lineWidth = 1
    context.stroke()

    context.fillStyle = '#000000'
    context.fillText(levelNames[i], x + 15 + i * 120, 22)
  }
}

// Drawing call handlers
export const drawCallHandlers = {
  simpleTitle: (context: CanvasRenderingContext2D, drawCall: any): void => {
    context.fillStyle = '#000000'
    context.font = 'bold 18px Arial'
    context.fillText(drawCall.data, drawCall.x, drawCall.y + 5)
  },

  titleSubtitle: (context: CanvasRenderingContext2D, drawCall: any): void => {
    context.fillStyle = '#000000'
    context.font = 'bold 18px Arial'
    context.fillText(drawCall.data.category, drawCall.x, drawCall.y + 5)

    const fieldsStr = drawCall.data.fields.join(', ')
    context.font = 'italic 12px Arial'
    context.fillText(fieldsStr, drawCall.x, drawCall.y + 20)
  },

  kinkRow: (context: CanvasRenderingContext2D, drawCall: any): void => {
    context.fillStyle = '#000000'
    context.font = '12px Arial'

    const x = drawCall.x + 5 + drawCall.data.choices.length * 20
    const y = drawCall.y - 6
    context.fillText(drawCall.data.text, x, y)

    // Circles
    for (let i = 0; i < drawCall.data.choices.length; i++) {
      const choice = drawCall.data.choices[i]
      const color = drawCall.data.colors[choice]

      const x = 10 + drawCall.x + i * 20
      const y = drawCall.y - 10

      context.beginPath()
      context.arc(x, y, 8, 0, 2 * Math.PI, false)
      context.fillStyle = color
      context.fill()
      context.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      context.lineWidth = 1
      context.stroke()
    }
  },
}

// Diese Funktionen wurden durch React-State-basierte Implementierungen ersetzt

// Enhanced parser wrapper that automatically detects and handles multilingual templates
export const parseKinksTextEnhanced = (
  text: string,
  errorHandler: (msg: string) => void = (msg) => window.alert(msg)
): KinksData | null => {
  // Check if the text contains multilingual syntax
  const hasMultilingualSyntax = /^\+\s*\[[A-Z]{2}\]/.test(
    text.split('\n').find((line) => line.trim()) || ''
  )

  if (hasMultilingualSyntax) {
    // Use enhanced parser for multilingual templates
    try {
      const enhancedKinks = parseEnhancedKinksText(text, errorHandler)
      if (enhancedKinks) {
        // Resolve to current language and return as standard KinksData
        return resolveEnhancedKinksData(enhancedKinks, i18n.language)
      }
    } catch (error) {
      console.warn(
        'Enhanced parsing failed, falling back to standard parser:',
        error
      )
    }
  }

  // Fall back to standard parser
  return parseKinksText(text, errorHandler)
}

// Helper function to detect if text contains multilingual syntax
export const hasMultilingualContent = (text: string): boolean => {
  const lines = text.split('\n')
  return lines.some((line) => /^\+\s*\[[A-Z]{2}\]\s*/.test(line.trim()))
}
