import { useRef, forwardRef, useImperativeHandle } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { oneDark } from '@codemirror/theme-one-dark'
import { kinklistLanguage } from './KinklistLanguage'

// Define the Kinklist syntax highlighting styles
const kinklistHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: '#2e7d32', fontWeight: 'bold' }, // Categories (#)
  { tag: tags.emphasis, color: '#1565c0', fontStyle: 'italic' }, // Fields (())
  { tag: tags.strong, color: '#f57c00', fontWeight: 'bold' }, // Kinks (*)
  { tag: tags.quote, color: '#5d4037', fontStyle: 'italic' }, // Descriptions (?)
  { tag: tags.comment, color: '#757575', fontStyle: 'italic' }, // Comments (//)
  { tag: tags.content, color: '#000000' }, // Normal text
])

const kinklistDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: '#81c784', fontWeight: 'bold' }, // Categories (#)
  { tag: tags.emphasis, color: '#64b5f6', fontStyle: 'italic' }, // Fields (())
  { tag: tags.strong, color: '#ffb74d', fontWeight: 'bold' }, // Kinks (*)
  { tag: tags.quote, color: '#bcaaa4', fontStyle: 'italic' }, // Descriptions (?)
  { tag: tags.comment, color: '#9e9e9e', fontStyle: 'italic' }, // Comments (//)
  { tag: tags.content, color: '#d4d4d4' }, // Normal text
])

export interface CodeMirrorKinkListEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export interface CodeMirrorKinkListEditorRef {
  focus: () => void
  formatCode: () => void
  insertSnippet: (snippet: string) => void
  getSelection: () => string
}

const CodeMirrorKinkListEditor = forwardRef<
  CodeMirrorKinkListEditorRef,
  CodeMirrorKinkListEditorProps
>(
  (
    {
      value,
      onChange,
      height = '400px',
      placeholder,
      readOnly = false,
      theme = 'auto',
    },
    ref
  ) => {
    const editorRef = useRef<any>(null)

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current?.view) {
          editorRef.current.view.focus()
        }
      },
      formatCode: () => {
        // Simple formatting logic
        const lines = value.split('\n')
        const formatted = lines
          .map((line) => line.trim())
          .filter((line, index, arr) => {
            // Remove duplicate empty lines
            if (line === '' && arr[index - 1] === '') return false
            return true
          })
          .join('\n')
        onChange(formatted)
      },
      insertSnippet: (snippet: string) => {
        if (editorRef.current?.view) {
          const view = editorRef.current.view
          const { from, to } = view.state.selection.main
          view.dispatch({
            changes: { from, to, insert: snippet },
            selection: { anchor: from + snippet.length },
          })
        }
      },
      getSelection: () => {
        if (editorRef.current?.view) {
          const view = editorRef.current.view
          const { from, to } = view.state.selection.main
          return view.state.doc.sliceString(from, to)
        }
        return ''
      },
    }))

    // Determine theme
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)

    // Extensions for CodeMirror
    const extensions = [
      kinklistLanguage, // Add our custom language
      EditorView.theme({
        '&': { height },
        '.cm-content': { padding: '12px' },
        '.cm-focused': { outline: 'none' },
        '.cm-editor': { fontSize: '14px' },
        '.cm-scroller': {
          fontFamily: 'Consolas, Monaco, "Lucida Console", monospace',
        },
      }),
      syntaxHighlighting(
        isDark ? kinklistDarkHighlightStyle : kinklistHighlightStyle
      ),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString())
        }
      }),
    ]

    if (isDark) {
      extensions.push(oneDark)
    }

    return (
      <div className="codemirror-kinklist-editor">
        <CodeMirror
          ref={editorRef}
          value={value}
          placeholder={placeholder}
          editable={!readOnly}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
            searchKeymap: true,
          }}
        />
      </div>
    )
  }
)

CodeMirrorKinkListEditor.displayName = 'CodeMirrorKinkListEditor'

export default CodeMirrorKinkListEditor
