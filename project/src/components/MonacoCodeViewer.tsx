import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'

interface MonacoEnvironment {
  getWorker: (_: string, label: string) => Worker
}

declare global {
  interface Window {
    MonacoEnvironment?: MonacoEnvironment
  }
}

if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') {
        return new jsonWorker()
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new cssWorker()
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new htmlWorker()
      }
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker()
      }
      return new editorWorker()
    }
  }
}

const DEFAULT_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  automaticLayout: false,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  fontSize: 13,
  lineNumbers: 'on',
  theme: 'vs-dark'
}

const MonacoCodeViewer = ({ value }: { value: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const editor = monaco.editor.create(container, {
      ...DEFAULT_OPTIONS,
      language: 'typescript',
      value
    })

    editorRef.current = editor

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        editor.layout()
      })
      observer.observe(container)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
      editor.dispose()
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    const model = editor.getModel()
    if (model && model.getValue() !== value) {
      editor.setValue(value)
      editor.setScrollPosition({ scrollTop: 0 })
    }
  }, [value])

  return <div ref={containerRef} className='h-full w-full' />
}

export default MonacoCodeViewer
