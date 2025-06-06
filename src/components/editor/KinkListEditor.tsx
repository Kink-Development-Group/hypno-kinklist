import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { getSnippets, formatKinkListText } from './EditorUtils'
import {
  registerKinkListLanguage,
  registerKinkListThemes,
} from './KinkListLanguage-test'

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
    const handleBeforeMount: BeforeMount = useCallback(
      (monaco) => {
        if (!isInitializedRef.current) {
          console.log('=== MONACO EDITOR INITIALIZATION ===')

          // Register the kinklist language
          console.log('1. Registering kinklist language...')
          const languageId = registerKinkListLanguage()
          registerKinkListThemes()
          console.log('Language registered:', languageId)

          // Force theme setting immediately after registration
          const currentTheme =
            theme === 'dark' ? 'kink-list-dark' : 'kink-list-light'
          if (theme === 'auto') {
            const prefersDark = window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches
            monaco.editor.setTheme(
              prefersDark ? 'kink-list-dark' : 'kink-list-light'
            )
          } else {
            monaco.editor.setTheme(currentTheme)
          }
          console.log('2. Theme set to:', currentTheme)

          // Verify language is registered
          const languages = monaco.languages.getLanguages()
          console.log(
            '3. Available languages:',
            languages.map((l) => l.id)
          )
          console.log(
            'KinkList simple language found:',
            languages.find((l) => l.id === languageId)
          )

          // Register completion provider for snippets
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

          console.log('=== MONACO EDITOR INITIALIZATION COMPLETE ===')
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
        return theme === 'dark'
          ? 'kinklist-simple-dark'
          : 'kinklist-simple-light'
      }

      // Auto-detect system theme
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      return prefersDark ? 'kinklist-simple-dark' : 'kinklist-simple-light'
    }, [theme])

    // After editor mount - configure editor
    const handleMount: OnMount = useCallback(
      (editor, monaco) => {
        editorRef.current = editor

        // Debug: Check if language is registered
        console.log('Available languages:', monaco.languages.getLanguages())

        // Get the model and ensure language is set
        const model = editor.getModel()
        if (model) {
          console.log('Current model language:', model.getLanguageId())

          // Force set language to kinklist-simple
          monaco.editor.setModelLanguage(model, 'kinklist-simple')
          console.log('Set model language to kinklist-simple')

          // Set theme AFTER setting the language
          const currentTheme = getTheme()
          console.log('Setting theme:', currentTheme)
          monaco.editor.setTheme(currentTheme)

          // Force re-tokenization by triggering a model change
          setTimeout(() => {
            const currentValue = model.getValue()
            model.setValue('')
            model.setValue(currentValue)

            // Test tokenization
            const tokens = monaco.editor.tokenize(
              currentValue,
              'kinklist-simple'
            )
            console.log('Forced tokenization result:', tokens)
          }, 200)
        }

        // Test syntax highlighting with a sample text
        if (model && value.length === 0) {
          const testText = `#Test Category
(Test Field)
* Test neutral kink
+ Test positive kink
- Test negative kink
? Test maybe kink without space
? This is a description with space after question mark
// This is a comment`
          console.log('Testing syntax highlighting with sample text')
          console.log('Sample text:', testText)

          // Immediate test of tokenization
          const tokens = monaco.editor.tokenize(testText, 'kinklist-simple')
          console.log('Tokenization test:', tokens)

          setTimeout(() => {
            editor.setValue(testText)
            onChange(testText)

            // Check tokenization after setting text
            const modelTokens = monaco.editor.tokenize(
              model.getValue(),
              'kinklist-simple'
            )
            console.log('Model tokenization after setValue:', modelTokens)
          }, 300)
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

        // Debug: Add hover provider to show token information
        monaco.languages.registerHoverProvider('kinklist-simple', {
          provideHover: (model, position) => {
            const line = model.getLineContent(position.lineNumber)
            const tokens = monaco.editor.tokenize(line, 'kinklist-simple')

            console.log('Hover debug - Line:', line)
            console.log('Hover debug - Tokens:', tokens)

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
      [validateContent, onChange, getTheme, value.length]
    )

    // Update validation when value changes externally
    useEffect(() => {
      validateContent()
    }, [value, validateContent])

    return (
      <div className="kink-list-editor">
        <Editor
          height={height}
          language="kinklist-simple"
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
