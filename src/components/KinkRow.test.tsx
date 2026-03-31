import { fireEvent, screen } from '@testing-library/dom'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
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
})
