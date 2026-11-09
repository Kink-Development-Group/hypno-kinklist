// Bundle Monaco with the app instead of loading it from a public CDN at runtime.
// Only the core editor and its contributions are included; the kinklist
// language is registered separately, so no built-in languages are needed.
import { loader } from '@monaco-editor/react'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

loader.config({ monaco })
