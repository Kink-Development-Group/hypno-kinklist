import React from 'react'
import VersionDisplay from './VersionDisplay'

const GITHUB_URL = 'https://github.com/Kink-Development-Group/hypno-kinklist'

const Footer: React.FC = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <span>
        <VersionDisplay />
      </span>
      <span className="footer-link">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </span>
      <span>&copy; {year}</span>
    </footer>
  )
}

export default Footer
