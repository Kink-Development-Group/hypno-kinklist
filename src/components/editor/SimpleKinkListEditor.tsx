import { useRef, forwardRef, useImperativeHandle, useEffect } from 'react'

export interface SimpleKinkListEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export interface SimpleKinkListEditorRef {
  focus: () => void
  formatCode: () => void
  insertSnippet: (snippet: string) => void
  getSelection: () => string
}

const SimpleKinkListEditor = forwardRef<
  SimpleKinkListEditorRef,
  SimpleKinkListEditorProps
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const preRef = useRef<HTMLPreElement>(null)

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
      formatCode: () => {
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
        if (textareaRef.current) {
          const textarea = textareaRef.current
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const newValue =
            value.substring(0, start) + snippet + value.substring(end)
          onChange(newValue)

          // Set cursor position after snippet
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + snippet.length
            textarea.focus()
          }, 0)
        }
      },
      getSelection: () => {
        if (textareaRef.current) {
          const textarea = textareaRef.current
          return value.substring(textarea.selectionStart, textarea.selectionEnd)
        }
        return ''
      },
    }))

    // Apply syntax highlighting
    const applySyntaxHighlighting = (text: string): string => {
      const lines = text.split('\n')
      const highlightedLines = lines.map((line) => {
        // Categories starting with #
        if (line.startsWith('#')) {
          return `<span class="syntax-category">${escapeHtml(line)}</span>`
        }

        // Fields in parentheses
        if (line.startsWith('(') && line.endsWith(')')) {
          return `<span class="syntax-field">${escapeHtml(line)}</span>`
        }

        // Kinks starting with *
        if (line.startsWith('*')) {
          return `<span class="syntax-kink">${escapeHtml(line)}</span>`
        }

        // Descriptions starting with ?
        if (line.startsWith('?')) {
          return `<span class="syntax-description">${escapeHtml(line)}</span>`
        }

        // Comments starting with //
        if (line.startsWith('//')) {
          return `<span class="syntax-comment">${escapeHtml(line)}</span>`
        }

        // Default text
        return `<span class="syntax-text">${escapeHtml(line)}</span>`
      })

      return highlightedLines.join('\n')
    }

    const escapeHtml = (text: string): string => {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }

    // Update highlighting when value changes
    useEffect(() => {
      if (preRef.current) {
        preRef.current.innerHTML = applySyntaxHighlighting(value)
      }
    }, [value])

    // Determine theme class
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)

    const themeClass = isDark ? 'simple-editor-dark' : 'simple-editor-light'

    // Handle input
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    }

    // Handle scroll sync
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (preRef.current) {
        preRef.current.scrollTop = e.currentTarget.scrollTop
        preRef.current.scrollLeft = e.currentTarget.scrollLeft
      }
    }

    return (
      <div
        className={`simple-kinklist-editor ${themeClass}`}
        style={{ height }}
      >
        <div className="editor-container">
          {/* Syntax highlighting layer */}
          <pre ref={preRef} className="syntax-layer" aria-hidden="true"></pre>

          {/* Input layer */}
          <textarea
            ref={textareaRef}
            className="input-layer"
            value={value}
            onChange={handleInput}
            onScroll={handleScroll}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
          />
        </div>

        <style jsx>{`
          .simple-kinklist-editor {
            position: relative;
            border: 1px solid #ccc;
            border-radius: 4px;
            overflow: hidden;
            font-family: 'Consolas', 'Monaco', 'Lucida Console', monospace;
            font-size: 14px;
            line-height: 1.5;
          }

          .simple-editor-dark {
            background: #1e1e1e;
            border-color: #3c3c3c;
          }

          .simple-editor-light {
            background: #ffffff;
            border-color: #ccc;
          }

          .editor-container {
            position: relative;
            height: 100%;
          }

          .syntax-layer,
          .input-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 12px;
            border: none;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: auto;
            box-sizing: border-box;
          }

          .syntax-layer {
            color: transparent;
            pointer-events: none;
            z-index: 1;
          }

          .input-layer {
            background: transparent;
            color: inherit;
            resize: none;
            outline: none;
            z-index: 2;
          }

          /* Light theme syntax colors */
          .simple-editor-light .syntax-category {
            color: #2e7d32;
            font-weight: bold;
          }

          .simple-editor-light .syntax-field {
            color: #1565c0;
            font-style: italic;
          }

          .simple-editor-light .syntax-kink {
            color: #f57c00;
            font-weight: bold;
          }

          .simple-editor-light .syntax-description {
            color: #5d4037;
            font-style: italic;
          }

          .simple-editor-light .syntax-comment {
            color: #757575;
            font-style: italic;
          }

          .simple-editor-light .syntax-text {
            color: #000000;
          }

          /* Dark theme syntax colors */
          .simple-editor-dark .syntax-category {
            color: #81c784;
            font-weight: bold;
          }

          .simple-editor-dark .syntax-field {
            color: #64b5f6;
            font-style: italic;
          }

          .simple-editor-dark .syntax-kink {
            color: #ffb74d;
            font-weight: bold;
          }

          .simple-editor-dark .syntax-description {
            color: #bcaaa4;
            font-style: italic;
          }

          .simple-editor-dark .syntax-comment {
            color: #9e9e9e;
            font-style: italic;
          }

          .simple-editor-dark .syntax-text {
            color: #d4d4d4;
          }

          .simple-editor-dark .input-layer {
            color: #d4d4d4;
          }

          .simple-editor-light .input-layer {
            color: #000000;
          }
        `}</style>
      </div>
    )
  }
)

SimpleKinkListEditor.displayName = 'SimpleKinkListEditor'

export default SimpleKinkListEditor
