import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import PalettePanel from './components/PalettePanel'
import DiagramCanvas from './components/DiagramCanvas'
import InspectorPanel from './components/InspectorPanel'
import TemplatePreview from './components/TemplatePreview'
import CodePreviewModal from './components/CodePreviewModal'
import { useDiagramStore } from './store/diagramStore'
import { generateTemplateCode } from './utils/templateCodeGenerator'

const isEditableElement = (target: EventTarget | null): target is HTMLElement => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.getAttribute('role') === 'textbox'
  )
}

const App = () => {
  const elements = useDiagramStore(state => state.elements)
  const undo = useDiagramStore(state => state.undo)
  const redo = useDiagramStore(state => state.redo)
  const canUndo = useDiagramStore(state => state.canUndo)
  const canRedo = useDiagramStore(state => state.canRedo)
  const selectedId = useDiagramStore(state => state.selectedId)
  const removeElement = useDiagramStore(state => state.removeElement)
  const [isModalOpen, setModalOpen] = useState(false)
  const generatedCode = useMemo(() => generateTemplateCode(elements), [elements])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const editable = isEditableElement(event.target)
      const key = event.key.toLowerCase()
      const isMeta = event.metaKey || event.ctrlKey

      if (isMeta && key === 'z') {
        if (editable) {
          return
        }

        event.preventDefault()
        if (event.shiftKey) {
          if (canRedo) {
            redo()
          }
        } else if (canUndo) {
          undo()
        }
        return
      }

      if (isMeta && key === 'y') {
        if (editable) {
          return
        }

        event.preventDefault()
        if (canRedo) {
          redo()
        }
        return
      }

      if (!editable && (event.key === 'Delete' || event.key === 'Backspace')) {
        if (!selectedId) {
          return
        }

        event.preventDefault()
        removeElement(selectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo, removeElement, selectedId])

  return (
    <div className='flex h-full min-h-screen flex-col bg-slate-950 text-slate-100'>
      <Header />
      <main className='flex flex-1 overflow-hidden'>
        <PalettePanel />
        <section className='flex flex-1 flex-col gap-4 overflow-hidden p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-base font-semibold text-white'>Diagram canvas</h2>
              <p className='text-sm text-slate-400'>GoJS diagram rendering the current template structure.</p>
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setModalOpen(true)}
                className={[
                  'rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200',
                  'transition hover:border-emerald-400 hover:bg-emerald-500/20'
                ].join(' ')}
              >
                Generate code
              </button>
              <button
                type='button'
                onClick={undo}
                disabled={!canUndo}
                className={[
                  'rounded-md border px-3 py-2 text-sm font-medium transition',
                  canUndo
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'
                    : 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-500 opacity-60'
                ].join(' ')}
              >
                Undo
              </button>
              <button
                type='button'
                onClick={redo}
                disabled={!canRedo}
                className={[
                  'rounded-md border px-3 py-2 text-sm font-medium transition',
                  canRedo
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'
                    : 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-500 opacity-60'
                ].join(' ')}
              >
                Redo
              </button>
            </div>
          </div>
          <div className='grid h-full flex-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40 lg:grid-cols-[2fr,1fr]'>
            <DiagramCanvas />
            <TemplatePreview />
          </div>
        </section>
        <InspectorPanel />
      </main>
      <CodePreviewModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} code={generatedCode} />
    </div>
  )
}

export default App
