import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Selection } from '../types'
import { useKinklist } from '../context/KinklistContext'
import CommentOverlay from './CommentOverlay'

vi.mock('../context/KinklistContext', () => ({
  useKinklist: vi.fn(),
}))

const mockUseKinklist = vi.mocked(useKinklist)

const createMockKinklistContext = (
  overrides: Partial<ReturnType<typeof useKinklist>>
) =>
  ({
    kinks: {},
    setKinks: vi.fn(),
    levels: {},
    setLevels: vi.fn(),
    selection: [],
    setSelection: vi.fn(),
    selectedKink: null,
    setSelectedKink: vi.fn(),
    originalKinksText: '',
    setOriginalKinksText: vi.fn(),
    isEditOverlayOpen: false,
    setIsEditOverlayOpen: vi.fn(),
    isInputOverlayOpen: false,
    setIsInputOverlayOpen: vi.fn(),
    isCommentOverlayOpen: false,
    setIsCommentOverlayOpen: vi.fn(),
    popupIndex: 0,
    setPopupIndex: vi.fn(),
    enhancedKinks: null,
    setEnhancedKinks: vi.fn(),
    refreshKinksForLanguage: vi.fn(),
    hasSavedDraft: false,
    savedDraftAt: null,
    clearSavedDraft: vi.fn(),
    ...overrides,
  }) as unknown as ReturnType<typeof useKinklist>

describe('CommentOverlay stable ID matching', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('saves against empty-string stable IDs even when translated names differ', () => {
    const setSelection = vi.fn()
    const setIsCommentOverlayOpen = vi.fn()
    const setSelectedKink = vi.fn()

    const selection: Selection[] = [
      {
        category: 'Original Category',
        kink: 'Original Kink',
        field: 'Original Field',
        value: 'Favorite',
        showField: true,
        categoryId: '',
        kinkId: '',
        fieldId: '',
      },
    ]

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection,
        setSelection,
        isCommentOverlayOpen: true,
        setIsCommentOverlayOpen,
        selectedKink: {
          category: 'Translated Category',
          kink: 'Translated Kink',
          field: 'Translated Field',
          value: 'Favorite',
          showField: true,
          comment: '',
          categoryId: '',
          kinkId: '',
          fieldId: '',
        },
        setSelectedKink,
      })
    )

    render(<CommentOverlay />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Updated comment' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(setSelection).toHaveBeenCalledWith([
      {
        ...selection[0],
        comment: 'Updated comment',
      },
    ])
    expect(setIsCommentOverlayOpen).toHaveBeenCalledWith(false)
    expect(setSelectedKink).toHaveBeenCalledWith(null)
  })
})
