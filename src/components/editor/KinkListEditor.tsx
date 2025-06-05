import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import {
  registerKinkListLanguage,
  kinkListTheme,
  kinkListDarkTheme,
} from './KinkListLanguage'
import { getSnippets, formatKinkListText } from './EditorUtils'

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
    const isInitializedRef = useRef(false)

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
        if (editorRef.current) {
          const model = editorRef.current.getModel()
          if (model) {
            const markers = monaco.editor.getModelMarkers({
              resource: model.uri,
            })
            const errors = markers
              .filter(
                (marker) => marker.severity === monaco.MarkerSeverity.Error
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
      if (editorRef.current && onValidationChange) {
        const model = editorRef.current.getModel()
        if (model) {
          const markers = monaco.editor.getModelMarkers({ resource: model.uri })
          const errors = markers
            .filter((marker) => marker.severity === monaco.MarkerSeverity.Error)
            .map(
              (marker) => `Zeile ${marker.startLineNumber}: ${marker.message}`
            )

          onValidationChange(errors.length === 0, errors)
        }
      }
    }, [onValidationChange])

    // Before editor mount - register language and themes
    const handleBeforeMount: BeforeMount = useCallback((monaco) => {
      if (!isInitializedRef.current) {
        // Register the custom language
        registerKinkListLanguage()

        // Register themes (they are already defined in KinkListLanguage.ts)
        monaco.editor.defineTheme('kink-list-light', kinkListTheme)
        monaco.editor.defineTheme('kink-list-dark', kinkListDarkTheme)

        // Register completion provider for snippets
        monaco.languages.registerCompletionItemProvider('kinklist', {
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
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: snippet.detail,
              documentation: snippet.documentation,
              sortText: `z_${index.toString().padStart(3, '0')}`,
            }))

            return { suggestions }
          },
        })

        // Register code action provider for formatting
        monaco.languages.registerCodeActionProvider('kinklist', {
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

        isInitializedRef.current = true
      }
    }, [])

    // After editor mount - configure editor
    const handleMount: OnMount = useCallback(
      (editor, monaco) => {
        editorRef.current = editor

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
        }) // Add keyboard shortcuts
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
        editor.onDidChangeModelContent(() => {
          validateContent()
        }) // Focus the editor
        editor.focus()
      },
      [validateContent, onChange]
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
        return theme === 'dark' ? 'kink-list-dark' : 'kink-list-light'
      }

      // Auto-detect system theme
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      return prefersDark ? 'kink-list-dark' : 'kink-list-light'
    }, [theme])

    // Update validation when value changes externally
    useEffect(() => {
      validateContent()
    }, [value, validateContent])

    return (
      <div className="kink-list-editor">
        <Editor
          height={height}
          language="kinklist"
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          theme={getTheme()}
          options={{
            readOnly,
            placeholder,
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
