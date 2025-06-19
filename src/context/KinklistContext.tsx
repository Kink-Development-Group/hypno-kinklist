import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { KinksData, LevelsData, Selection } from '../types'
import {
  getAllKinks,
  hasMultilingualContent,
  parseHash,
  parseKinksTextEnhanced,
  updateHash,
} from '../utils/index'
import {
  EnhancedKinksData,
  parseEnhancedKinksText,
  resolveEnhancedKinksData,
} from '../utils/multilingualTemplates'
import { useErrorHandler } from '../utils/useErrorHandler'

interface KinklistContextType {
  kinks: KinksData
  setKinks: React.Dispatch<React.SetStateAction<KinksData>>
  levels: LevelsData
  setLevels: React.Dispatch<React.SetStateAction<LevelsData>>
  selection: Selection[]
  setSelection: React.Dispatch<React.SetStateAction<Selection[]>>
  selectedKink: Selection | null
  setSelectedKink: React.Dispatch<React.SetStateAction<Selection | null>>
  originalKinksText: string
  setOriginalKinksText: React.Dispatch<React.SetStateAction<string>>
  isEditOverlayOpen: boolean
  setIsEditOverlayOpen: React.Dispatch<React.SetStateAction<boolean>>
  isInputOverlayOpen: boolean
  setIsInputOverlayOpen: React.Dispatch<React.SetStateAction<boolean>>
  isCommentOverlayOpen: boolean
  setIsCommentOverlayOpen: React.Dispatch<React.SetStateAction<boolean>>
  popupIndex: number
  setPopupIndex: React.Dispatch<React.SetStateAction<number>>
  // Enhanced multilingual support
  enhancedKinks: EnhancedKinksData | null
  setEnhancedKinks: React.Dispatch<
    React.SetStateAction<EnhancedKinksData | null>
  >
  refreshKinksForLanguage: () => void
}

const initialLevels: LevelsData = {
  'Not Entered': { name: 'Not Entered', color: '#FFFFFF', class: 'notEntered' },
  Favorite: { name: 'Favorite', color: '#6DB5FE', class: 'favorite' },
  Like: { name: 'Like', color: '#23FD22', class: 'like' },
  Okay: { name: 'Okay', color: '#FDFD6B', class: 'okay' },
  Maybe: { name: 'Maybe', color: '#DB6C00', class: 'maybe' },
  No: { name: 'No', color: '#920000', class: 'no' },
}

export const KinklistContext = createContext<KinklistContextType | undefined>(
  undefined
)

export const KinklistProvider: React.FC<{
  children: React.ReactNode
  initialKinksText: string
}> = ({ children, initialKinksText }) => {
  const [kinks, setKinks] = useState<KinksData>({})
  const [levels, setLevels] = useState<LevelsData>(initialLevels)
  const [selection, setSelection] = useState<Selection[]>([])
  const [selectedKink, setSelectedKink] = useState<Selection | null>(null)
  const [originalKinksText, setOriginalKinksText] =
    useState<string>(initialKinksText)
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState<boolean>(false)
  const [isInputOverlayOpen, setIsInputOverlayOpen] = useState<boolean>(false)
  const [isCommentOverlayOpen, setIsCommentOverlayOpen] =
    useState<boolean>(false)
  const [popupIndex, setPopupIndex] = useState<number>(0)

  // Enhanced multilingual support
  const [enhancedKinks, setEnhancedKinks] = useState<EnhancedKinksData | null>(
    null
  )
  const { i18n } = useTranslation()
  const errorHandler = useErrorHandler()

  // Function to refresh kinks for current language
  const refreshKinksForLanguage = useCallback(() => {
    if (enhancedKinks) {
      const resolvedKinks = resolveEnhancedKinksData(
        enhancedKinks,
        i18n.language
      )
      setKinks(resolvedKinks)
    }
  }, [enhancedKinks, i18n.language])

  // Parse initial kinks
  useEffect(() => {
    try {
      // Check if the text contains multilingual content
      if (hasMultilingualContent(originalKinksText)) {
        // Parse as enhanced template
        const enhancedData = parseEnhancedKinksText(
          originalKinksText,
          errorHandler
        )
        if (enhancedData) {
          setEnhancedKinks(enhancedData)
          // Resolve to current language
          const resolvedKinks = resolveEnhancedKinksData(
            enhancedData,
            i18n.language
          )
          setKinks(resolvedKinks)
        }
      } else {
        // Parse as standard template
        const parsedKinks = parseKinksTextEnhanced(
          originalKinksText,
          errorHandler
        )
        if (parsedKinks) {
          setKinks(parsedKinks)
          setEnhancedKinks(null) // Clear enhanced data for standard templates
        }
      }
    } catch (e) {
      console.error('Error parsing kinks text:', e)
      errorHandler(
        `Fehler beim Parsen des Kink-Textes: ${e instanceof Error ? e.message : String(e)}`,
        e
      )
    }
  }, [originalKinksText, errorHandler, i18n.language])

  // Handle language changes for enhanced templates
  useEffect(() => {
    if (enhancedKinks) {
      refreshKinksForLanguage()
    }
  }, [i18n.language, enhancedKinks, refreshKinksForLanguage])

  // Parse hash from URL
  useEffect(() => {
    if (Object.keys(kinks).length === 0) return

    try {
      const hashSelection = parseHash(levels, kinks)
      if (hashSelection) {
        setSelection(hashSelection)
      } else {
        // If no hash, initialize with default selection
        setSelection(getAllKinks(kinks, levels))
      }
    } catch (e) {
      console.error('Error parsing hash:', e)
      errorHandler(
        `Fehler beim Laden des URL-Hashes: ${e instanceof Error ? e.message : String(e)}`,
        e
      )
      // Initialize with default selection on error
      setSelection(getAllKinks(kinks, levels))
    }
  }, [kinks, levels, errorHandler])

  // Update hash when selection changes
  useEffect(() => {
    if (selection.length > 0) {
      try {
        updateHash(selection, levels)
      } catch (e) {
        console.error('Error updating hash:', e)
      }
    }
  }, [selection, levels])

  return (
    <KinklistContext.Provider
      value={{
        kinks,
        setKinks,
        levels,
        setLevels,
        selection,
        setSelection,
        selectedKink,
        setSelectedKink,
        originalKinksText,
        setOriginalKinksText,
        isEditOverlayOpen,
        setIsEditOverlayOpen,
        isInputOverlayOpen,
        setIsInputOverlayOpen,
        isCommentOverlayOpen,
        setIsCommentOverlayOpen,
        popupIndex,
        setPopupIndex,
        enhancedKinks,
        setEnhancedKinks,
        refreshKinksForLanguage,
      }}
    >
      {children}
    </KinklistContext.Provider>
  )
}

export const useKinklist = () => {
  const context = useContext(KinklistContext)
  if (context === undefined) {
    throw new Error('useKinklist must be used within a KinklistProvider')
  }
  return context
}
