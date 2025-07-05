import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { KinksData, LevelsData, Selection } from '../types'
import {
  getAllKinksEnhanced,
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
  // Import-specific function to reset tracking state
  resetImportState: () => void
}

// Helper to get translated level names
const getInitialLevels = (i18n: any): LevelsData => ({
  NotEntered: {
    key: 'notEntered',
    name: i18n.t('legend.notEntered'),
    color: '#FFFFFF',
    class: 'notEntered',
  },
  Favorite: {
    key: 'favorite',
    name: i18n.t('legend.favorite'),
    color: '#6DB5FE',
    class: 'favorite',
  },
  Like: {
    key: 'like',
    name: i18n.t('legend.like'),
    color: '#23FD22',
    class: 'like',
  },
  Okay: {
    key: 'okay',
    name: i18n.t('legend.okay'),
    color: '#FDFD6B',
    class: 'okay',
  },
  Maybe: {
    key: 'maybe',
    name: i18n.t('legend.maybe'),
    color: '#DB6C00',
    class: 'maybe',
  },
  No: {
    key: 'no',
    name: i18n.t('legend.no'),
    color: '#920000',
    class: 'no',
  },
})

export const KinklistContext = createContext<KinklistContextType | undefined>(
  undefined
)

export const KinklistProvider: React.FC<{
  children: React.ReactNode
  initialKinksText: string
}> = ({ children, initialKinksText }) => {
  const [kinks, setKinks] = useState<KinksData>({})
  const { i18n } = useTranslation()
  const errorHandler = useErrorHandler()

  // Use refs to track state
  const isInitialized = useRef(false)
  const isUserInteraction = useRef(false)
  const hasParsedHash = useRef(false)

  // Use translated levels for initial state
  const [levels, setLevels] = useState<LevelsData>(() => getInitialLevels(i18n))
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

  // Function to refresh kinks for current language - ONLY update kinks, never selection
  const refreshKinksForLanguage = useCallback(() => {
    if (enhancedKinks) {
      const resolvedKinks = resolveEnhancedKinksData(
        enhancedKinks,
        i18n.language
      )
      setKinks(resolvedKinks)
      // CRITICAL: DO NOT update selection here - selection must be preserved
    }
  }, [enhancedKinks, i18n.language])

  // Parse initial kinks
  useEffect(() => {
    console.log(
      'parseKinks effect: Starting with text length:',
      originalKinksText.length
    )
    try {
      // Check if the text contains multilingual content
      if (hasMultilingualContent(originalKinksText)) {
        console.log('parseKinks effect: Parsing as enhanced template')
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
          console.log(
            'parseKinks effect: Enhanced kinks set, count:',
            Object.keys(resolvedKinks).length
          )
        }
      } else {
        console.log('parseKinks effect: Parsing as standard template')
        // Parse as standard template
        const parsedKinks = parseKinksTextEnhanced(
          originalKinksText,
          errorHandler
        )
        if (parsedKinks) {
          setKinks(parsedKinks)
          setEnhancedKinks(null) // Clear enhanced data for standard templates
          console.log(
            'parseKinks effect: Standard kinks set, count:',
            Object.keys(parsedKinks).length
          )
        }
      }
    } catch (e) {
      console.error('parseKinks effect: Error parsing kinks text:', e)
      errorHandler(
        `Fehler beim Parsen des Kink-Textes: ${e instanceof Error ? e.message : String(e)}`,
        e
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalKinksText, errorHandler])

  // Handle language changes for enhanced templates - ONLY update kinks, not selection
  useEffect(() => {
    console.log('language change effect: Language changed to:', i18n.language)
    console.log(
      'language change effect: Enhanced kinks available:',
      !!enhancedKinks
    )

    if (enhancedKinks) {
      console.log('language change effect: Starting language change process')
      // Refresh kinks for new language
      refreshKinksForLanguage()
    } else {
      console.log('language change effect: Skipping - no enhanced kinks')
    }
  }, [i18n.language, enhancedKinks, refreshKinksForLanguage])

  // Internal setSelection that bypasses tracking (for initialization)
  const setSelectionInternal = useCallback(
    (newSelection: Selection[] | ((prev: Selection[]) => Selection[])) => {
      setSelection(newSelection)
    },
    []
  )

  // Parse hash from URL - only on initial load
  useEffect(() => {
    // Add a small delay to ensure kinks are fully loaded
    const timeoutId = setTimeout(() => {
      console.log(
        'parseHash effect: Starting with kinks length:',
        Object.keys(kinks).length
      )
      console.log('parseHash effect: Current hash:', window.location.hash)
      console.log('parseHash effect: hasParsedHash:', hasParsedHash.current)

      if (Object.keys(kinks).length === 0) {
        console.log('parseHash effect: No kinks available, skipping')
        return
      }

      // Only parse hash once, not on every kinks change
      if (hasParsedHash.current) {
        console.log('parseHash effect: Already parsed hash, skipping')
        return
      }

      console.log('parseHash effect: Starting hash parsing')
      console.log('parseHash effect: Current hash:', window.location.hash)

      try {
        const hashSelection = parseHash(levels, kinks, enhancedKinks, selection)

        if (hashSelection) {
          console.log(
            'parseHash effect: Hash parsed successfully, setting selection with',
            hashSelection.length,
            'items'
          )
          console.log(
            'parseHash effect: First few selection items:',
            hashSelection.slice(0, 3).map((s) => ({
              categoryId: s.categoryId,
              kinkId: s.kinkId,
              fieldId: s.fieldId,
              value: s.value,
              hashKey:
                s.categoryId && s.kinkId && s.fieldId
                  ? `${s.categoryId}-${s.kinkId}-${s.fieldId}`
                  : 'missing-ids',
            }))
          )
          setSelectionInternal(hashSelection)
          hasParsedHash.current = true
          isInitialized.current = true
        } else {
          console.log('parseHash effect: No hash selection returned')
          // If no hash, initialize with default selection
          console.log('parseHash effect: Initializing with default selection')
          const defaultSelection = getAllKinksEnhanced(
            kinks,
            levels,
            enhancedKinks,
            selection
          )
          console.log(
            'parseHash effect: Default selection has',
            defaultSelection.length,
            'items'
          )
          setSelectionInternal(defaultSelection)
          hasParsedHash.current = true
          isInitialized.current = true
        }
      } catch (e) {
        console.error('parseHash effect: Error parsing hash:', e)
        errorHandler(
          `Fehler beim Laden des URL-Hashes: ${e instanceof Error ? e.message : String(e)}`,
          e
        )
        // Initialize with default selection on error
        console.log(
          'parseHash effect: Error fallback - initializing with default selection'
        )
        const defaultSelection = getAllKinksEnhanced(
          kinks,
          levels,
          enhancedKinks,
          selection
        )
        console.log(
          'parseHash effect: Error fallback selection has',
          defaultSelection.length,
          'items'
        )
        setSelectionInternal(defaultSelection)
        hasParsedHash.current = true
        isInitialized.current = true
      }
    }, 50) // Small delay to ensure kinks are loaded

    return () => clearTimeout(timeoutId)
  }, [
    kinks,
    levels,
    errorHandler,
    enhancedKinks,
    selection,
    setSelectionInternal,
  ])

  // Update selectedKink after language change to ensure comments are preserved in modals
  useEffect(() => {
    // Only update if we have a selectedKink and modals are open
    if (selectedKink && (isCommentOverlayOpen || isInputOverlayOpen)) {
      // Find the corresponding selection in the current selection array using stable IDs
      const updatedSelection = selection.find(
        (s) =>
          s.categoryId === selectedKink.categoryId &&
          s.kinkId === selectedKink.kinkId &&
          s.fieldId === selectedKink.fieldId
      )

      if (updatedSelection) {
        // Update selectedKink with the current selection data (preserving comments)
        setSelectedKink(updatedSelection)
      }
    }
  }, [
    selection,
    selectedKink,
    isCommentOverlayOpen,
    isInputOverlayOpen,
    setSelectedKink,
  ])

  // Update hash when selection changes - but only for user interactions
  useEffect(() => {
    console.log(
      'hash update effect: Selection changed, length:',
      selection.length
    )
    console.log('hash update effect: isInitialized:', isInitialized.current)
    console.log(
      'hash update effect: isUserInteraction:',
      isUserInteraction.current
    )

    // Only update hash if:
    // 1. We're initialized
    // 2. Selection has actual content
    // 3. This is a user interaction (not initialization)
    if (
      isInitialized.current &&
      selection.length > 0 &&
      isUserInteraction.current
    ) {
      try {
        console.log(
          'hash update effect: Updating hash with',
          selection.length,
          'items'
        )
        updateHash(selection, levels)
      } catch (e) {
        console.error('hash update effect: Error updating hash:', e)
      }
    } else {
      console.log(
        'hash update effect: Skipping hash update - conditions not met'
      )
    }
  }, [selection, levels])

  // Update levels when language changes
  useEffect(() => {
    setLevels(getInitialLevels(i18n))
  }, [i18n])

  // Function to reset import-related state tracking
  const resetImportState = useCallback(() => {
    console.log('Resetting import state tracking...')
    isInitialized.current = false
    isUserInteraction.current = false
    hasParsedHash.current = false
  }, [])

  // Custom setSelection that tracks user interactions
  const setSelectionWithTracking = useCallback(
    (newSelection: Selection[] | ((prev: Selection[]) => Selection[])) => {
      // Mark this as a user interaction
      isUserInteraction.current = true

      // Update the selection
      setSelection(newSelection)

      // Reset the flag after a short delay
      setTimeout(() => {
        isUserInteraction.current = false
      }, 100)
    },
    []
  )

  return (
    <KinklistContext.Provider
      value={{
        kinks,
        setKinks,
        levels,
        setLevels,
        selection,
        setSelection: setSelectionWithTracking,
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
        resetImportState,
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
