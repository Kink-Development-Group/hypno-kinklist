import React from 'react'
import { useTranslation } from 'react-i18next'
import { KinklistProvider } from '../context/KinklistContext'
import {
  getEnhancedKinkTemplate,
  getKinkTemplate,
} from '../utils/kinkTemplates'

interface I18nKinklistProviderProps {
  children: React.ReactNode
  useEnhancedTemplate?: boolean
}

const I18nKinklistProvider: React.FC<I18nKinklistProviderProps> = ({
  children,
  useEnhancedTemplate = false,
}) => {
  const { i18n } = useTranslation()

  // Choose template based on setting and current language
  const currentTemplate = useEnhancedTemplate
    ? getEnhancedKinkTemplate()
    : getKinkTemplate(i18n.language)

  return (
    <KinklistProvider initialKinksText={currentTemplate}>
      {children}
    </KinklistProvider>
  )
}

export default I18nKinklistProvider
