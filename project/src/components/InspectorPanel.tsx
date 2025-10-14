import type { ChangeEvent } from 'react'
import { useDiagramStore } from '@/store/diagramStore'

const InspectorPanel = () => {
  const element = useDiagramStore(state => state.elements.find(item => item.id === state.selectedId))
  const updateElement = useDiagramStore(state => state.updateElement)
  const removeElement = useDiagramStore(state => state.removeElement)

  if (!element) {
    return (
      <aside className='flex h-full min-w-[260px] flex-col justify-center border-l border-slate-800 bg-panel p-6 text-center text-sm text-slate-400'>
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
    <aside className='flex h-full min-w-[260px] flex-col gap-4 border-l border-slate-800 bg-panel p-6'>
      <div>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Inspector</h2>
        <p className='text-xs text-slate-500'>Preview of property editing workflow.</p>
      </div>
      <label className='flex flex-col gap-2 text-sm'>
        <span className='text-xs uppercase tracking-wide text-slate-400'>Display Name</span>
        <input
          type='text'
          value={element.name}
          onChange={handleNameChange}
          className={[
            'rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none',
            'transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
          ].join(' ')}
        />
      </label>
      <div className='rounded-lg border border-slate-800 bg-slate-900 p-4'>
        <h3 className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Metadata</h3>
        <dl className='mt-3 space-y-2 text-xs text-slate-300'>
          <div className='flex justify-between'>
            <dt>Type</dt>
            <dd className='font-mono uppercase text-slate-400'>{element.type}</dd>
          </div>
          <div className='flex justify-between'>
            <dt>Bindings</dt>
            <dd>{element.bindings.length}</dd>
          </div>
          <div className='flex justify-between'>
            <dt>Properties</dt>
            <dd>{Object.keys(element.properties).length}</dd>
          </div>
        </dl>
      </div>
      <button
        type='button'
        onClick={handleRemove}
        className={[
          'mt-auto rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300',
          'transition hover:border-red-400 hover:bg-red-500/20'
        ].join(' ')}
      >
        Remove element
      </button>
    </aside>
  )
}

export default InspectorPanel
