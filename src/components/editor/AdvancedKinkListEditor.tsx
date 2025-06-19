import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import EditorToolbar from './EditorToolbar'
import { formatKinkListText, validateKinkListText } from './EditorUtils'
import MonacoKinkListEditor, {
  MonacoKinkListEditorRef,
} from './MonacoKinkListEditor'

export interface AdvancedKinkListEditorRef {
  focus: () => void
  getValue: () => string
  setValue: (value: string) => void
  format: () => void
}

interface AdvancedKinkListEditorProps {
  initialValue?: string
  onChange?: (value: string) => void
  onSave?: (value: string) => void
  height?: string | number
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'auto'
  placeholder?: string
  showValidation?: boolean
}

const AdvancedKinkListEditor = forwardRef<
  AdvancedKinkListEditorRef,
  AdvancedKinkListEditorProps
>(
  (
    {
      initialValue = '',
      onChange,
      onSave,
      height = 500,
      readOnly = false,
      theme = 'auto',
      placeholder,
      showValidation = true,
    },
    ref
  ) => {
    const { t } = useTranslation()
    const [value, setValue] = useState(initialValue)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [validationWarnings, setValidationWarnings] = useState<string[]>([])
    const editorRef = useRef<MonacoKinkListEditorRef>(null)

    // Use translation for placeholder if not provided
    const editorPlaceholder = placeholder || t('editor.placeholder')

    // Ref-Methoden für die Parent-Komponente bereitstellen
    useImperativeHandle(
      ref,
      () => ({
        focus: () => editorRef.current?.focus(),
        getValue: () => value,
        setValue: (newValue: string) => setValue(newValue),
        format: () => {
          if (editorRef.current) {
            const formatted = formatKinkListText(value)
            setValue(formatted)
            onChange?.(formatted)
          }
        },
      }),
      [value, onChange]
    )

    // Werte bei Änderung des initialValue aktualisieren
    useEffect(() => {
      setValue(initialValue)
    }, [initialValue])

    // Validierungsresultate aktualisieren
    const handleValidationComplete = (errors: string[], warnings: string[]) => {
      setValidationErrors(errors)
      setValidationWarnings(warnings)
    }

    // Änderungen im Editor verarbeiten
    const handleChange = (newValue: string) => {
      setValue(newValue)

      // Validierung durchführen
      if (showValidation) {
        const validation = validateKinkListText(newValue)
        setValidationErrors(validation.errors)
        setValidationWarnings(validation.warnings)
      }

      // Callback aufrufen
      if (onChange) {
        onChange(newValue)
      }
    }

    // Tastaturkürzel für Speichern und andere Aktionen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleKeyDown = (e: KeyboardEvent) => {
      // Strg+Enter zum Speichern
      if (e.ctrlKey && e.key === 'Enter' && onSave) {
        e.preventDefault()
        onSave(value)
      }

      // Alt+Shift+F zum Formatieren
      if (e.altKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        handleFormat()
      }
    }

    // Formatierung durchführen
    const handleFormat = () => {
      const formatted = formatKinkListText(value)
      setValue(formatted)
      if (onChange) {
        onChange(formatted)
      }
    }

    // Keydown-Event-Listener hinzufügen/entfernen
    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [handleKeyDown])

    return (
      <div className="advanced-kinklist-editor">
        <EditorToolbar
          editorRef={editorRef as React.RefObject<any>}
          onInsertSnippet={(snippet) => {
            handleChange(value + snippet)
          }}
          showValidation={showValidation && validationErrors.length > 0}
          validationErrors={validationErrors}
          theme={theme}
        />

        <MonacoKinkListEditor
          ref={editorRef}
          value={value}
          onChange={handleChange}
          height={height}
          placeholder={editorPlaceholder}
          readOnly={readOnly}
          theme={theme}
          showLineNumbers={true}
          showMinimap={true}
          showValidation={showValidation}
          onValidationComplete={handleValidationComplete}
        />

        {/* Validierungsübersicht, wenn gewünscht */}
        {showValidation && validationWarnings.length > 0 && (
          <div className="validation-summary">
            <div className="validation-warnings">
              <h4>
                {t('editor.validation.warnings')} ({validationWarnings.length})
              </h4>
              <ul>
                {validationWarnings.slice(0, 5).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {validationWarnings.length > 5 && (
                  <li>
                    ...{t('common.and')} {validationWarnings.length - 5}{' '}
                    {t('editor.validation.moreItems')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }
)

AdvancedKinkListEditor.displayName = 'AdvancedKinkListEditor'

export default AdvancedKinkListEditor
