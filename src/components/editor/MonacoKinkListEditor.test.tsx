import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import MonacoKinkListEditor from './MonacoKinkListEditor'

let mockEditor: Record<string, unknown>
let mockMonaco: Record<string, unknown>
let onDidChangeModelContentDisposables: Array<{
  dispose: ReturnType<typeof vi.fn>
}>

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
    validateKinkListSyntaxMock.mockReset()

    const model = {
      getValue: vi.fn(() => 'content'),
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
      updateOptions: vi.fn(),
      onDidChangeModelContent: vi.fn(() => {
        const disposable = { dispose: vi.fn() }
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

  test('validates markers and reports errors and warnings', () => {
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
      ['Zeile 1: Error'],
      ['Zeile 2: Warning']
    )
  })

  test('reattaches and disposes content listeners when validation mode changes', () => {
    validateKinkListSyntaxMock.mockReturnValue([])

    const { rerender, unmount } = render(
      <MonacoKinkListEditor value="content" onChange={vi.fn()} showValidation />
    )

    expect(onDidChangeModelContentDisposables).toHaveLength(1)

    rerender(
      <MonacoKinkListEditor
        value="content"
        onChange={vi.fn()}
        showValidation={false}
      />
    )

    expect(onDidChangeModelContentDisposables[0].dispose).toHaveBeenCalledTimes(
      1
    )
    expect(onDidChangeModelContentDisposables).toHaveLength(2)

    unmount()

    expect(onDidChangeModelContentDisposables[1].dispose).toHaveBeenCalledTimes(
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
})
