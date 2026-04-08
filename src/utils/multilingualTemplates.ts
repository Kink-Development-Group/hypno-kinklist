// Enhanced multilingual template system
// Supports the new + [LANG] content syntax alongside existing format

import i18n from '../i18n'
import { generateUniqueCategoryKey, strToClass } from './index'

// Interface for multilingual content
export interface MultilingualContent {
  default: string
  translations: Record<string, string> // language code -> translated content
}

// Enhanced interfaces that support multilingual content
export interface EnhancedKinkCategory {
  name: string | MultilingualContent
  fields: (string | MultilingualContent)[]
  kinks: (string | MultilingualContent)[]
  descriptions?: (string | MultilingualContent)[]
}

export type EnhancedKinksData = Record<string, EnhancedKinkCategory>

// Utility functions
export const resolveMultilingualContent = (
  content: string | MultilingualContent,
  language: string
): string => {
  if (typeof content === 'string') {
    return content
  }

  // Try exact language match
  if (content.translations[language]) {
    return content.translations[language]
  }

  // Try language code without region (e.g., 'en' from 'en-US')
  const baseLanguage = language.split('-')[0].toUpperCase()
  if (content.translations[baseLanguage]) {
    return content.translations[baseLanguage]
  }

  // Fall back to default
  return content.default
}

export const createMultilingualContent = (
  defaultContent: string,
  translations: Record<string, string> = {}
): MultilingualContent => ({
  default: defaultContent,
  translations,
})

// Helper function to generate stable ID from multilingual content
// Uses the same normalization logic as strToClass for consistent mapping
export const getStableId = (content: string | MultilingualContent): string => {
  const normalizeToStableId = (str: string): string => {
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

  if (typeof content === 'string') {
    return normalizeToStableId(content)
  } else {
    // For multilingual content, use the default content to generate stable ID
    return normalizeToStableId(content.default)
  }
}

// Helper function to parse multilingual line format: + [LANG] content
const parseMultilingualLine = (
  line: string
): { language: string; content: string } | null => {
  const match = line.match(/^\+\s*\[([A-Z]{2})\]\s*(.*)$/)
  if (match) {
    return {
      language: match[1],
      content: match[2],
    }
  }
  return null
}

// Helper function to apply multilingual content to existing content
const applyMultilingualContent = (
  existing: string | MultilingualContent,
  language: string,
  content: string
): MultilingualContent => {
  if (typeof existing === 'string') {
    // Convert string to MultilingualContent
    return {
      default: existing,
      translations: { [language]: content },
    }
  } else {
    // Add to existing MultilingualContent
    return {
      ...existing,
      translations: {
        ...existing.translations,
        [language]: content,
      },
    }
  }
}

// Enhanced parser that supports the new + [LANG] content syntax
export const parseEnhancedKinksText = (
  text: string,
  _errorHandler: (msg: string) => void = (msg) => window.alert(msg)
): EnhancedKinksData | null => {
  const newKinks: EnhancedKinksData = {}
  const lines = text.replace(/\r/g, '').split('\n')
  const existingKeys = new Set<string>()

  let cat: Partial<EnhancedKinkCategory> | null = null
  let catName: string | null = null
  let lastKinkIdx: number | null = null
  let lastCategoryLine: string | null = null
  let lastKinkLine: string | null = null
  let lastDescriptionLine: string | null = null
  let lastFieldsLine: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.length) continue

    // Check for multilingual translation line
    const multilingualMatch = parseMultilingualLine(line)

    if (multilingualMatch) {
      const { language, content } = multilingualMatch

      // Determine what this translation applies to based on the last parsed element
      if (content.startsWith('#') && lastCategoryLine) {
        // Category name translation
        const categoryContent = content.substring(1).trim()
        if (catName && cat) {
          cat.name = applyMultilingualContent(
            typeof cat.name === 'string' ? cat.name : cat.name || catName,
            language,
            categoryContent
          )
        }
      } else if (
        content.startsWith('(') &&
        content.endsWith(')') &&
        lastFieldsLine &&
        cat
      ) {
        // Field translation - translate the entire field list
        const fieldContent = content.substring(1, content.length - 1).trim()
        const translatedFields = fieldContent
          .split(',')
          .map((field) => field.trim())

        if (cat.fields && translatedFields.length === cat.fields.length) {
          // Apply translations to each field
          for (let i = 0; i < cat.fields.length; i++) {
            cat.fields[i] = applyMultilingualContent(
              cat.fields[i],
              language,
              translatedFields[i]
            )
          }
          lastFieldsLine = null // Reset after successful translation
        } else if (
          cat.fields &&
          cat.fields.length === 1 &&
          translatedFields.length === 1
        ) {
          // Single field case
          cat.fields[0] = applyMultilingualContent(
            cat.fields[0],
            language,
            translatedFields[0]
          )
          lastFieldsLine = null // Reset after successful translation
        }
      } else if (
        content.startsWith('*') &&
        lastKinkLine &&
        cat &&
        lastKinkIdx !== null
      ) {
        // Kink name translation
        const kinkContent = content.substring(1).trim()
        if (cat.kinks && cat.kinks[lastKinkIdx]) {
          cat.kinks[lastKinkIdx] = applyMultilingualContent(
            cat.kinks[lastKinkIdx],
            language,
            kinkContent
          )
        }
      } else if (
        content.startsWith('?') &&
        lastDescriptionLine &&
        cat &&
        lastKinkIdx !== null
      ) {
        // Description translation
        const descContent = content.substring(1).trim()
        if (!cat.descriptions) {
          cat.descriptions = []
        }
        while (cat.descriptions.length <= lastKinkIdx) {
          cat.descriptions.push('')
        }
        cat.descriptions[lastKinkIdx] = applyMultilingualContent(
          cat.descriptions[lastKinkIdx] || '',
          language,
          descContent
        )
      }
      continue
    }

    // Handle regular template syntax
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
        newKinks[uniqueKey] = {
          ...cat,
          name: cat.name || catName,
        } as EnhancedKinkCategory
      }
      catName = line.substring(1).trim()
      cat = { name: catName, kinks: [], descriptions: [] }
      lastKinkIdx = null
      lastCategoryLine = line
      lastKinkLine = null
      lastDescriptionLine = null
      lastFieldsLine = null
    }

    if (!catName) continue

    if (line[0] === '(') {
      if (cat) {
        cat.fields = line
          .substring(1, line.length - 1)
          .trim()
          .split(',')
          .map((field) => field.trim())
        lastFieldsLine = line
      }
    } else if (line[0] === '*') {
      const kink = line.substring(1).trim()
      if (cat && Array.isArray(cat.kinks) && Array.isArray(cat.descriptions)) {
        cat.kinks.push(kink)
        cat.descriptions.push('')
        lastKinkIdx = cat.kinks.length - 1
        lastKinkLine = line
        lastDescriptionLine = null
      }
    } else if (
      line[0] === '?' &&
      cat &&
      Array.isArray(cat.descriptions) &&
      lastKinkIdx !== null
    ) {
      cat.descriptions[lastKinkIdx] = line.substring(1).trim()
      lastDescriptionLine = line
    }
  }

  // Add final category
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
    newKinks[uniqueKey] = {
      ...cat,
      name: cat.name || catName,
    } as EnhancedKinkCategory
  }

  return newKinks
}

// Convert enhanced kinks data back to text format (with multilingual support)
export const enhancedKinksToText = (
  kinks: EnhancedKinksData,
  includeTranslations: boolean = true
): string => {
  let kinksText = ''
  const kinkCats = Object.keys(kinks)

  for (let i = 0; i < kinkCats.length; i++) {
    const catName = kinkCats[i]
    const category = kinks[catName]
    const catFields = category.fields
    const catKinks = category.kinks
    const catDescriptions = category.descriptions || []

    // Write category name
    const categoryName = resolveMultilingualContent(category.name, 'en')
    kinksText += '#' + categoryName + '\r\n'

    // Write translations for category name if available and requested
    if (includeTranslations && typeof category.name !== 'string') {
      Object.entries(category.name.translations).forEach(
        ([lang, translation]) => {
          kinksText += `+ [${lang}] #${translation}\r\n`
        }
      )
    }

    kinksText += '(' + catFields.join(', ') + ')\r\n'

    // Write kinks and their translations
    for (let j = 0; j < catKinks.length; j++) {
      const kink = catKinks[j]
      const kinkName = resolveMultilingualContent(kink, 'en')
      kinksText += '* ' + kinkName + '\r\n'

      // Write translations for kink if available and requested
      if (includeTranslations && typeof kink !== 'string') {
        Object.entries(kink.translations).forEach(([lang, translation]) => {
          kinksText += `+ [${lang}] * ${translation}\r\n`
        })
      }

      // Write description if available
      if (catDescriptions[j]) {
        const description = catDescriptions[j]
        const descriptionText = resolveMultilingualContent(description, 'en')
        if (descriptionText && descriptionText.trim().length > 0) {
          kinksText += '? ' + descriptionText.trim() + '\r\n'

          // Write translations for description if available and requested
          if (includeTranslations && typeof description !== 'string') {
            Object.entries(description.translations).forEach(
              ([lang, translation]) => {
                kinksText += `+ [${lang}] ? ${translation}\r\n`
              }
            )
          }
        }
      }
    }

    if (i < kinkCats.length - 1) {
      kinksText += '\r\n'
    }
  }

  return kinksText
}

// Function to resolve enhanced kinks data to current language
export const resolveEnhancedKinksData = (
  kinks: EnhancedKinksData,
  language?: string
): import('../types').KinksData => {
  const currentLanguage = language || i18n.language || 'en'
  const resolvedKinks: import('../types').KinksData = {}

  Object.entries(kinks).forEach(([categoryKey, category]) => {
    // Preserve the unique category key instead of using the resolved name
    const resolvedCategory = {
      name: resolveMultilingualContent(category.name, currentLanguage),
      fields: category.fields.map((field) =>
        resolveMultilingualContent(field, currentLanguage)
      ),
      kinks: category.kinks.map((kink) =>
        resolveMultilingualContent(kink, currentLanguage)
      ),
      descriptions: category.descriptions?.map((desc) =>
        resolveMultilingualContent(desc, currentLanguage)
      ),
    }

    resolvedKinks[categoryKey] = resolvedCategory
  })

  return resolvedKinks
}

// Helper function to get stable IDs from original data (language-independent)
export const getStableIdsFromOriginal = (
  enhancedKinks: EnhancedKinksData | null,
  categoryName: string,
  kinkName: string,
  fieldName: string
): { categoryId: string; kinkId: string; fieldId: string } => {
  if (enhancedKinks) {
    // For enhanced/multilingual kinks, find the category by matching the resolved name
    const categoryKey = Object.keys(enhancedKinks).find((key) => {
      const category = enhancedKinks[key]

      // Check all available languages plus default content
      const allLanguages = [
        ...(i18n.options.supportedLngs || []),
        i18n.language,
      ]
      return allLanguages.some((lang) => {
        const resolvedName = resolveMultilingualContent(category.name, lang)
        // Case-insensitive comparison
        return resolvedName.toLowerCase() === categoryName.toLowerCase()
      })
    })

    if (categoryKey) {
      const category = enhancedKinks[categoryKey]

      // Find field index by checking all languages
      const fieldIndex = category.fields.findIndex((field) => {
        const allLanguages = ['en', 'de', 'sv', i18n.language]
        return allLanguages.some((lang) => {
          const resolvedField = resolveMultilingualContent(field, lang)
          // Case-insensitive comparison
          return resolvedField.toLowerCase() === fieldName.toLowerCase()
        })
      })

      // Find kink index by checking all languages
      const kinkIndex = category.kinks.findIndex((kink) => {
        const allLanguages = ['en', 'de', 'sv', i18n.language]
        return allLanguages.some((lang) => {
          const resolvedKink = resolveMultilingualContent(kink, lang)
          // Case-insensitive comparison
          return resolvedKink.toLowerCase() === kinkName.toLowerCase()
        })
      })

      if (fieldIndex >= 0 && kinkIndex >= 0) {
        // Use the categoryKey directly as the stable categoryId
        // This ensures the categoryId never changes with language
        const categoryId = categoryKey

        return {
          categoryId,
          kinkId: `kink-${kinkIndex}`, // Just the kink identifier without category
          fieldId: `field-${fieldIndex}`, // Just the field identifier without category
        }
      }
    }
  }

  // Fallback for standard templates - use current names
  const fallbackResult = {
    categoryId: strToClass(categoryName),
    kinkId: strToClass(kinkName),
    fieldId: strToClass(fieldName),
  }

  return fallbackResult
}
