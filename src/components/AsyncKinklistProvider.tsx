import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KinklistProvider } from '../context/KinklistContext'
import { debugWarn } from '../utils'
import { getEnhancedKinkTemplate } from '../utils/kinkTemplates'
import { getDefaultKinklistTemplate } from '../utils/defaultTemplate'

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
  const { t } = useTranslation()
  const [template, setTemplate] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isActive = true

    const loadTemplate = async () => {
      try {
        setIsLoading(true)
        const defaultTemplate = await getDefaultKinklistTemplate()

        if (!isActive) {
          return
        }

        setTemplate(defaultTemplate)
      } catch (err) {
        if (!isActive) {
          return
        }

        debugWarn('Error loading template:', err)
        setTemplate(getEnhancedKinkTemplate())
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadTemplate()

    return () => {
      isActive = false
    }
  }, [])

  // Ladezustand anzeigen
  if (isLoading) {
    return (
      <div className="template-loading">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <p>{t('loading.template')}</p>
        </div>
      </div>
    )
  }

  return (
    <KinklistProvider initialKinksText={template}>{children}</KinklistProvider>
  )
}

export default AsyncKinklistProvider
