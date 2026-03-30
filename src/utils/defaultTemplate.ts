// Utility functions for loading default templates
import { debugLog, debugWarn, hasMultilingualContent } from './index'
import { getEnhancedKinkTemplate } from './kinkTemplates'

const ensureMultilingualTemplate = (template: string): string => {
  if (hasMultilingualContent(template)) {
    return template
  }

  debugWarn(
    'Loaded template did not contain multilingual content. Falling back to built-in enhanced template.'
  )

  return getEnhancedKinkTemplate()
}

/**
 * Lädt die Standard-Kinks-Liste vom Server
 * @returns Promise<string> - Der Inhalt der kinks.klist Datei
 * @throws Error wenn das Laden fehlschlägt
 */
export const loadDefaultKinklistFromServer = async (): Promise<string> => {
  // In tests or when window.location is not available, fail fast
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('Not running in browser environment')
  }

  const defaultTemplateUrl = new URL(
    'defaultList/kinks.klist',
    `${window.location.origin}${import.meta.env.BASE_URL}`
  )

  const response = await fetch(defaultTemplateUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to load default template: ${response.status} ${response.statusText}`
    )
  }

  const text = await response.text()
  debugLog('Successfully loaded default kinks.klist from server')
  return text
}

/**
 * Lädt das Standard-Template für die Kinklist
 * Versucht zuerst die kinks.klist vom Server zu laden,
 * fällt bei Fehlern auf das eingebaute Template zurück
 * @returns Promise<string> - Der Template-Inhalt
 */
export const getDefaultKinklistTemplate = async (): Promise<string> => {
  try {
    // Try to load the default kinks.klist file from server
    const template = await loadDefaultKinklistFromServer()
    return ensureMultilingualTemplate(template)
  } catch (error) {
    debugWarn(
      'Failed to load default template from server, falling back to built-in template:',
      error
    )

    // Fallback to the built-in enhanced template
    return getEnhancedKinkTemplate()
  }
}
