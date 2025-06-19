import React from 'react'
import { useTranslation } from 'react-i18next'
import { getAppVersion } from '../utils/version'

const VersionDisplay: React.FC = () => {
  const { t } = useTranslation()
  const version = getAppVersion()
  return (
    <span className="version-display" title={t('app.version')}>
      v{version}
    </span>
  )
}

export default VersionDisplay
