import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { formatKinkListText } from './EditorUtils'
import {
  registerKinkListLanguage,
  registerKinkListThemes,
  validateKinkListSyntax,
} from './KinkListLanguage'

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

const MonacoKinkListEditor = forwardRef<
  MonacoKinkListEditorRef,
  MonacoKinkListEditorProps
>(
  (
    {
      value,
      onChange,
      height = 400,
      placeholder = 'Geben Sie Ihren Kinklist-Code hier ein...',
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
    const [isReady, setIsReady] = useState(false)
    const languageId = 'kinklist'

    // Editor initialisieren
    const handleEditorDidMount = (
      editor: monaco.editor.IStandaloneCodeEditor,
      monaco: Monaco
    ) => {
      editorRef.current = editor
      monacoRef.current = monaco

      console.log('=== MONACO EDITOR MOUNTED ===')

      // In Entwicklungsmodus: Reset flags to allow re-registration
      if (import.meta.env.DEV) {
        // Reset flags are handled internally by registerKinkListLanguage
      }

      // Sprache und Themes registrieren
      try {
        registerKinkListLanguage(monaco)
        registerKinkListThemes(monaco)
        console.log('Language and themes registered successfully')

        // Theme anwenden
        const isDark =
          theme === 'dark' ||
          (theme === 'auto' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)

        const themeName = isDark ? 'kink-list-dark' : 'kink-list-light'
        console.log('Applying theme:', themeName)
        monaco.editor.setTheme(themeName)

        // Model-Sprache explizit setzen
        let model = editor.getModel()
        if (!model || model.getLanguageId() !== languageId) {
          // Falls kein Model existiert oder falsche Sprache: neues Model erzeugen
          const value = editor.getValue()
          model = monaco.editor.createModel(value, languageId)
          editor.setModel(model)
          console.log('Created new model with language:', languageId)
        } else {
          // Sprache sicherheitshalber setzen
          monaco.editor.setModelLanguage(model, languageId)
        }
        // Debug: aktuelle Sprache des Models ausgeben
        const currentLang = model.getLanguageId()
        console.log(
          'Model language set to:',
          languageId,
          '| Current model language:',
          currentLang
        )

        // Force tokenization
        setTimeout(() => {
          model.getLineContent(1) // This triggers tokenization
          console.log('Tokenization triggered')
          // Debug: aktuelle Sprache nach Tokenisierung
          console.log(
            'Model language after tokenization:',
            model.getLanguageId()
          )
        }, 100)
      } catch (error) {
        console.error('Error setting up Monaco editor:', error)
      }

      // Platzhalter einrichten
      if (placeholder && !value) {
        editor.updateOptions({
          accessibilitySupport: 'off',
          minimap: { enabled: showMinimap },
          lineNumbers: showLineNumbers ? 'on' : 'off',
          readOnly: readOnly,
          domReadOnly: readOnly,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 2,
          renderLineHighlight: 'all',
          folding: true,
          foldingStrategy: 'indentation',
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showKeywords: true,
            showSnippets: true,
          },
        })
      }

      // Editor ist bereit
      setIsReady(true)

      // Fokus auf den Editor setzen
      editor.focus()

      // Validation nach Änderungen
      editor.onDidChangeModelContent(() => {
        if (showValidation) {
          validateContent()
        }
      })

      // Initiale Validierung
      if (showValidation) {
        validateContent()
      }
    }

    // Validiert den Editor-Inhalt
    const validateContent = () => {
      if (!editorRef.current || !monacoRef.current) return

      const monaco = monacoRef.current
      const editor = editorRef.current
      const model = editor.getModel()

      if (!model) return

      // Validierung durchführen
      const markers = validateKinkListSyntax(monaco, model.getValue())

      // Marker setzen
      monaco.editor.setModelMarkers(model, 'kinklist', markers)

      // Errors und Warnings extrahieren
      const errors: string[] = []
      const warnings: string[] = []

      markers.forEach((marker) => {
        const message = `Zeile ${marker.startLineNumber}: ${marker.message}`
        if (marker.severity === monaco.MarkerSeverity.Error) {
          errors.push(message)
        } else if (marker.severity === monaco.MarkerSeverity.Warning) {
          warnings.push(message)
        }
      })

      // Callback aufrufen
      if (onValidationComplete) {
        onValidationComplete(errors, warnings)
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
          const formatted = formatKinkListText(value)
          onChange(formatted)
          editorRef.current.setValue(formatted)
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
        if (editorRef.current) {
          const position = editorRef.current.getPosition()
          if (position) {
            editorRef.current.executeEdits('', [
              {
                range: new monacoRef.current!.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                ),
                text: block,
                forceMoveMarkers: true,
              },
            ])
          }
        }
      },
      insertBlockAfterCursor: (block: string) => {
        if (editorRef.current) {
          const position = editorRef.current.getPosition()
          if (position) {
            const model = editorRef.current.getModel()
            if (model) {
              const lineContent = model.getLineContent(position.lineNumber)
              const endOfLine = lineContent.length + 1 // +1 wegen spaltenbasierender Indizierung

              editorRef.current.executeEdits('', [
                {
                  range: new monacoRef.current!.Range(
                    position.lineNumber,
                    endOfLine,
                    position.lineNumber,
                    endOfLine
                  ),
                  text: '\n' + block,
                  forceMoveMarkers: true,
                },
              ])
            }
          }
        }
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
          theme === 'dark' ||
          (theme === 'auto' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)

        monacoRef.current.editor.setTheme(
          isDark ? 'kink-list-dark' : 'kink-list-light'
        )
      }
    }, [theme, isReady])

    return (
      <div className="monaco-kinklist-editor">
        <Editor
          height={height}
          defaultLanguage={languageId}
          defaultValue={value}
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          options={{
            accessibilitySupport: 'off',
            minimap: { enabled: showMinimap },
            lineNumbers: showLineNumbers ? 'on' : 'off',
            readOnly: readOnly,
            domReadOnly: readOnly,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            renderLineHighlight: 'all',
            folding: true,
            foldingStrategy: 'indentation',
            suggest: {
              snippetsPreventQuickSuggestions: false,
              showKeywords: true,
              showSnippets: true,
            },
          }}
        />
      </div>
    )
  }
)

MonacoKinkListEditor.displayName = 'MonacoKinkListEditor'

export default MonacoKinkListEditor
export { MonacoKinkListEditor }
