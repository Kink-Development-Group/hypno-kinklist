import { render } from '@testing-library/react'
import { act, createRef } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import i18n from '../../i18n'
import KinkListEditor from './KinkListEditor'
import type { KinkListEditorRef } from './KinkListEditor'
import {
  registerKinkListLanguage,
  validateKinkListSyntax,
} from './KinkListLanguage'

let mockEditor: Record<string, unknown>
let mockMonaco: Record<string, unknown>
let latestEditorProps: Record<string, unknown> | null
let completionProviderDisposable: { dispose: ReturnType<typeof vi.fn> }
let codeActionProviderDisposable: { dispose: ReturnType<typeof vi.fn> }
let hoverProviderDisposables: Array<{ dispose: ReturnType<typeof vi.fn> }>
let contentChangeDisposables: Array<{ dispose: ReturnType<typeof vi.fn> }>
let contentChangeCallbacks: Array<() => void>

vi.mock('@monaco-editor/react', async () => {
  const React = await import('react')

  const MockEditor = (props: Record<string, unknown>) => {
    latestEditorProps = props

    React.useEffect(() => {
      ;(props.beforeMount as ((monaco: unknown) => void) | undefined)?.(
        mockMonaco
      )
      ;(
        props.onMount as
          | ((editor: unknown, monaco: unknown) => void)
          | undefined
      )?.(mockEditor, mockMonaco)
    })

    return <div data-testid="monaco-editor" />
  }

  return {
    __esModule: true,
    default: MockEditor,
  }
})

vi.mock('./KinkListLanguage', () => ({
  registerKinkListLanguage: vi.fn(() => 'kinklist'),
  registerKinkListThemes: vi.fn(),
  validateKinkListSyntax: vi.fn(() => []),
}))

describe('KinkListEditor disposables', () => {
  beforeEach(() => {
    latestEditorProps = null
    hoverProviderDisposables = []
    contentChangeDisposables = []
    contentChangeCallbacks = []

    completionProviderDisposable = { dispose: vi.fn() }
    codeActionProviderDisposable = { dispose: vi.fn() }

    const model = {
      uri: 'model://kinklist',
      getValue: vi.fn(() => ''),
    }

    mockMonaco = {
      languages: {
        registerCompletionItemProvider: vi.fn(
          () => completionProviderDisposable
        ),
        registerCodeActionProvider: vi.fn(() => codeActionProviderDisposable),
        registerHoverProvider: vi.fn(() => {
          const disposable = { dispose: vi.fn() }
          hoverProviderDisposables.push(disposable)
          return disposable
        }),
      },
      editor: {
        setTheme: vi.fn(),
        setModelLanguage: vi.fn(),
        setModelMarkers: vi.fn(),
        tokenize: vi.fn(() => [[]]),
      },
      MarkerSeverity: {
        Error: 8,
      },
      KeyMod: {
        CtrlCmd: 1,
        Alt: 2,
        Shift: 4,
      },
      KeyCode: {
        KeyK: 11,
        KeyF: 12,
      },
      Range: class {
        constructor(
          public startLineNumber: number,
          public startColumn: number,
          public endLineNumber: number,
          public endColumn: number
        ) {}
      },
    }

    mockEditor = {
      getModel: vi.fn(() => model),
      updateOptions: vi.fn(),
      addCommand: vi.fn(),
      trigger: vi.fn(),
      focus: vi.fn(),
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn((callback: () => void) => {
        const disposable = { dispose: vi.fn() }
        contentChangeCallbacks.push(callback)
        contentChangeDisposables.push(disposable)
        return disposable
      }),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('disposes editor listeners on remount and all disposables on unmount', () => {
    const onChange = vi.fn()
    const { rerender, unmount } = render(
      <KinkListEditor value="first" onChange={onChange} />
    )

    expect(contentChangeDisposables).toHaveLength(1)
    expect(hoverProviderDisposables).toHaveLength(1)

    rerender(<KinkListEditor value="second" onChange={onChange} />)

    expect(contentChangeDisposables[0].dispose).toHaveBeenCalledTimes(1)
    expect(hoverProviderDisposables[0].dispose).toHaveBeenCalledTimes(1)
    expect(contentChangeDisposables).toHaveLength(2)
    expect(hoverProviderDisposables).toHaveLength(2)

    unmount()

    expect(contentChangeDisposables[1].dispose).toHaveBeenCalledTimes(1)
    expect(hoverProviderDisposables[1].dispose).toHaveBeenCalledTimes(1)
    expect(completionProviderDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(codeActionProviderDisposable.dispose).toHaveBeenCalledTimes(1)
  })

  test('uses the registered language id consistently for providers and the model', () => {
    vi.mocked(registerKinkListLanguage).mockReturnValue('custom-kinklist')

    render(<KinkListEditor value="first" onChange={vi.fn()} />)

    expect(
      (mockMonaco as any).languages.registerCompletionItemProvider
    ).toHaveBeenCalledWith('custom-kinklist', expect.any(Object))
    expect(
      (mockMonaco as any).languages.registerCodeActionProvider
    ).toHaveBeenCalledWith('custom-kinklist', expect.any(Object))
    expect((mockMonaco as any).editor.setModelLanguage).toHaveBeenCalledWith(
      expect.objectContaining({ uri: 'model://kinklist' }),
      'custom-kinklist'
    )
    expect(latestEditorProps?.language).toBe('custom-kinklist')
  })

  test('uses the light theme when matchMedia is unavailable in auto mode', () => {
    const originalMatchMedia = window.matchMedia

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    })

    try {
      render(<KinkListEditor value="first" onChange={vi.fn()} theme="auto" />)

      expect((mockMonaco as any).editor.setTheme).toHaveBeenCalledWith(
        'kink-list-light'
      )
      expect(latestEditorProps?.theme).toBe('kink-list-light')
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      })
    }
  })

  test('formats through onChange without directly setting the editor value', () => {
    const onChange = vi.fn()
    const ref = createRef<KinkListEditorRef>()
    const getValueMock = mockEditor.getValue as ReturnType<typeof vi.fn>

    getValueMock.mockReturnValue('  # Cat')

    render(<KinkListEditor ref={ref} value="  # Cat" onChange={onChange} />)

    act(() => {
      ref.current?.formatCode()
    })

    expect(onChange).toHaveBeenCalledWith('# Cat')
    expect(mockEditor.setValue).not.toHaveBeenCalled()
  })

  test('sets Monaco markers and reports validation errors', () => {
    vi.mocked(validateKinkListSyntax).mockReturnValue([
      {
        severity: 8,
        message: 'Kategorie muss einen Namen haben',
        startLineNumber: 2,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 2,
      },
    ] as ReturnType<typeof validateKinkListSyntax>)

    const onValidationChange = vi.fn()

    render(
      <KinkListEditor
        value="#\n#"
        onChange={vi.fn()}
        onValidationChange={onValidationChange}
      />
    )

    expect(vi.mocked(validateKinkListSyntax)).toHaveBeenCalled()
    expect((mockMonaco as any).editor.setModelMarkers).toHaveBeenCalledWith(
      expect.objectContaining({ uri: 'model://kinklist' }),
      'kinklist',
      [
        expect.objectContaining({
          message: 'Kategorie muss einen Namen haben',
          startLineNumber: 2,
        }),
      ]
    )
    expect(onValidationChange).toHaveBeenCalledWith(false, [
      i18n.t('editor.validation.lineMessage', {
        lineNumber: 2,
        message: 'Kategorie muss einen Namen haben',
      }),
    ])
  })

  test('imperative validate uses current validator markers', () => {
    vi.mocked(validateKinkListSyntax).mockReturnValue([
      {
        severity: 8,
        message: 'Kink-Eintrag muss einen Namen haben',
        startLineNumber: 3,
        startColumn: 1,
        endLineNumber: 3,
        endColumn: 2,
      },
    ] as ReturnType<typeof validateKinkListSyntax>)

    const ref = createRef<KinkListEditorRef>()

    render(<KinkListEditor ref={ref} value="# Cat\n()\n*" onChange={vi.fn()} />)

    expect(ref.current?.validate()).toEqual({
      isValid: false,
      errors: [
        i18n.t('editor.validation.lineMessage', {
          lineNumber: 3,
          message: 'Kink-Eintrag muss einen Namen haben',
        }),
      ],
    })
  })

  test('debounces validation on content changes', () => {
    vi.useFakeTimers()
    vi.mocked(validateKinkListSyntax).mockReturnValue([])

    render(
      <KinkListEditor
        value="content"
        onChange={vi.fn()}
        onValidationChange={vi.fn()}
      />
    )

    const initialValidationCalls = vi.mocked(validateKinkListSyntax).mock.calls
      .length
    const contentChangeCallback =
      contentChangeCallbacks[contentChangeCallbacks.length - 1]

    expect(contentChangeCallback).toBeDefined()
    if (!contentChangeCallback) {
      throw new Error(
        'Expected Monaco content change callback to be registered'
      )
    }

    act(() => {
      contentChangeCallback()
      contentChangeCallback()
      vi.advanceTimersByTime(199)
    })

    expect(validateKinkListSyntax).toHaveBeenCalledTimes(initialValidationCalls)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(validateKinkListSyntax).toHaveBeenCalledTimes(
      initialValidationCalls + 1
    )
  })
})
