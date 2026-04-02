import Editor, { BeforeMount, Monaco, OnMount } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { formatKinkListText, getSnippets } from './EditorUtils'
import {
  registerKinkListLanguage,
  registerKinkListThemes,
} from './KinkListLanguage'

const KINK_LIST_LANGUAGE_ID = 'kinklist'
const KINK_LIST_LIGHT_THEME = 'kink-list-light'
const KINK_LIST_DARK_THEME = 'kink-list-dark'

export interface KinkListEditorProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean, errors: string[]) => void
  height?: string
  placeholder?: string
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export interface KinkListEditorRef {
  focus: () => void
  formatCode: () => void
  insertSnippet: (snippet: string) => void
  getSelection: () => string
  validate: () => { isValid: boolean; errors: string[] }
}

const KinkListEditor = forwardRef<KinkListEditorRef, KinkListEditorProps>(
  (
    {
      value,
      onChange,
      onValidationChange,
      height = '400px',
      placeholder,
      readOnly = false,
      theme = 'auto',
    },
    ref
  ) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const isInitializedRef = useRef(false)
    const registrationDisposablesRef = useRef<monaco.IDisposable[]>([])
    const editorDisposablesRef = useRef<monaco.IDisposable[]>([])

    const disposeEditorDisposables = useCallback(() => {
      editorDisposablesRef.current.forEach((disposable) => disposable.dispose())
      editorDisposablesRef.current = []
    }, [])

    const disposeRegistrationDisposables = useCallback(() => {
      registrationDisposablesRef.current.forEach((disposable) =>
        disposable.dispose()
      )
      registrationDisposablesRef.current = []
    }, [])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus()
      },
      formatCode: () => {
        if (editorRef.current) {
          const currentValue = editorRef.current.getValue()
          const formatted = formatKinkListText(currentValue)
          editorRef.current.setValue(formatted)
          onChange(formatted)
        }
      },
      insertSnippet: (snippet: string) => {
        if (editorRef.current) {
          const selection = editorRef.current.getSelection()
          if (selection) {
            editorRef.current.executeEdits('insert-snippet', [
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
          const model = editorRef.current.getModel()
          if (selection && model) {
            return model.getValueInRange(selection)
          }
        }
        return ''
      },
      validate: () => {
        const editor = editorRef.current
        const monacoInstance = monacoRef.current

        if (editor && monacoInstance) {
          const model = editor.getModel()
          if (model) {
            const markers = monacoInstance.editor.getModelMarkers({
              resource: model.uri,
            })
            const errors = markers
              .filter(
                (marker) =>
                  marker.severity === monacoInstance.MarkerSeverity.Error
              )
              .map(
                (marker) => `Zeile ${marker.startLineNumber}: ${marker.message}`
              )

            return {
              isValid: errors.length === 0,
              errors,
            }
          }
        }
        return { isValid: true, errors: [] }
      },
    })) // Validate content and report errors
    const validateContent = useCallback(() => {
      const editor = editorRef.current
      const monacoInstance = monacoRef.current

      if (editor && monacoInstance && onValidationChange) {
        const model = editor.getModel()
        if (model) {
          const markers = monacoInstance.editor.getModelMarkers({
            resource: model.uri,
          })
          const errors = markers
            .filter(
              (marker) =>
                marker.severity === monacoInstance.MarkerSeverity.Error
            )
            .map(
              (marker) => `Zeile ${marker.startLineNumber}: ${marker.message}`
            )

          onValidationChange(errors.length === 0, errors)
        }
      }
    }, [onValidationChange])

    // Before editor mount - register language and themes
    const handleBeforeMount: BeforeMount = useCallback(
      (monaco) => {
        monacoRef.current = monaco

        if (!isInitializedRef.current) {
          // Register the kinklist language
          const languageId = registerKinkListLanguage(monaco)
          registerKinkListThemes(monaco)

          // Force theme setting immediately after registration
          const currentTheme =
            theme === 'dark' ? KINK_LIST_DARK_THEME : KINK_LIST_LIGHT_THEME
          if (theme === 'auto') {
            const prefersDark = window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches
            monaco.editor.setTheme(
              prefersDark ? KINK_LIST_DARK_THEME : KINK_LIST_LIGHT_THEME
            )
          } else {
            monaco.editor.setTheme(currentTheme)
          }

          // Register completion provider for snippets
          registrationDisposablesRef.current.push(
            monaco.languages.registerCompletionItemProvider(languageId, {
              provideCompletionItems: (_model, position) => {
                const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: 1,
                  endColumn: position.column,
                }

                const suggestions = getSnippets().map((snippet, index) => ({
                  label: snippet.label,
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText: snippet.insertText,
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  range,
                  detail: snippet.detail,
                  documentation: snippet.documentation,
                  sortText: `z_${index.toString().padStart(3, '0')}`,
                }))

                return { suggestions }
              },
            })
          )

          // Register code action provider for formatting
          registrationDisposablesRef.current.push(
            monaco.languages.registerCodeActionProvider(languageId, {
              provideCodeActions: (model) => {
                const actions: monaco.languages.CodeAction[] = [
                  {
                    title: 'Kink-Liste formatieren',
                    kind: 'source.fixAll',
                    edit: {
                      edits: [
                        {
                          resource: model.uri,
                          versionId: model.getVersionId(),
                          textEdit: {
                            range: model.getFullModelRange(),
                            text: formatKinkListText(model.getValue()),
                          },
                        },
                      ],
                    },
                  },
                ]
                return { actions, dispose: () => {} }
              },
            })
          )

          isInitializedRef.current = true
        }
      },
      [theme]
    )

    // Handle value changes
    const handleChange = useCallback(
      (value: string | undefined) => {
        if (value !== undefined) {
          onChange(value)
        }
      },
      [onChange]
    )

    // Determine theme based on system preference if auto
    const getTheme = useCallback(() => {
      if (theme !== 'auto') {
        return theme === 'dark' ? KINK_LIST_DARK_THEME : KINK_LIST_LIGHT_THEME
      }

      // Auto-detect system theme
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      return prefersDark ? KINK_LIST_DARK_THEME : KINK_LIST_LIGHT_THEME
    }, [theme])

    // After editor mount - configure editor
    const handleMount: OnMount = useCallback(
      (editor, monaco) => {
        editorRef.current = editor
        disposeEditorDisposables()

        // Get the model and ensure language is set
        const model = editor.getModel()
        if (model) {
          monaco.editor.setModelLanguage(model, KINK_LIST_LANGUAGE_ID)

          // Set theme AFTER setting the language
          monaco.editor.setTheme(getTheme())
        }

        // Configure editor options
        editor.updateOptions({
          minimap: { enabled: false },
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          formatOnPaste: true,
          formatOnType: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggestOnTriggerCharacters: true,
          tabCompletion: 'on',
          parameterHints: { enabled: true },
          autoIndent: 'full',
          // Enable token hover to debug highlighting
          hover: {
            enabled: true,
            delay: 100,
          },
        })

        if (import.meta.env.DEV) {
          editorDisposablesRef.current.push(
            monaco.languages.registerHoverProvider(KINK_LIST_LANGUAGE_ID, {
              provideHover: (model, position) => {
                const line = model.getLineContent(position.lineNumber)
                const tokens = monaco.editor.tokenize(
                  line,
                  KINK_LIST_LANGUAGE_ID
                )

                return {
                  range: new monaco.Range(
                    position.lineNumber,
                    1,
                    position.lineNumber,
                    line.length + 1
                  ),
                  contents: [
                    { value: `**Line:** ${line}` },
                    {
                      value: `**Position:** ${position.lineNumber}:${position.column}`,
                    },
                    {
                      value: `**Tokens:** ${JSON.stringify(tokens[0] || [], null, 2)}`,
                    },
                  ],
                }
              },
            })
          )
        }

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
          editor.trigger('keyboard', 'editor.action.triggerSuggest', {})
        })

        editor.addCommand(
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
          () => {
            if (editorRef.current) {
              const currentValue = editorRef.current.getValue()
              const formatted = formatKinkListText(currentValue)
              editorRef.current.setValue(formatted)
              onChange(formatted)
            }
          }
        )

        // Validate on content change
        editorDisposablesRef.current.push(
          editor.onDidChangeModelContent(() => {
            validateContent()
          })
        )

        // Focus the editor
        editor.focus()
      },
      [disposeEditorDisposables, validateContent, onChange, getTheme]
    )

    useEffect(() => {
      return () => {
        disposeEditorDisposables()
        disposeRegistrationDisposables()
        isInitializedRef.current = false
      }
    }, [disposeEditorDisposables, disposeRegistrationDisposables])

    // Update validation when value changes externally
    useEffect(() => {
      validateContent()
    }, [value, validateContent])

    return (
      <div className="kink-list-editor">
        {placeholder && !value && (
          <div className="kink-list-editor-placeholder" aria-hidden="true">
            {placeholder}
          </div>
        )}
        <Editor
          height={height}
          language={KINK_LIST_LANGUAGE_ID}
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          theme={getTheme()}
          options={{
            readOnly,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            },
          }}
        />
      </div>
    )
  }
)

KinkListEditor.displayName = 'KinkListEditor'

export default KinkListEditor
