import { KinksData, LevelsData, Selection } from '../types'
import { ExportData } from '../types/export'

/**
 * Konvertiert ExportData zurück in das interne Anwendungsformat
 */
export const convertFromExportData = (
  exportData: ExportData
): {
  kinks: KinksData
  levels: LevelsData
  selection: Selection[]
} => {
  console.log('Converting export data to internal format...')

  // Konvertiere Levels mit besserer Validierung
  const levels: LevelsData = {}
  Object.entries(exportData.levels).forEach(([levelName, levelData]) => {
    if (levelData && typeof levelData === 'object') {
      levels[levelName] = {
        key: levelData.class || levelName.toLowerCase().replace(/\s+/g, ''),
        name: levelData.name || levelName,
        color: levelData.color || '#000000',
        class: levelData.class || levelName.toLowerCase().replace(/\s+/g, ''),
      }
    }
  })

  console.log(`Converted ${Object.keys(levels).length} levels`)

  // Konvertiere Categories zu KinksData mit besserer Validierung
  const kinks: KinksData = {}
  exportData.categories.forEach((category) => {
    if (category && category.name) {
      const categoryName = category.name
      const fields = Array.isArray(category.fields)
        ? category.fields
        : ['General']
      const kinkNames: string[] = []
      const descriptions: string[] = []

      if (Array.isArray(category.kinks)) {
        category.kinks.forEach((kink) => {
          if (kink && kink.name) {
            kinkNames.push(kink.name)
            descriptions.push(kink.description || '')
          }
        })
      }

      // Nur Kategorien mit mindestens einem Kink hinzufügen
      if (kinkNames.length > 0) {
        kinks[categoryName] = {
          name: categoryName,
          fields,
          kinks: kinkNames,
          descriptions,
        }
      }
    }
  })

  console.log(`Converted ${Object.keys(kinks).length} categories`)

  // Konvertiere Selection mit besserer Validierung
  const selection: Selection[] = []
  exportData.categories.forEach((category) => {
    if (category && category.name && Array.isArray(category.kinks)) {
      category.kinks.forEach((kink) => {
        if (kink && kink.name && kink.selections) {
          Object.entries(kink.selections).forEach(([field, sel]) => {
            if (sel && sel.level) {
              selection.push({
                category: category.name,
                kink: kink.name,
                field: field,
                value: sel.level,
                comment: sel.comment || undefined,
                showField: (category.fields?.length || 0) > 1,
              })
            }
          })
        }
      })
    }
  })

  console.log(`Converted ${selection.length} selections`)

  // Validiere das Ergebnis
  if (Object.keys(levels).length === 0) {
    console.warn('No levels found in converted data')
  }

  if (Object.keys(kinks).length === 0) {
    console.warn('No categories found in converted data')
  }

  if (selection.length === 0) {
    console.warn('No selections found in converted data')
  }

  return { kinks, levels, selection }
}

/**
 * Validiert ExportData-Struktur
 */
export const validateExportData = (data: any): data is ExportData => {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Prüfe Metadata
  if (
    !data.metadata ||
    typeof data.metadata.exportDate !== 'string' ||
    typeof data.metadata.version !== 'string'
  ) {
    return false
  }

  // Prüfe Levels
  if (!data.levels || typeof data.levels !== 'object') {
    return false
  }

  // Prüfe Categories
  if (!Array.isArray(data.categories)) {
    return false
  }

  // Validiere jede Kategorie
  for (const category of data.categories) {
    if (
      !category.name ||
      !Array.isArray(category.fields) ||
      !Array.isArray(category.kinks)
    ) {
      return false
    }

    // Validiere jeden Kink in der Kategorie
    for (const kink of category.kinks) {
      if (
        !kink.name ||
        !kink.selections ||
        typeof kink.selections !== 'object'
      ) {
        return false
      }
    }
  }

  return true
}
