import type { ChangeEvent } from 'react'
import { useMemo } from 'react'
import { useDiagramStore } from '@/store/diagramStore'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import PropertyEditor from './PropertyEditor'
import BindingEditor from './BindingEditor'

const InspectorPanel = () => {
  const element = useDiagramStore(state => state.elements.find(item => item.id === state.selectedId))
  const updateElement = useDiagramStore(state => state.updateElement)
  const removeElement = useDiagramStore(state => state.removeElement)
  const metadata = useMemo(() => (element ? graphObjectMetadata[element.type] : null), [element])

  if (!element) {
    return (
      <aside className='flex h-full min-w-[320px] flex-col justify-center border-l border-slate-800 bg-panel p-6 text-center text-sm text-slate-400'>
        <p>Select a node to edit its properties.</p>
      </aside>
    )
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    updateElement(element.id, current => ({ ...current, name: value }))
  }

  const handleRemove = () => {
    removeElement(element.id)
  }

  return (
    <aside className='flex h-full min-w-[320px] flex-col gap-6 overflow-y-auto border-l border-slate-800 bg-panel p-6'>
      <header className='space-y-2'>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Inspector</h2>
        <p className='text-xs text-slate-500'>Configure the selected GraphObject and manage its bindings.</p>
      </header>

      <section className='space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-inner shadow-slate-950/30'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-[11px] uppercase tracking-wide text-slate-400'>Type</p>
            <p className='text-sm font-medium text-slate-100'>{metadata?.label ?? element.type}</p>
          </div>
          <span className='rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400'>
            {element.type}
          </span>
        </div>
        <label className='flex flex-col gap-2 text-sm'>
          <span className='text-xs uppercase tracking-wide text-slate-400'>Display name</span>
          <input
            type='text'
            value={element.name}
            onChange={handleNameChange}
            className='rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
          />
        </label>
        <dl className='grid grid-cols-2 gap-3 text-xs text-slate-300'>
          <div>
            <dt className='uppercase tracking-wide text-slate-500'>Bindings</dt>
            <dd className='text-sm font-semibold text-slate-100'>{element.bindings.length}</dd>
          </div>
          <div>
            <dt className='uppercase tracking-wide text-slate-500'>Properties</dt>
            <dd className='text-sm font-semibold text-slate-100'>{Object.keys(element.properties).length}</dd>
          </div>
        </dl>
      </section>

      <PropertyEditor element={element} />
      <BindingEditor element={element} />

      <button
        type='button'
        onClick={handleRemove}
        className='mt-auto rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400 hover:bg-red-500/20'
      >
        Remove element
      </button>
    </aside>
  )
}

export default InspectorPanel
