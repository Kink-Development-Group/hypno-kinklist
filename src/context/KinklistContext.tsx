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
  kinklistDraftStore,
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
  hasSavedDraft: boolean
  savedDraftAt: string | null
  clearSavedDraft: () => void
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
  const hasHashOnLoad =
    typeof window !== 'undefined' && window.location.hash.length > 1
  const initialDraft = useRef(kinklistDraftStore.load())

  // Use refs to track state
  const isInitialized = useRef(false)
  const isUserInteraction = useRef(false)
  const hasParsedHash = useRef(false)
  const userInteractionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  // Use translated levels for initial state
  const [levels, setLevels] = useState<LevelsData>(() => getInitialLevels(i18n))
  const [selection, setSelection] = useState<Selection[]>([])
  const [selectedKink, setSelectedKink] = useState<Selection | null>(null)
  const [originalKinksText, setOriginalKinksText] = useState<string>(() => {
    if (hasHashOnLoad) {
      return initialKinksText
    }

    return initialDraft.current?.originalKinksText ?? initialKinksText
  })
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState<boolean>(false)
  const [isInputOverlayOpen, setIsInputOverlayOpen] = useState<boolean>(false)
  const [isCommentOverlayOpen, setIsCommentOverlayOpen] =
    useState<boolean>(false)
  const [popupIndex, setPopupIndex] = useState<number>(0)
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(
    () => initialDraft.current !== null
  )
  const [savedDraftAt, setSavedDraftAt] = useState<string | null>(
    () => initialDraft.current?.savedAt ?? null
  )

  // Enhanced multilingual support
  const [enhancedKinks, setEnhancedKinks] = useState<EnhancedKinksData | null>(
    null
  )

  const clearSavedDraft = useCallback(() => {
    kinklistDraftStore.clear()
    initialDraft.current = null
    setHasSavedDraft(false)
    setSavedDraftAt(null)
  }, [])

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
      errorHandler(
        `Fehler beim Parsen des Kink-Textes: ${e instanceof Error ? e.message : String(e)}`,
        e
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalKinksText, errorHandler])

  // Handle language changes for enhanced templates - ONLY update kinks, not selection
  useEffect(() => {
    if (enhancedKinks) {
      // Refresh kinks for new language
      refreshKinksForLanguage()
    }
  }, [i18n.language, enhancedKinks, refreshKinksForLanguage])

  useEffect(() => {
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current)
      }
    }
  }, [])

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
      if (Object.keys(kinks).length === 0) {
        return
      }

      // Only parse hash once, not on every kinks change
      if (hasParsedHash.current) {
        return
      }

      try {
        const hasUrlHash = window.location.hash.length > 1
        const hashSelection = parseHash(levels, kinks, enhancedKinks, selection)

        if (hashSelection) {
          setSelectionInternal(hashSelection)
          hasParsedHash.current = true
          isInitialized.current = true
        } else {
          const draftSelection =
            !hasUrlHash && initialDraft.current?.selection.length
              ? getAllKinksEnhanced(
                  kinks,
                  levels,
                  enhancedKinks,
                  initialDraft.current.selection
                )
              : null

          setSelectionInternal(
            draftSelection && draftSelection.length > 0
              ? draftSelection
              : getAllKinksEnhanced(kinks, levels, enhancedKinks, selection)
          )
          hasParsedHash.current = true
          isInitialized.current = true
        }
      } catch (e) {
        errorHandler(
          `Fehler beim Laden des URL-Hashes: ${e instanceof Error ? e.message : String(e)}`,
          e
        )
        // Initialize with default selection on error
        const defaultSelection = getAllKinksEnhanced(
          kinks,
          levels,
          enhancedKinks,
          selection
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
        updateHash(selection, levels)
      } catch {
        // Ignore hash update failures silently; the current in-memory state remains intact.
      }
    }
  }, [selection, levels])

  useEffect(() => {
    if (!isInitialized.current) {
      return
    }

    const defaultLevel = Object.keys(levels)[0]

    if (!defaultLevel) {
      return
    }

    const hasSelectionChanges = selection.some((item) => {
      return item.value !== defaultLevel || Boolean(item.comment?.trim())
    })
    const hasTemplateChanges = originalKinksText !== initialKinksText

    if (!hasSelectionChanges && !hasTemplateChanges) {
      clearSavedDraft()
      return
    }

    if (!isUserInteraction.current && !hasTemplateChanges) {
      return
    }

    const draft = kinklistDraftStore.save(originalKinksText, selection)
    setHasSavedDraft(true)
    setSavedDraftAt(draft.savedAt)
  }, [clearSavedDraft, initialKinksText, levels, originalKinksText, selection])

  // Update levels when language changes
  useEffect(() => {
    setLevels(getInitialLevels(i18n))
  }, [i18n])

  // Custom setSelection that tracks user interactions
  const setSelectionWithTracking = useCallback(
    (newSelection: Selection[] | ((prev: Selection[]) => Selection[])) => {
      // Mark this as a user interaction
      isUserInteraction.current = true

      // Update the selection
      setSelection(newSelection)

      // Reset the flag after a short delay
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current)
      }

      userInteractionTimeoutRef.current = setTimeout(() => {
        isUserInteraction.current = false
        userInteractionTimeoutRef.current = null
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
        hasSavedDraft,
        savedDraftAt,
        clearSavedDraft,
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
