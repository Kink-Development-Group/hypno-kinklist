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
  // Konvertiere Levels
  const levels: LevelsData = {}
  Object.entries(exportData.levels).forEach(([levelName, levelData]) => {
    levels[levelName] = {
      key: levelData.class, // Use class as key since it's stable
      name: levelData.name,
      color: levelData.color,
      class: levelData.class,
    }
  })

  // Konvertiere Categories zu KinksData
  const kinks: KinksData = {}
  exportData.categories.forEach((category) => {
    kinks[category.name] = {
      name: category.name,
      fields: category.fields,
      kinks: category.kinks.map((kink) => kink.name),
      descriptions: category.kinks.map((kink) => kink.description || ''),
    }
  })

  // Konvertiere Selection
  const selection: Selection[] = []
  exportData.categories.forEach((category) => {
    category.kinks.forEach((kink) => {
      Object.entries(kink.selections).forEach(([field, sel]) => {
        selection.push({
          category: category.name,
          kink: kink.name,
          field: field,
          value: sel.level,
          comment: sel.comment,
          showField: category.fields.length > 1,
        })
      })
    })
  })

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
