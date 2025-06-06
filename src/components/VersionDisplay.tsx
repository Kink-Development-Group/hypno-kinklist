import React from 'react'
import { getAppVersion } from '../utils/version'

const VersionDisplay: React.FC = () => {
  const version = getAppVersion()
  return (
    <span className="version-display" title="App-Version">
      v{version}
    </span>
  )
}

export default VersionDisplay
