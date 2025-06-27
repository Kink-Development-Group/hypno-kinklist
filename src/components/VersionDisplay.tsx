import React from 'react'
import { useTranslation } from 'react-i18next'
import { getAppVersion } from '../utils/version'
import Tooltip from './Tooltip'

const VersionDisplay: React.FC = () => {
  const { t } = useTranslation()
  const version = getAppVersion()
  return (
    <Tooltip content={t('app.version')}>
      <span className="version-display">v{version}</span>
    </Tooltip>
  )
}

export default VersionDisplay
