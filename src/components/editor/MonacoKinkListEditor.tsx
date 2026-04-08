import { Editor, Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { formatKinkListText } from './EditorUtils'
import {
  registerKinkListLanguage,
  registerKinkListThemes,
  validateKinkListSyntax,
} from './KinkListLanguage'
import i18n from '../../i18n'

const VALIDATION_DEBOUNCE_MS = 200
const initializedMonacoInstances = new WeakSet<object>()

export interface MonacoKinkListEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string | number
  placeholder?: string
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'auto'
  showLineNumbers?: boolean
  showMinimap?: boolean
  showValidation?: boolean
  onValidationComplete?: (errors: string[], warnings: string[]) => void
}

export interface MonacoKinkListEditorRef {
  focus: () => void
  formatCode: () => void
  insertSnippet: (snippet: string) => void
  getSelection: () => string
  insertBlockAtCursor: (block: string) => void
  insertBlockAfterCursor: (block: string) => void
  goToLine: (lineNumber: number) => void
}

const formatValidationMessage = (lineNumber: number, message: string): string =>
  i18n.t('editor.validation.lineMessage', {
    lineNumber,
    message,
    defaultValue: `Line ${lineNumber}: ${message}`,
  })

const MonacoKinkListEditor = forwardRef<
  MonacoKinkListEditorRef,
  MonacoKinkListEditorProps
>(
  (
    {
      value,
      onChange,
      height = 400,
      placeholder,
      readOnly = false,
      theme = 'auto',
      showLineNumbers = true,
      showMinimap = false,
      showValidation = true,
      onValidationComplete,
    },
    ref
  ) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const contentChangeDisposableRef = useRef<monaco.IDisposable | null>(null)
    const ownedModelRef = useRef<monaco.editor.ITextModel | null>(null)
    const validationTimeoutRef = useRef<ReturnType<
      typeof globalThis.setTimeout
    > | null>(null)
    const onValidationCompleteRef = useRef(onValidationComplete)
    const [isReady, setIsReady] = useState(false)
    const languageId = 'kinklist'

    useEffect(() => {
      onValidationCompleteRef.current = onValidationComplete
    }, [onValidationComplete])

    const prefersDarkTheme = useCallback(() => {
      return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    }, [])

    const validateContent = useCallback(() => {
      if (!editorRef.current || !monacoRef.current) return

      const monaco = monacoRef.current
      const editor = editorRef.current
      const model = editor.getModel()

      if (!model) return

      // Perform validation
      const markers = validateKinkListSyntax(monaco, model.getValue())

      // Set markers
      monaco.editor.setModelMarkers(model, 'kinklist', markers)

      // Extract errors and warnings
      const errors: string[] = []
      const warnings: string[] = []

      markers.forEach((marker) => {
        const message = formatValidationMessage(
          marker.startLineNumber,
          marker.message
        )
        if (marker.severity === monaco.MarkerSeverity.Error) {
          errors.push(message)
        } else if (marker.severity === monaco.MarkerSeverity.Warning) {
          warnings.push(message)
        }
      })

      // Call callback
      if (onValidationCompleteRef.current) {
        onValidationCompleteRef.current(errors, warnings)
      }
    }, [])

    const attachContentChangeListener = useCallback(() => {
      const editor = editorRef.current

      if (!editor) {
        return
      }

      contentChangeDisposableRef.current?.dispose()
      contentChangeDisposableRef.current = null
      if (validationTimeoutRef.current) {
        globalThis.clearTimeout(validationTimeoutRef.current)
        validationTimeoutRef.current = null
      }

      if (!showValidation) {
        return
      }

      contentChangeDisposableRef.current = editor.onDidChangeModelContent(
        () => {
          if (validationTimeoutRef.current) {
            globalThis.clearTimeout(validationTimeoutRef.current)
          }
          validationTimeoutRef.current = globalThis.setTimeout(() => {
            validationTimeoutRef.current = null
            validateContent()
          }, VALIDATION_DEBOUNCE_MS)
        }
      )
    }, [showValidation, validateContent])

    // Editor initialisieren
    const handleEditorDidMount = (
      editor: monaco.editor.IStandaloneCodeEditor,
      monaco: Monaco
    ) => {
      editorRef.current = editor
      monacoRef.current = monaco

      // Sprache und Themes registrieren
      try {
        if (!initializedMonacoInstances.has(monaco as object)) {
          registerKinkListLanguage(monaco)
          registerKinkListThemes(monaco)
          initializedMonacoInstances.add(monaco as object)
        }

        // Theme anwenden
        const isDark =
          theme === 'dark' || (theme === 'auto' && prefersDarkTheme())

        const themeName = isDark ? 'kink-list-dark' : 'kink-list-light'
        monaco.editor.setTheme(themeName)

        // Model-Sprache explizit setzen
        let model = editor.getModel()
        if (!model) {
          // Falls kein Model existiert: neues Model erzeugen
          const value = editor.getValue()
          model = monaco.editor.createModel(value, languageId)
          ownedModelRef.current = model
          editor.setModel(model)
        } else {
          // Vorhandenes Model wiederverwenden und Sprache setzen
          ownedModelRef.current = null
          monaco.editor.setModelLanguage(model, languageId)
        }
      } catch (error) {
        console.error('Error setting up Monaco editor:', error)
      }

      // Editor is ready
      setIsReady(true)

      // Fokus auf den Editor setzen
      editor.focus()

      // Initial validation
      if (showValidation) {
        validateContent()
      }
    }

    // Methoden für den Parent-Component
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus()
        }
      },
      formatCode: () => {
        if (editorRef.current) {
          const currentValue = editorRef.current.getValue()
          const formatted = formatKinkListText(currentValue)
          if (formatted !== currentValue) {
            onChange(formatted)
          }
        }
      },
      insertSnippet: (snippet: string) => {
        if (editorRef.current) {
          const selection = editorRef.current.getSelection()
          if (selection) {
            editorRef.current.executeEdits('', [
              {
                range: selection,
                text: snippet,
                forceMoveMarkers: true,
              },
            ])
          }
        }
      },
      getSelection: () => {
        if (editorRef.current) {
          const selection = editorRef.current.getSelection()
          if (selection) {
            const model = editorRef.current.getModel()
            if (model) {
              return model.getValueInRange(selection)
            }
          }
        }
        return ''
      },
      insertBlockAtCursor: (block: string) => {
        const editor = editorRef.current
        const monacoInstance = monacoRef.current
        if (!editor || !monacoInstance) return

        const position = editor.getPosition()
        if (!position) return

        editor.executeEdits('', [
          {
            range: new monacoInstance.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: block,
            forceMoveMarkers: true,
          },
        ])
      },
      insertBlockAfterCursor: (block: string) => {
        const editor = editorRef.current
        const monacoInstance = monacoRef.current
        if (!editor || !monacoInstance) return

        const position = editor.getPosition()
        const model = editor.getModel()
        if (!position || !model) return

        const lineContent = model.getLineContent(position.lineNumber)
        const endOfLine = lineContent.length + 1 // +1 wegen spaltenbasierender Indizierung

        editor.executeEdits('', [
          {
            range: new monacoInstance.Range(
              position.lineNumber,
              endOfLine,
              position.lineNumber,
              endOfLine
            ),
            text: '\n' + block,
            forceMoveMarkers: true,
          },
        ])
      },
      goToLine: (lineNumber: number) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(lineNumber)
          // Positioniere den Cursor am Anfang der Zeile
          editorRef.current.setPosition({
            lineNumber,
            column: 1,
          })
          editorRef.current.focus()
        }
      },
    }))

    // Theme Änderungen beobachten
    useEffect(() => {
      if (monacoRef.current && isReady) {
        const isDark =
          theme === 'dark' || (theme === 'auto' && prefersDarkTheme())

        monacoRef.current.editor.setTheme(
          isDark ? 'kink-list-dark' : 'kink-list-light'
        )
      }
    }, [theme, isReady, prefersDarkTheme])

    useEffect(() => {
      if (isReady) {
        attachContentChangeListener()
      }
    }, [attachContentChangeListener, isReady])

    useEffect(() => {
      return () => {
        contentChangeDisposableRef.current?.dispose()
        contentChangeDisposableRef.current = null
        if (validationTimeoutRef.current) {
          globalThis.clearTimeout(validationTimeoutRef.current)
          validationTimeoutRef.current = null
        }
        ownedModelRef.current?.dispose()
        ownedModelRef.current = null
      }
    }, [])

    const editorOptions = useMemo(
      () => ({
        accessibilitySupport: 'auto' as const,
        minimap: { enabled: showMinimap },
        lineNumbers: showLineNumbers ? ('on' as const) : ('off' as const),
        readOnly: readOnly,
        domReadOnly: readOnly,
        wordWrap: 'on' as const,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        renderLineHighlight: 'all' as const,
        folding: true,
        foldingStrategy: 'indentation' as const,
        suggest: {
          snippetsPreventQuickSuggestions: false,
          showKeywords: true,
          showSnippets: true,
        },
      }),
      [readOnly, showLineNumbers, showMinimap]
    )

    return (
      <div className="monaco-kinklist-editor">
        {placeholder && !value && (
          <div className="kink-list-editor-placeholder" aria-hidden="true">
            {placeholder}
          </div>
        )}
        <Editor
          height={height}
          defaultLanguage={languageId}
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          options={editorOptions}
        />
      </div>
    )
  }
)

MonacoKinkListEditor.displayName = 'MonacoKinkListEditor'

export default MonacoKinkListEditor
export { MonacoKinkListEditor }
