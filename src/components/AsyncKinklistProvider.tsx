import React, { useEffect, useState } from 'react'
import { KinklistProvider } from '../context/KinklistContext'
import { hasMultilingualContent } from '../utils'
import { getDefaultKinklistTemplate } from '../utils/defaultTemplate'
import { getEnhancedKinkTemplate } from '../utils/kinkTemplates'

interface AsyncKinklistProviderProps {
  children: React.ReactNode
}

/**
 * Asynchroner Provider, der das erweiterte mehrsprachige Template lädt
 * Versucht die kinks.klist vom Server zu laden,
 * fällt bei Fehlern auf das eingebaute erweiterte Template zurück
 */
const AsyncKinklistProvider: React.FC<AsyncKinklistProviderProps> = ({
  children,
}) => {
  const [template, setTemplate] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Versuche, das Standard-Template vom Server zu laden
        const defaultTemplate = await getDefaultKinklistTemplate()

        // Check if the loaded template has multilingual content
        if (hasMultilingualContent(defaultTemplate)) {
          // Use the loaded template if it has multilingual content
          setTemplate(defaultTemplate)
        } else {
          // Use enhanced template if the loaded template doesn't have multilingual content
          console.log(
            'Loaded template does not have multilingual content, using enhanced template'
          )
          const enhancedTemplate = getEnhancedKinkTemplate()
          setTemplate(enhancedTemplate)
        }
      } catch (err) {
        console.error('Fehler beim Laden des Templates:', err)
        setError('Fehler beim Laden des Templates')

        // Fallback auf das verbesserte Template
        const fallbackTemplate = getEnhancedKinkTemplate()
        setTemplate(fallbackTemplate)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplate()
  }, [])

  // Ladezustand anzeigen
  if (isLoading) {
    return (
      <div className="template-loading">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <p>Lade Kinklist-Template</p>
        </div>
      </div>
    )
  }

  // Fehlerzustand anzeigen (aber trotzdem mit Fallback-Template rendern)
  if (error) {
    console.warn('Template-Ladefehler (verwende Fallback):', error)
  }

  return (
    <KinklistProvider initialKinksText={template}>{children}</KinklistProvider>
  )
}

export default AsyncKinklistProvider
