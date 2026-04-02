import React, { createContext, useContext, useEffect, useState } from 'react'

type ThemeType = 'light' | 'dark'

const getThemeStorage = (): Pick<Storage, 'getItem' | 'setItem'> | null => {
  if (typeof window === 'undefined') {
    return null
  }

  let storage: Storage | null = null

  try {
    storage = window.localStorage
  } catch {
    return null
  }

  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function'
  ) {
    return storage
  }

  return null
}

const getStoredTheme = (): ThemeType | null => {
  try {
    const savedTheme = getThemeStorage()?.getItem('theme')

    return savedTheme === 'dark' || savedTheme === 'light'
      ? (savedTheme as ThemeType)
      : null
  } catch {
    return null
  }
}

const persistTheme = (theme: ThemeType): void => {
  try {
    getThemeStorage()?.setItem('theme', theme)
  } catch {
    // Ignore storage access issues in tests/SSR/private mode.
  }
}

const getPrefersDarkMediaQuery = (): MediaQueryList | null => {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null
  }

  return window.matchMedia('(prefers-color-scheme: dark)')
}

interface ThemeContextType {
  theme: ThemeType
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Lese gespeichertes Theme aus dem localStorage oder verwende 'light' als Fallback
  const [theme, setTheme] = useState<ThemeType>(() => {
    return getStoredTheme() ?? 'light'
  })

  // Theme wechseln
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      persistTheme(newTheme)
      return newTheme
    })
  }

  // Das Theme-Attribut im HTML-Element setzen
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Überwachen der Systemeinstellungen für Farbschema-Präferenzen
  useEffect(() => {
    const mediaQuery = getPrefersDarkMediaQuery()

    if (!mediaQuery) {
      return
    }

    const handleChange = () => {
      if (!getStoredTheme()) {
        setTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    // Initialisieren
    if (!getStoredTheme()) {
      handleChange()
    }

    // Listener für Änderungen
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error(
      'useTheme muss innerhalb eines ThemeProviders verwendet werden'
    )
  }
  return context
}
