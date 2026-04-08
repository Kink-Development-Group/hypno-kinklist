import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import i18n from '../i18n'
import { Selection } from '../types'
import { useKinklist } from '../context/KinklistContext'
import { getStableIdsFromOriginal } from '../utils/multilingualTemplates'
import KinkRow from './KinkRow'

vi.mock('../context/KinklistContext', () => ({
  useKinklist: vi.fn(),
}))

vi.mock('../utils/multilingualTemplates', () => ({
  getStableIdsFromOriginal: vi.fn(),
}))

vi.mock('./Choice', () => ({
  default: () => <div data-testid="choice" />,
}))

vi.mock('./Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockUseKinklist = vi.mocked(useKinklist)
const mockGetStableIdsFromOriginal = vi.mocked(getStableIdsFromOriginal)

const levels = {
  NotEntered: {
    key: 'notEntered',
    name: 'Not Entered',
    color: '#fff',
    class: 'notEntered',
  },
}

const createMockKinklistContext = (
  overrides: Partial<ReturnType<typeof useKinklist>>
) =>
  ({
    kinks: {},
    setKinks: vi.fn(),
    levels,
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

describe('KinkRow comment selection matching', () => {
  beforeEach(() => {
    mockGetStableIdsFromOriginal.mockReturnValue({
      categoryId: 'cat-1',
      kinkId: 'kink-1',
      fieldId: 'field-1',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('falls back to category/kink/field matching when stable IDs are absent', () => {
    const setSelection = vi.fn()
    const setSelectedKink = vi.fn()
    const setIsCommentOverlayOpen = vi.fn()
    const selection: Selection[] = [
      {
        category: 'Category',
        kink: 'Kink',
        field: 'Field',
        value: 'NotEntered',
        showField: false,
      },
    ]

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection,
        setSelection,
        levels,
        setIsCommentOverlayOpen,
        setSelectedKink,
        enhancedKinks: null,
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow categoryName="Category" kinkName="Kink" fields={['Field']} />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByRole('button'))

    expect(setSelection).not.toHaveBeenCalled()
    expect(setSelectedKink).toHaveBeenCalledWith(selection[0])
    expect(setIsCommentOverlayOpen).toHaveBeenCalledWith(true)
  })

  test('creates a new selection when no stable-ID or fallback match exists', () => {
    const setSelection = vi.fn()
    const setSelectedKink = vi.fn()
    const setIsCommentOverlayOpen = vi.fn()
    const selection: Selection[] = [
      {
        category: 'Other Category',
        kink: 'Other Kink',
        field: 'Other Field',
        value: 'NotEntered',
        showField: false,
      },
    ]

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection,
        setSelection,
        levels,
        setIsCommentOverlayOpen,
        setSelectedKink,
        enhancedKinks: null,
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow categoryName="Category" kinkName="Kink" fields={['Field']} />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByRole('button'))

    const newSelection: Selection = {
      category: 'Category',
      kink: 'Kink',
      field: 'Field',
      value: 'NotEntered',
      showField: false,
      categoryId: 'cat-1',
      kinkId: 'kink-1',
      fieldId: 'field-1',
    }

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater(selection)).toEqual([...selection, newSelection])
    expect(setSelectedKink).toHaveBeenCalledWith(newSelection)
    expect(setIsCommentOverlayOpen).toHaveBeenCalledWith(true)
  })

  test('prefers stable ID matching when IDs are present', () => {
    const setSelection = vi.fn()
    const setSelectedKink = vi.fn()
    const setIsCommentOverlayOpen = vi.fn()
    const matchingSelection: Selection = {
      category: 'Translated Category',
      kink: 'Translated Kink',
      field: 'Translated Field',
      value: 'NotEntered',
      showField: false,
      categoryId: 'cat-1',
      kinkId: 'kink-1',
      fieldId: 'field-1',
    }
    const selection: Selection[] = [
      {
        category: 'Category',
        kink: 'Kink',
        field: 'Field',
        value: 'NotEntered',
        showField: false,
        categoryId: 'cat-2',
        kinkId: 'kink-2',
        fieldId: 'field-2',
      },
      matchingSelection,
    ]

    mockGetStableIdsFromOriginal.mockReturnValue({
      categoryId: 'cat-1',
      kinkId: 'kink-1',
      fieldId: 'field-1',
    })

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection,
        setSelection,
        levels,
        setIsCommentOverlayOpen,
        setSelectedKink,
        enhancedKinks: {},
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow categoryName="Category" kinkName="Kink" fields={['Field']} />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByRole('button'))

    expect(setSelection).not.toHaveBeenCalled()
    expect(setSelectedKink).toHaveBeenCalledWith(matchingSelection)
    expect(setIsCommentOverlayOpen).toHaveBeenCalledWith(true)
  })

  test('falls back to translated-name matching when stable IDs are empty strings', () => {
    const setSelection = vi.fn()
    const setSelectedKink = vi.fn()
    const setIsCommentOverlayOpen = vi.fn()
    const fallbackSelection: Selection = {
      category: 'Category',
      kink: 'Kink',
      field: 'Field',
      value: 'NotEntered',
      showField: false,
      categoryId: '',
      kinkId: '',
      fieldId: '',
    }
    const selection: Selection[] = [
      {
        category: 'Other Category',
        kink: 'Other Kink',
        field: 'Other Field',
        value: 'NotEntered',
        showField: false,
        categoryId: '',
        kinkId: '',
        fieldId: '',
      },
      fallbackSelection,
    ]

    mockGetStableIdsFromOriginal.mockReturnValue({
      categoryId: '',
      kinkId: '',
      fieldId: '',
    })

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection,
        setSelection,
        levels,
        setIsCommentOverlayOpen,
        setSelectedKink,
        enhancedKinks: {},
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow categoryName="Category" kinkName="Kink" fields={['Field']} />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByRole('button'))

    expect(setSelection).not.toHaveBeenCalled()
    expect(setSelectedKink).toHaveBeenCalledWith(fallbackSelection)
    expect(setIsCommentOverlayOpen).toHaveBeenCalledWith(true)
  })

  test('creates a new selection with the semantic notEntered default when levels are reordered', () => {
    const setSelection = vi.fn()
    const setSelectedKink = vi.fn()
    const setIsCommentOverlayOpen = vi.fn()
    const reorderedLevels = {
      Favorite: {
        key: 'favorite',
        name: 'Favorite',
        color: '#00f',
        class: 'favorite',
      },
      NotEntered: levels.NotEntered,
    }

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection: [],
        setSelection,
        levels: reorderedLevels,
        setIsCommentOverlayOpen,
        setSelectedKink,
        enhancedKinks: null,
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow categoryName="Category" kinkName="Kink" fields={['Field']} />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByRole('button'))

    const newSelection: Selection = {
      category: 'Category',
      kink: 'Kink',
      field: 'Field',
      value: 'NotEntered',
      showField: false,
      categoryId: 'cat-1',
      kinkId: 'kink-1',
      fieldId: 'field-1',
    }

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater([])).toEqual([newSelection])
    expect(setSelectedKink).toHaveBeenCalledWith(newSelection)
    expect(setIsCommentOverlayOpen).toHaveBeenCalledWith(true)
  })

  test('renders the description tooltip trigger as the focusable tooltip child', () => {
    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection: [],
        setSelection: vi.fn(),
        levels,
        setIsCommentOverlayOpen: vi.fn(),
        setSelectedKink: vi.fn(),
        enhancedKinks: null,
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow
            categoryName="Category"
            kinkName="Kink"
            fields={['Field']}
            description="Description text"
          />
        </tbody>
      </table>
    )

    const trigger = screen.getByLabelText(i18n.t('comments.showDescription'))

    expect(trigger).toHaveClass('kink-tooltip')
    expect(trigger).toHaveAttribute('tabindex', '0')
    expect(trigger.querySelector('.kink-tooltip-icon')).not.toBeNull()
    expect(trigger.querySelector('.kink-tooltip-icon')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  test('uses trimmed comment metadata consistently for whitespace-only comments', () => {
    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        selection: [
          {
            category: 'Category',
            kink: 'Kink',
            field: 'Field',
            value: 'NotEntered',
            showField: false,
            comment: '   ',
          },
        ],
        enhancedKinks: null,
      })
    )

    render(
      <table>
        <tbody>
          <KinkRow categoryName="Category" kinkName="Kink" fields={['Field']} />
        </tbody>
      </table>
    )

    const commentButton = screen.getByRole('button')

    expect(commentButton).toHaveAttribute('data-has-comment', 'false')
    expect(commentButton).toHaveAttribute('data-comment-length', '0')
  })
})
