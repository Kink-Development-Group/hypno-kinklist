import { render, screen } from '@testing-library/react'
import { act, createRef } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import MonacoKinkListEditor from './MonacoKinkListEditor'
import type { MonacoKinkListEditorRef } from './MonacoKinkListEditor'
import i18n from '../../i18n'
import {
  registerKinkListLanguage,
  registerKinkListThemes,
} from './KinkListLanguage'

let mockEditor: Record<string, unknown>
let mockMonaco: Record<string, unknown>
let onDidChangeModelContentDisposables: Array<{
  dispose: ReturnType<typeof vi.fn>
}>
let onDidChangeModelContentCallbacks: Array<() => void>

vi.mock('@monaco-editor/react', async () => {
  const React = await import('react')

  const MockEditor = (props: Record<string, unknown>) => {
    const onMount = props.onMount as
      | ((editor: unknown, monaco: unknown) => void)
      | undefined

    React.useEffect(() => {
      onMount?.(mockEditor, mockMonaco)
    }, [onMount])

    return <div data-testid="monaco-editor" />
  }

  return {
    __esModule: true,
    Editor: MockEditor,
    default: MockEditor,
  }
})

const validateKinkListSyntaxMock = vi.fn()

vi.mock('./KinkListLanguage', () => ({
  registerKinkListLanguage: vi.fn(),
  registerKinkListThemes: vi.fn(),
  validateKinkListSyntax: (...args: unknown[]) =>
    validateKinkListSyntaxMock(...args),
}))

describe('MonacoKinkListEditor listeners and validation', () => {
  beforeEach(() => {
    onDidChangeModelContentDisposables = []
    onDidChangeModelContentCallbacks = []
    validateKinkListSyntaxMock.mockReset()
    validateKinkListSyntaxMock.mockReturnValue([])
    vi.mocked(registerKinkListLanguage).mockClear()
    vi.mocked(registerKinkListThemes).mockClear()

    const model = {
      getValue: vi.fn(() => 'content'),
      dispose: vi.fn(),
    }

    mockMonaco = {
      editor: {
        setTheme: vi.fn(),
        createModel: vi.fn(() => model),
        setModelLanguage: vi.fn(),
        setModelMarkers: vi.fn(),
      },
      MarkerSeverity: {
        Error: 8,
        Warning: 4,
      },
      Range: class {},
    }

    mockEditor = {
      focus: vi.fn(),
      getValue: vi.fn(() => 'content'),
      getModel: vi.fn(() => model),
      setModel: vi.fn(),
      setValue: vi.fn(),
      updateOptions: vi.fn(),
      onDidChangeModelContent: vi.fn((callback: () => void) => {
        const disposable = { dispose: vi.fn() }
        onDidChangeModelContentCallbacks.push(callback)
        onDidChangeModelContentDisposables.push(disposable)
        return disposable
      }),
      getSelection: vi.fn(() => null),
      executeEdits: vi.fn(),
      getPosition: vi.fn(() => null),
      revealLineInCenter: vi.fn(),
      setPosition: vi.fn(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('validates markers and reports errors and warnings', async () => {
    await i18n.changeLanguage('en')
    validateKinkListSyntaxMock.mockReturnValue([
      { startLineNumber: 1, message: 'Error', severity: 8 },
      { startLineNumber: 2, message: 'Warning', severity: 4 },
    ])
    const onValidationComplete = vi.fn()

    render(
      <MonacoKinkListEditor
        value="content"
        onChange={vi.fn()}
        onValidationComplete={onValidationComplete}
      />
    )

    expect((mockMonaco as any).editor.setModelMarkers).toHaveBeenCalled()
    expect(onValidationComplete).toHaveBeenCalledWith(
      ['Line 1: Error'],
      ['Line 2: Warning']
    )
  })

  test('reattaches and disposes content listeners when validation mode changes', () => {
    validateKinkListSyntaxMock.mockReturnValue([])
    const onValidationComplete = vi.fn()

    const { rerender, unmount } = render(
      <MonacoKinkListEditor
        value="content"
        onChange={vi.fn()}
        showValidation
        onValidationComplete={onValidationComplete}
      />
    )

    expect(onDidChangeModelContentDisposables).toHaveLength(1)

    rerender(
      <MonacoKinkListEditor
        value="content"
        onChange={vi.fn()}
        showValidation={false}
        onValidationComplete={onValidationComplete}
      />
    )

    expect(onDidChangeModelContentDisposables[0].dispose).toHaveBeenCalledTimes(
      1
    )
    expect(onDidChangeModelContentDisposables).toHaveLength(1)
    expect((mockMonaco as any).editor.setModelMarkers).toHaveBeenLastCalledWith(
      expect.anything(),
      'kinklist',
      []
    )
    expect(onValidationComplete).toHaveBeenLastCalledWith([], [])

    unmount()

    expect(onDidChangeModelContentDisposables[0].dispose).toHaveBeenCalledTimes(
      1
    )
  })

  test('skips validation callback when no model is available', () => {
    validateKinkListSyntaxMock.mockReturnValue([])
    ;(mockEditor.getModel as ReturnType<typeof vi.fn>).mockReturnValue(null)
    const onValidationComplete = vi.fn()

    render(
      <MonacoKinkListEditor
        value="content"
        onChange={vi.fn()}
        onValidationComplete={onValidationComplete}
      />
    )

    expect(onValidationComplete).not.toHaveBeenCalled()
  })

  test('renders a placeholder overlay only when the editor is empty', () => {
    validateKinkListSyntaxMock.mockReturnValue([])

    const { rerender } = render(
      <MonacoKinkListEditor
        value=""
        onChange={vi.fn()}
        placeholder="Add content"
      />
    )

    expect(screen.getByText('Add content')).toBeInTheDocument()

    rerender(
      <MonacoKinkListEditor
        value="Filled"
        onChange={vi.fn()}
        placeholder="Add content"
      />
    )

    expect(screen.queryByText('Add content')).not.toBeInTheDocument()
  })

  test('debounces validation on content changes', () => {
    vi.useFakeTimers()
    validateKinkListSyntaxMock.mockReturnValue([])

    render(<MonacoKinkListEditor value="content" onChange={vi.fn()} />)

    const initialValidationCalls = validateKinkListSyntaxMock.mock.calls.length
    const contentChangeCallback =
      onDidChangeModelContentCallbacks[
        onDidChangeModelContentCallbacks.length - 1
      ]

    expect(contentChangeCallback).toBeDefined()

    act(() => {
      contentChangeCallback?.()
      contentChangeCallback?.()
      vi.advanceTimersByTime(199)
    })

    expect(validateKinkListSyntaxMock).toHaveBeenCalledTimes(
      initialValidationCalls
    )

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(validateKinkListSyntaxMock).toHaveBeenCalledTimes(
      initialValidationCalls + 1
    )
  })

  test('does not attach a content listener when validation is disabled', () => {
    const onValidationComplete = vi.fn()

    render(
      <MonacoKinkListEditor
        value="content"
        onChange={vi.fn()}
        showValidation={false}
        onValidationComplete={onValidationComplete}
      />
    )

    expect(onDidChangeModelContentDisposables).toHaveLength(0)
    expect(
      mockEditor.onDidChangeModelContent as ReturnType<typeof vi.fn>
    ).not.toHaveBeenCalled()
    expect((mockMonaco as any).editor.setModelMarkers).toHaveBeenLastCalledWith(
      expect.anything(),
      'kinklist',
      []
    )
    expect(onValidationComplete).toHaveBeenLastCalledWith([], [])
  })

  test('disposes only models created by the editor on unmount', () => {
    const createdModel = {
      getValue: vi.fn(() => 'content'),
      dispose: vi.fn(),
    }
    const createModelMock = (mockMonaco as any).editor
      .createModel as ReturnType<typeof vi.fn>

    ;(mockEditor.getModel as ReturnType<typeof vi.fn>).mockReturnValue(null)
    createModelMock.mockReturnValue(createdModel)

    const { unmount } = render(
      <MonacoKinkListEditor value="content" onChange={vi.fn()} />
    )

    expect(mockEditor.setModel).toHaveBeenCalledWith(createdModel)

    unmount()

    expect(createdModel.dispose).toHaveBeenCalledTimes(1)
  })

  test('formats through onChange without directly setting the editor value', () => {
    const onChange = vi.fn()
    const ref = createRef<MonacoKinkListEditorRef>()
    const getValueMock = mockEditor.getValue as ReturnType<typeof vi.fn>

    getValueMock.mockReturnValue('  # Cat')

    render(
      <MonacoKinkListEditor ref={ref} value="  # Cat" onChange={onChange} />
    )

    act(() => {
      ref.current?.formatCode()
    })

    expect(onChange).toHaveBeenCalledWith('# Cat')
    expect(mockEditor.setValue).not.toHaveBeenCalled()
  })

  test('uses light theme when matchMedia is undefined in auto theme mode', () => {
    const originalMatchMedia = window.matchMedia

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    })

    try {
      render(
        <MonacoKinkListEditor value="content" onChange={vi.fn()} theme="auto" />
      )

      expect((mockMonaco as any).editor.setTheme).toHaveBeenCalledWith(
        'kink-list-light'
      )
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      })
    }
  })

  test('registers language and themes only once across remounts', () => {
    const { unmount } = render(
      <MonacoKinkListEditor value="content" onChange={vi.fn()} />
    )

    unmount()

    render(<MonacoKinkListEditor value="content" onChange={vi.fn()} />)

    expect(vi.mocked(registerKinkListLanguage)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(registerKinkListThemes)).toHaveBeenCalledTimes(1)
  })
})
