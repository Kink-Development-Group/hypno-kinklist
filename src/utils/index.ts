import i18n from '../i18n'
import type { KinksData, LevelsData, Selection } from '../types'
import type { EnhancedKinksData } from './multilingualTemplates'
import {
  getStableIdsFromOriginal,
  parseEnhancedKinksText,
  resolveEnhancedKinksData,
  resolveMultilingualContent,
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

// New function to generate unique category keys
export const generateUniqueCategoryKey = (
  categoryName: string,
  existingKeys: Set<string>
): string => {
  const baseKey = strToClass(categoryName)
  let uniqueKey = baseKey
  let counter = 1

  while (existingKeys.has(uniqueKey)) {
    uniqueKey = `${baseKey}${counter}`
    counter++
  }

  return uniqueKey
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
  const existingKeys = new Set<string>()

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
        // Generate unique key for the category
        const uniqueKey = generateUniqueCategoryKey(catName, existingKeys)
        existingKeys.add(uniqueKey)
        newKinks[uniqueKey] = { ...cat, name: catName } as KinksData[string]
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
    // Generate unique key for the final category
    const uniqueKey = generateUniqueCategoryKey(catName, existingKeys)
    existingKeys.add(uniqueKey)
    newKinks[uniqueKey] = { ...cat, name: catName } as KinksData[string]
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

  // Only store non-default selections to keep hash compact
  const selectionData: {
    [stableId: string]: {
      level: number
      comment?: string
    }
  } = {}
  const levelNames = Object.keys(levels)

  // Debug: Log all categories in selection
  const categoriesInSelection = new Set(selection.map((item) => item.category))
  console.log(
    'updateHash: Categories in selection:',
    Array.from(categoriesInSelection)
  )

  selection.forEach((item) => {
    // Generate stable key - use the same format as the hash
    let stableKey: string
    if (item.categoryId && item.kinkId && item.fieldId) {
      // For enhanced kinks, use the format: categoryId-kinkId-fieldId
      stableKey = `${item.categoryId}-${item.kinkId}-${item.fieldId}`

      // Debug: Log stable key generation for "Suggestions 2"
      if (item.category === 'Suggestions 2') {
        console.log('updateHash: Generating stable key for Suggestions 2:', {
          category: item.category,
          categoryId: item.categoryId,
          kinkId: item.kinkId,
          fieldId: item.fieldId,
          stableKey,
          value: item.value,
          comment: item.comment,
        })
      }
    } else {
      // For standard kinks, use the format: category-kink-field
      stableKey = `${item.category}-${item.kink}-${item.field}`
    }

    const levelIndex = levelNames.indexOf(item.value)
    const finalIndex = levelIndex >= 0 ? levelIndex : 0
    const hasComment = item.comment && item.comment.trim().length > 0

    // Only store if it's not the default level or has a comment
    if (finalIndex !== 0 || hasComment) {
      const data: { level: number; comment?: string } = { level: finalIndex }
      if (hasComment) {
        data.comment = item.comment!.trim()
      }
      selectionData[stableKey] = data

      // Debug: Log when storing data for "Suggestions 2"
      if (item.category === 'Suggestions 2') {
        console.log('updateHash: Storing data for Suggestions 2:', {
          stableKey,
          data,
          finalIndex,
          hasComment,
        })
      }
    } else {
      // Debug: Log when NOT storing data for "Suggestions 2"
      if (item.category === 'Suggestions 2') {
        console.log(
          'updateHash: NOT storing data for Suggestions 2 (default level, no comment):',
          {
            stableKey,
            finalIndex,
            hasComment,
            value: item.value,
            comment: item.comment,
          }
        )
      }
    }
  })

  // Debug: Log final selection data keys
  const finalKeys = Object.keys(selectionData)
  console.log('updateHash: Final selection data keys:', finalKeys)
  console.log(
    'updateHash: Keys containing "suggestions":',
    finalKeys.filter((key) => key.includes('suggestions'))
  )

  // Create a JSON representation for non-default selections
  const compactData = JSON.stringify(selectionData)

  // Encode using base64 to make it URL-safe
  const hash = btoa(encodeURIComponent(compactData))

  window.location.hash = hash
  return hash
}

export const parseHash = (
  levels: LevelsData,
  kinks: KinksData,
  enhancedKinks?: EnhancedKinksData | null,
  existingSelection?: Selection[]
): Selection[] | null => {
  const fullHash = window.location.hash.substring(1)

  if (fullHash.length < 10) {
    console.log('parseHash: Hash too short, returning null')
    return null
  }

  console.log('parseHash: Parsing hash:', fullHash)

  // First try the new ID-based format
  try {
    // Decode the new ID-based hash format
    const decodedData = decodeURIComponent(atob(fullHash))
    console.log('parseHash: Decoded data:', decodedData)

    const selectionData = JSON.parse(decodedData) as {
      [stableId: string]: { level: number; comment?: string } | number
    }

    console.log('parseHash: Parsed selection data:', selectionData)

    // Debug: Log all unique categories in the hash
    const hashCategories = new Set(
      Object.keys(selectionData).map((key) => {
        const parts = key.split('-')
        return parts[0] // Get the category part
      })
    )
    console.log(
      'parseHash: Categories found in hash:',
      Array.from(hashCategories)
    )

    // Debug: Log available enhanced kinks categories
    if (enhancedKinks) {
      console.log(
        'parseHash: Available enhanced kinks categories:',
        Object.keys(enhancedKinks)
      )
    }

    // Use getAllKinksEnhanced to get the current kink structure, but preserve existing selection
    const allKinks = getAllKinksEnhanced(
      kinks,
      levels,
      enhancedKinks,
      existingSelection || []
    )

    console.log('parseHash: All kinks:', allKinks.length)

    const updatedSelection: Selection[] = []

    // Map the stored selections back to the current kink structure
    const levelNames = Object.keys(levels)

    allKinks.forEach((kink) => {
      // For hash parsing, we need to match the hash format which uses numeric indices
      // The hash contains keys like "basics-kink-0-field-0"
      // So we need to find the kink and field indices in the current structure

      let stableKey: string

      if (enhancedKinks) {
        // For enhanced kinks, find the category by matching the resolved name
        // First try exact key match, then try resolved name match
        let categoryKey = Object.keys(enhancedKinks).find(
          (key) => key === kink.category
        )

        if (!categoryKey) {
          categoryKey = Object.keys(enhancedKinks).find((key) => {
            const category = enhancedKinks[key]
            const allLanguages = ['en', 'de', 'sv']
            return allLanguages.some((lang) => {
              const resolvedName = resolveMultilingualContent(
                category.name,
                lang
              )
              return resolvedName === kink.category
            })
          })
        }

        // Additional fallback: try to find by the strToClass version of the category name
        if (!categoryKey) {
          const strToClassCategory = strToClass(kink.category)
          categoryKey = Object.keys(enhancedKinks).find(
            (key) => key === strToClassCategory
          )
        }

        if (categoryKey) {
          const category = enhancedKinks[categoryKey]

          // Find field index by checking all languages
          const fieldIndex = category.fields.findIndex((field) => {
            const allLanguages = ['en', 'de', 'sv']
            return allLanguages.some((lang) => {
              const resolvedField = resolveMultilingualContent(field, lang)
              return resolvedField === kink.field
            })
          })

          // Find kink index by checking all languages
          const kinkIndex = category.kinks.findIndex((kinkItem) => {
            const allLanguages = ['en', 'de', 'sv']
            return allLanguages.some((lang) => {
              const resolvedKink = resolveMultilingualContent(kinkItem, lang)
              return resolvedKink === kink.kink
            })
          })

          if (fieldIndex >= 0 && kinkIndex >= 0) {
            stableKey = `${categoryKey}-kink-${kinkIndex}-field-${fieldIndex}`
          } else {
            stableKey = `${kink.category}-${kink.kink}-${kink.field}`
          }
        } else {
          stableKey = `${kink.category}-${kink.kink}-${kink.field}`
        }
      } else {
        // For standard kinks, use the current format
        stableKey = `${kink.category}-${kink.kink}-${kink.field}`
      }

      // Check if we have a stored value for this kink
      const storedData = selectionData[stableKey]
      let value = levelNames[0] // Default value
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

        // Debug: Log successful restoration for "Suggestions 2"
        if (kink.category === 'Suggestions 2') {
          console.log('parseHash: Successfully restored Suggestions 2:', {
            category: kink.category,
            stableKey,
            value,
            comment,
            storedData,
          })
        }

        updatedSelection.push({
          category: kink.category,
          kink: kink.kink,
          field: kink.field,
          value,
          showField: kink.showField,
          comment,
          categoryId: kink.categoryId,
          kinkId: kink.kinkId,
          fieldId: kink.fieldId,
        })
      } else {
        // Special debug for "Suggestions 2" to understand what's happening
        if (kink.category === 'Suggestions 2') {
          console.log(
            'parseHash: Special debug for Suggestions 2 - no data found:',
            {
              category: kink.category,
              categoryId: kink.categoryId,
              kinkId: kink.kinkId,
              fieldId: kink.fieldId,
              stableKey,
              availableKeys: Object.keys(selectionData).filter((key) =>
                key.includes('suggestions')
              ),
              allKeys: Object.keys(selectionData),
            }
          )
        }

        // Try all possible key formats for enhanced kinks
        if (enhancedKinks && kink.categoryId && kink.kinkId && kink.fieldId) {
          const alternativeStableKey = `${kink.categoryId}-${kink.kinkId}-${kink.fieldId}`
          const categoryIdStableKey = `${kink.categoryId}-kink-${kink.kinkId.replace('kink-', '')}-field-${kink.fieldId.replace('field-', '')}`

          const alternativeData =
            selectionData[alternativeStableKey] ||
            selectionData[categoryIdStableKey]

          if (alternativeData) {
            // Handle both old format (number) and new format (object)
            if (typeof alternativeData === 'number') {
              if (alternativeData < levelNames.length) {
                value = levelNames[alternativeData]
              }
            } else {
              if (alternativeData.level < levelNames.length) {
                value = levelNames[alternativeData.level]
              }
              comment = alternativeData.comment
            }

            // Debug: Log successful restoration with alternative key for "Suggestions 2"
            if (kink.category === 'Suggestions 2') {
              console.log(
                'parseHash: Successfully restored Suggestions 2 with alternative key:',
                {
                  category: kink.category,
                  alternativeStableKey,
                  categoryIdStableKey,
                  value,
                  comment,
                  alternativeData,
                }
              )
            }

            updatedSelection.push({
              category: kink.category,
              kink: kink.kink,
              field: kink.field,
              value,
              showField: kink.showField,
              comment,
              categoryId: kink.categoryId,
              kinkId: kink.kinkId,
              fieldId: kink.fieldId,
            })
          } else {
            // Debug: Log when no alternative key works for "Suggestions 2"
            if (kink.category === 'Suggestions 2') {
              console.log(
                'parseHash: No alternative key found for Suggestions 2:',
                {
                  category: kink.category,
                  alternativeStableKey,
                  categoryIdStableKey,
                  availableKeys: Object.keys(selectionData).filter((key) =>
                    key.includes('suggestions')
                  ),
                }
              )
            }

            // Add with default value
            updatedSelection.push({
              category: kink.category,
              kink: kink.kink,
              field: kink.field,
              value,
              showField: kink.showField,
              comment,
              categoryId: kink.categoryId,
              kinkId: kink.kinkId,
              fieldId: kink.fieldId,
            })
          }
        } else {
          // Add with default value
          updatedSelection.push({
            category: kink.category,
            kink: kink.kink,
            field: kink.field,
            value,
            showField: kink.showField,
            comment,
            categoryId: kink.categoryId,
            kinkId: kink.kinkId,
            fieldId: kink.fieldId,
          })
        }
      }
    })

    console.log(
      'parseHash: Successfully parsed new format, returning',
      updatedSelection.length,
      'items'
    )

    // Debug: Log the first few items to see what's in the selection array
    const firstFew = updatedSelection.slice(0, 3).map((s) => ({
      category: s.category,
      kink: s.kink,
      field: s.field,
      value: s.value,
      categoryId: s.categoryId,
      kinkId: s.kinkId,
      fieldId: s.fieldId,
    }))
    console.log(
      'parseHash: First few selection items:',
      JSON.stringify(firstFew, null, 2)
    )

    return updatedSelection
  } catch (error) {
    console.error('parseHash: Error parsing new format:', error)

    // Fallback to old format if new format fails
    console.log('parseHash: Falling back to legacy format')
    return parseHashLegacy(
      levels,
      kinks,
      enhancedKinks,
      fullHash,
      existingSelection
    )
  }
}

// Legacy hash parsing function for backward compatibility
function parseHashLegacy(
  levels: LevelsData,
  kinks: KinksData,
  enhancedKinks: EnhancedKinksData | null | undefined,
  fullHash: string,
  existingSelection?: Selection[]
): Selection[] | null {
  console.log('parseHashLegacy: Parsing legacy hash:', fullHash)

  // Trenne die Kommentare von den Auswahlen
  const parts = fullHash.split('|')
  const hash = parts[0]
  let comments: string[] = []

  console.log('parseHashLegacy: Hash part:', hash)
  console.log('parseHashLegacy: Parts count:', parts.length)

  // Dekodiere die Kommentare, falls vorhanden
  if (parts.length > 1) {
    try {
      const decodedComments = decodeURIComponent(atob(parts[1]))
      comments = JSON.parse(decodedComments)
      console.log('parseHashLegacy: Decoded comments:', comments)
    } catch (e) {
      console.error('parseHashLegacy: Comment decode error:', e)
      comments = []
    }
  }

  const levelCount = Object.keys(levels).length
  console.log('parseHashLegacy: Level count:', levelCount)

  const levelValues = decode(levelCount, hash)
  console.log('parseHashLegacy: Decoded level values:', levelValues)

  // Use getAllKinksEnhanced to ensure proper stable ID handling, but preserve existing selection
  const allKinks = getAllKinksEnhanced(
    kinks,
    levels,
    enhancedKinks,
    existingSelection || []
  )

  console.log('parseHashLegacy: All kinks count:', allKinks.length)

  const updatedSelection: Selection[] = []

  // IMPORTANT: Only process up to the minimum of available values and kinks
  const maxItems = Math.min(levelValues.length, allKinks.length)
  console.log('parseHashLegacy: Processing', maxItems, 'items')

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
    console.log(
      'parseHashLegacy: Adding',
      allKinks.length - levelValues.length,
      'default items'
    )
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

  console.log(
    'parseHashLegacy: Successfully parsed legacy format, returning',
    updatedSelection.length,
    'items'
  )
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
    // Use the category key directly as the stable categoryId
    // This ensures the categoryId never changes with language
    const categoryId = category

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

  // Debug: Log input data
  console.log(
    'getAllKinksEnhanced: Input kinks categories:',
    Object.keys(kinks)
  )
  console.log(
    'getAllKinksEnhanced: Enhanced kinks categories:',
    enhancedKinks ? Object.keys(enhancedKinks) : 'null'
  )

  // Create a map of existing selections using stable IDs when available, fallback to names
  existingSelection.forEach((item) => {
    const stableKey =
      item.categoryId && item.kinkId && item.fieldId
        ? `${item.categoryId}-${item.kinkId}-${item.fieldId}`
        : `${item.category}-${item.kink}-${item.field}`

    selectionMap.set(stableKey, { value: item.value, comment: item.comment })
  })

  // Process categories from kinks (resolved data)
  const categories = Object.keys(kinks)
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    const fields = kinks[category].fields
    const kinkArr = kinks[category].kinks

    // Debug: Log each category being processed
    if (category === 'Suggestions 2') {
      console.log('getAllKinksEnhanced: Processing Suggestions 2 from kinks:', {
        category,
        fields,
        kinks: kinkArr,
      })
    }

    for (let j = 0; j < fields.length; j++) {
      const field = fields[j]

      for (let k = 0; k < kinkArr.length; k++) {
        const kink = kinkArr[k]

        // Generate stable IDs using original/language-independent data
        const stableIds = getStableIdsFromOriginal(
          enhancedKinks,
          category,
          kink,
          field
        )

        // Debug: Log stable IDs for "Suggestions 2"
        if (category === 'Suggestions 2') {
          console.log('getAllKinksEnhanced: Stable IDs for Suggestions 2:', {
            category,
            kink,
            field,
            stableIds,
          })
        }

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

        // Debug: Log created Selection object for "Suggestions 2"
        if (category === 'Suggestions 2') {
          console.log(
            'getAllKinksEnhanced: Created Selection for Suggestions 2:',
            obj
          )
        }

        list.push(obj)
      }
    }
  }

  // Process categories from enhancedKinks that are not in kinks
  if (enhancedKinks) {
    const enhancedCategories = Object.keys(enhancedKinks)
    for (const categoryKey of enhancedCategories) {
      const category = enhancedKinks[categoryKey]

      // Check if this category is already processed from kinks
      const resolvedCategoryName = resolveMultilingualContent(
        category.name,
        i18n.language || 'en'
      )
      const alreadyProcessed = categories.some(
        (cat) => cat === resolvedCategoryName
      )

      if (!alreadyProcessed) {
        // Debug: Log processing enhanced category
        if (resolvedCategoryName === 'Suggestions 2') {
          console.log(
            'getAllKinksEnhanced: Processing Suggestions 2 from enhancedKinks:',
            {
              categoryKey,
              resolvedCategoryName,
              fields: category.fields,
              kinks: category.kinks,
            }
          )
        }

        // Process this category from enhancedKinks
        for (let j = 0; j < category.fields.length; j++) {
          const field = category.fields[j]
          const resolvedField = resolveMultilingualContent(
            field,
            i18n.language || 'en'
          )

          for (let k = 0; k < category.kinks.length; k++) {
            const kink = category.kinks[k]
            const resolvedKink = resolveMultilingualContent(
              kink,
              i18n.language || 'en'
            )

            // Generate stable IDs using original/language-independent data
            const stableIds = getStableIdsFromOriginal(
              enhancedKinks,
              resolvedCategoryName,
              resolvedKink,
              resolvedField
            )

            // Debug: Log stable IDs for "Suggestions 2"
            if (resolvedCategoryName === 'Suggestions 2') {
              console.log(
                'getAllKinksEnhanced: Stable IDs for Suggestions 2 from enhancedKinks:',
                {
                  category: resolvedCategoryName,
                  kink: resolvedKink,
                  field: resolvedField,
                  stableIds,
                }
              )
            }

            // Try stable key first, then fallback to current names
            const stableKey = `${stableIds.categoryId}-${stableIds.kinkId}-${stableIds.fieldId}`
            const fallbackKey = `${resolvedCategoryName}-${resolvedKink}-${resolvedField}`

            const existingData =
              selectionMap.get(stableKey) || selectionMap.get(fallbackKey)
            const value = existingData?.value || Object.keys(levels)[0]

            const obj: Selection = {
              category: resolvedCategoryName,
              kink: resolvedKink,
              field: resolvedField,
              value,
              showField: category.fields.length >= 2,
              comment: existingData?.comment,
              // Use language-independent stable IDs
              categoryId: stableIds.categoryId,
              kinkId: stableIds.kinkId,
              fieldId: stableIds.fieldId,
            }

            // Debug: Log created Selection object for "Suggestions 2"
            if (resolvedCategoryName === 'Suggestions 2') {
              console.log(
                'getAllKinksEnhanced: Created Selection for Suggestions 2 from enhancedKinks:',
                obj
              )
            }

            list.push(obj)
          }
        }
      }
    }
  }

  // Debug: Log final list categories
  const finalCategories = new Set(list.map((item) => item.category))
  console.log(
    'getAllKinksEnhanced: Final list categories:',
    Array.from(finalCategories)
  )
  console.log(
    'getAllKinksEnhanced: Suggestions 2 in final list:',
    finalCategories.has('Suggestions 2')
  )

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
