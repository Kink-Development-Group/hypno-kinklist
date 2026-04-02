import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ImportModal from './ImportModal'

const mockSetKinks = vi.fn()
const mockSetLevels = vi.fn()
const mockSetSelection = vi.fn()
const mockSetOriginalKinksText = vi.fn()

vi.mock('../context/KinklistContext', () => ({
  useKinklist: () => ({
    setKinks: mockSetKinks,
    setLevels: mockSetLevels,
    setSelection: mockSetSelection,
    setOriginalKinksText: mockSetOriginalKinksText,
  }),
}))

describe('ImportModal file validation', () => {
  beforeEach(() => {
    mockSetKinks.mockReset()
    mockSetLevels.mockReset()
    mockSetSelection.mockReset()
    mockSetOriginalKinksText.mockReset()
  })

  test('shows a clear error for dropped files without an extension', async () => {
    render(<ImportModal open={true} onClose={vi.fn()} />)

    const overlay = screen.getByRole('dialog')
    const file = new File(['plain text'], 'importfile', { type: 'text/plain' })

    fireEvent.drop(overlay, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'Unsupported file type: (no extension). Allowed: .json, .xml, .csv'
      )
    })

    expect(mockSetKinks).not.toHaveBeenCalled()
  })
})
