import React from 'react'
import { useTranslation } from 'react-i18next'
import { KinklistProvider } from '../context/KinklistContext'
import { getKinkTemplate } from '../utils/kinkTemplates'

interface I18nKinklistProviderProps {
  children: React.ReactNode
}

const I18nKinklistProvider: React.FC<I18nKinklistProviderProps> = ({
  children,
}) => {
  const { i18n } = useTranslation()
  const currentTemplate = getKinkTemplate(i18n.language)

  return (
    <KinklistProvider initialKinksText={currentTemplate}>
      {children}
    </KinklistProvider>
  )
}

export default I18nKinklistProvider
