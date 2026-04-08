import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import i18n from '../i18n'
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

    const expectedError = i18n.t('import.errors.unsupportedFileType', {
      extension: '(no extension)',
      allowed: '.json, .xml, .csv',
    })

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveTextContent(expectedError)
    })

    expect(mockSetKinks).not.toHaveBeenCalled()
  })
})
