import React, { useEffect, useState } from 'react'
import { KinklistProvider } from '../context/KinklistContext'
import { getDefaultKinklistTemplate } from '../utils/defaultTemplate'

interface I18nKinklistProviderProps {
  children: React.ReactNode
}

const I18nKinklistProvider: React.FC<I18nKinklistProviderProps> = ({
  children,
}) => {
  const [template, setTemplate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const templateText = await getDefaultKinklistTemplate()
        setTemplate(templateText)
      } catch (error) {
        console.error('Failed to load template:', error)
        // Fallback to empty template
        setTemplate('')
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <KinklistProvider initialKinksText={template}>{children}</KinklistProvider>
  )
}

export default I18nKinklistProvider
