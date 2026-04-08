import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AdvancedKinkListEditor from './AdvancedKinkListEditor'

const mockFormatCode = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('./EditorToolbar', () => ({
  __esModule: true,
  default: () => <div data-testid="editor-toolbar" />,
}))

vi.mock('./MonacoKinkListEditor', async () => {
  const React = await import('react')

  const MockMonacoKinkListEditor = React.forwardRef(
    (
      props: {
        value: string
        placeholder?: string
      },
      ref: React.ForwardedRef<{ formatCode: () => void; focus: () => void }>
    ) => {
      React.useImperativeHandle(ref, () => ({
        formatCode: mockFormatCode,
        focus: vi.fn(),
      }))

      return (
        <div data-testid="monaco-kinklist-editor">
          {props.placeholder ?? ''}
        </div>
      )
    }
  )

  return {
    __esModule: true,
    default: MockMonacoKinkListEditor,
  }
})

describe('AdvancedKinkListEditor keyboard shortcuts', () => {
  beforeEach(() => {
    mockFormatCode.mockReset()
  })

  test('only handles global formatting shortcuts while active', () => {
    const { rerender } = render(
      <AdvancedKinkListEditor initialValue="content" isActive={false} />
    )

    fireEvent.keyDown(document, {
      key: 'F',
      altKey: true,
      shiftKey: true,
    })

    expect(mockFormatCode).not.toHaveBeenCalled()

    rerender(<AdvancedKinkListEditor initialValue="content" isActive={true} />)

    fireEvent.keyDown(document, {
      key: 'F',
      altKey: true,
      shiftKey: true,
    })

    expect(mockFormatCode).toHaveBeenCalledTimes(1)
  })
})
