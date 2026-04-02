import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import KinkListEditor from './KinkListEditor'
import { registerKinkListLanguage } from './KinkListLanguage'

let mockEditor: Record<string, unknown>
let mockMonaco: Record<string, unknown>
let completionProviderDisposable: { dispose: ReturnType<typeof vi.fn> }
let codeActionProviderDisposable: { dispose: ReturnType<typeof vi.fn> }
let hoverProviderDisposables: Array<{ dispose: ReturnType<typeof vi.fn> }>
let contentChangeDisposables: Array<{ dispose: ReturnType<typeof vi.fn> }>

vi.mock('@monaco-editor/react', async () => {
  const React = await import('react')

  const MockEditor = (props: Record<string, unknown>) => {
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
}))

describe('KinkListEditor disposables', () => {
  beforeEach(() => {
    hoverProviderDisposables = []
    contentChangeDisposables = []

    completionProviderDisposable = { dispose: vi.fn() }
    codeActionProviderDisposable = { dispose: vi.fn() }

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
        tokenize: vi.fn(() => [[]]),
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
      getModel: vi.fn(() => ({ uri: 'model://kinklist' })),
      updateOptions: vi.fn(),
      addCommand: vi.fn(),
      trigger: vi.fn(),
      focus: vi.fn(),
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn(() => {
        const disposable = { dispose: vi.fn() }
        contentChangeDisposables.push(disposable)
        return disposable
      }),
    }
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
      { uri: 'model://kinklist' },
      'custom-kinklist'
    )
  })
})
