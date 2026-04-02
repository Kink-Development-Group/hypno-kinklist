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
      key: levelData.key || levelData.class,
      name: levelData.name,
      color: levelData.color,
      class: levelData.class,
    }
  })

  const levelEntries = Object.entries(levels)
  const defaultLevel = levelEntries[0]?.[0] ?? ''

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
        const normalizedLevel =
          levelEntries.find(
            ([levelName, level]) =>
              levelName === sel.level ||
              level.key === sel.level ||
              level.class === sel.level
          )?.[0] ?? defaultLevel

        selection.push({
          category: category.name,
          kink: kink.name,
          field: field,
          value: normalizedLevel,
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

  for (const level of Object.values(data.levels)) {
    const optionalKey = (level as any)?.key

    if (
      !level ||
      typeof level !== 'object' ||
      ('key' in (level as any) &&
        optionalKey !== undefined &&
        typeof optionalKey !== 'string') ||
      typeof (level as any).name !== 'string' ||
      typeof (level as any).color !== 'string' ||
      typeof (level as any).class !== 'string'
    ) {
      return false
    }
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
