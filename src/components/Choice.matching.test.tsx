import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Selection } from '../types'
import { useKinklist } from '../context/KinklistContext'
import { getStableIdsFromOriginal } from '../utils/multilingualTemplates'
import Choice from './Choice'

vi.mock('../context/KinklistContext', () => ({
  useKinklist: vi.fn(),
}))

vi.mock('../utils/multilingualTemplates', () => ({
  getStableIdsFromOriginal: vi.fn(),
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
  Favorite: {
    key: 'favorite',
    name: 'Favorite',
    color: '#00f',
    class: 'favorite',
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

describe('Choice stable ID matching', () => {
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

  test('updates the stable-ID-matched selection even when names differ', () => {
    const setSelection = vi.fn()
    const selection: Selection[] = [
      {
        category: 'Translated Category',
        kink: 'Translated Kink',
        field: 'Translated Field',
        value: 'NotEntered',
        showField: false,
        categoryId: 'cat-1',
        kinkId: 'kink-1',
        fieldId: 'field-1',
      },
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
    ]

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        levels,
        selection,
        setSelection,
        enhancedKinks: {},
      })
    )

    render(
      <Choice
        field="Field"
        categoryName="Category"
        kinkName="Kink"
        showField={false}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /favorite/i }))

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater(selection)).toEqual([
      {
        ...selection[0],
        value: 'Favorite',
      },
      selection[1],
    ])
  })

  test('populates missing stable IDs when updating a name-matched selection', () => {
    const setSelection = vi.fn()
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
        levels,
        selection,
        setSelection,
        enhancedKinks: {},
      })
    )

    render(
      <Choice
        field="Field"
        categoryName="Category"
        kinkName="Kink"
        showField={false}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /favorite/i }))

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater(selection)).toEqual([
      {
        ...selection[0],
        value: 'Favorite',
        categoryId: 'cat-1',
        kinkId: 'kink-1',
        fieldId: 'field-1',
      },
    ])
  })

  test('backfills empty-string stable IDs when updating a name-matched selection', () => {
    const setSelection = vi.fn()
    const selection: Selection[] = [
      {
        category: 'Category',
        kink: 'Kink',
        field: 'Field',
        value: 'NotEntered',
        showField: false,
        categoryId: '',
        kinkId: '',
        fieldId: '',
      },
    ]

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        levels,
        selection,
        setSelection,
        enhancedKinks: {},
      })
    )

    render(
      <Choice
        field="Field"
        categoryName="Category"
        kinkName="Kink"
        showField={false}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /favorite/i }))

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater(selection)).toEqual([
      {
        ...selection[0],
        value: 'Favorite',
        categoryId: 'cat-1',
        kinkId: 'kink-1',
        fieldId: 'field-1',
      },
    ])
  })

  test('falls back to name matching when stable IDs are empty strings', () => {
    const setSelection = vi.fn()
    const selection: Selection[] = [
      {
        category: 'Category',
        kink: 'Kink',
        field: 'Field',
        value: 'NotEntered',
        showField: false,
        categoryId: '',
        kinkId: '',
        fieldId: '',
      },
      {
        category: 'Translated Category',
        kink: 'Translated Kink',
        field: 'Translated Field',
        value: 'NotEntered',
        showField: false,
        categoryId: 'other-cat',
        kinkId: 'other-kink',
        fieldId: 'other-field',
      },
    ]

    mockGetStableIdsFromOriginal.mockReturnValue({
      categoryId: '',
      kinkId: '',
      fieldId: '',
    })

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        levels,
        selection,
        setSelection,
        enhancedKinks: {},
      })
    )

    render(
      <Choice
        field="Field"
        categoryName="Category"
        kinkName="Kink"
        showField={false}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /favorite/i }))

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater(selection)).toEqual([
      {
        ...selection[0],
        value: 'Favorite',
        categoryId: '',
        kinkId: '',
        fieldId: '',
      },
      selection[1],
    ])
  })

  test('defaults to the semantic notEntered level when level order differs', () => {
    const reorderedLevels = {
      Favorite: levels.Favorite,
      NotEntered: levels.NotEntered,
    }

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        levels: reorderedLevels,
        selection: [],
        setSelection: vi.fn(),
        enhancedKinks: {},
      })
    )

    render(
      <Choice
        field="Field"
        categoryName="Category"
        kinkName="Kink"
        showField={false}
      />
    )

    const notEnteredButton = screen.getByRole('radio', { name: /not entered/i })
    const favoriteButton = screen.getByRole('radio', { name: /favorite/i })

    expect(notEnteredButton).toHaveAttribute('aria-checked', 'true')
    expect(notEnteredButton).toHaveAttribute('tabindex', '0')
    expect(favoriteButton).toHaveAttribute('aria-checked', 'false')
  })

  test('falls back safely when stable ID lookup returns undefined', () => {
    const setSelection = vi.fn()
    const selection: Selection[] = [
      {
        category: 'Category',
        kink: 'Kink',
        field: 'Field',
        value: 'NotEntered',
        showField: false,
      },
    ]

    mockGetStableIdsFromOriginal.mockImplementation(
      () => undefined as unknown as ReturnType<typeof getStableIdsFromOriginal>
    )

    mockUseKinklist.mockReturnValue(
      createMockKinklistContext({
        levels,
        selection,
        setSelection,
        enhancedKinks: {},
      })
    )

    render(
      <Choice
        field="Field"
        categoryName="Category"
        kinkName="Kink"
        showField={false}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /favorite/i }))

    const selectionUpdater = vi.mocked(setSelection).mock.calls[0][0] as (
      currentSelection: Selection[]
    ) => Selection[]

    expect(selectionUpdater(selection)).toEqual([
      {
        ...selection[0],
        value: 'Favorite',
      },
    ])
  })
})
