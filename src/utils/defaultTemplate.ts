// Utility functions for loading default templates

/**
 * Lädt die Standard-Kinks-Liste vom Server
 * @returns Promise<string> - Der Inhalt der kinks.klist Datei
 * @throws Error wenn das Laden fehlschlägt
 */
export const loadDefaultKinklistFromServer = async (): Promise<string> => {
  try {
    const response = await fetch('/defaultList/kinks.klist')
    if (!response.ok) {
      throw new Error(
        `Failed to load default template: ${response.status} ${response.statusText}`
      )
    }
    const text = await response.text()
    console.log('Successfully loaded default kinks.klist from server')
    return text
  } catch (error) {
    console.error('Error loading default kinks.klist from server:', error)
    throw error
  }
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
    return await loadDefaultKinklistFromServer()
  } catch (error) {
    console.warn(
      'Failed to load default template from server, falling back to built-in template:',
      error
    )

    // Fallback to the built-in enhanced template
    const { getEnhancedKinkTemplate } = await import('./kinkTemplates')
    return getEnhancedKinkTemplate()
  }
}
