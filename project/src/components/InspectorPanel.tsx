import type { ChangeEvent } from 'react'
import { useEffect, useMemo } from 'react'
import { useDiagramStore } from '@/store/diagramStore'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import PropertyEditor from './PropertyEditor'
import BindingEditor from './BindingEditor'
import { useUIStore } from '@/store/uiStore'
import type { InspectorTab } from '@/store/uiStore'

const inspectorTabs: Array<{ id: InspectorTab; label: string }> = [
  { id: 'properties', label: 'Properties' },
  { id: 'bindings', label: 'Bindings' },
  { id: 'help', label: 'Help' }
]

const formatDefaultValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value, null, 2)
}

const InspectorPanel = () => {
  const element = useDiagramStore(state => state.elements.find(item => item.id === state.selectedId))
  const updateElement = useDiagramStore(state => state.updateElement)
  const removeElement = useDiagramStore(state => state.removeElement)
  const metadata = useMemo(() => (element ? graphObjectMetadata[element.type] : null), [element])
  const isInspectorCollapsed = useUIStore(state => state.isInspectorCollapsed)
  const toggleInspector = useUIStore(state => state.toggleInspector)
  const inspectorTab = useUIStore(state => state.inspectorTab)
  const setInspectorTab = useUIStore(state => state.setInspectorTab)

  useEffect(() => {
    if (!element && inspectorTab !== 'properties') {
      setInspectorTab('properties')
    }
  }, [element, inspectorTab, setInspectorTab])

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!element) {
      return
    }

    const value = event.target.value
    updateElement(element.id, current => ({ ...current, name: value }))
  }

  const handleRemove = () => {
    if (!element) {
      return
    }

    removeElement(element.id)
  }

  if (isInspectorCollapsed) {
    return (
      <aside className='flex h-full w-10 flex-col items-center justify-center border-l border-slate-800 bg-panel'>
        <button
          type='button'
          onClick={toggleInspector}
          className='rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700'
          aria-label='Expand inspector panel'
        >
          ‹
        </button>
      </aside>
    )
  }

  return (
    <aside className='flex h-full min-w-[320px] flex-col border-l border-slate-800 bg-panel'>
      <header className='flex items-center justify-between border-b border-slate-800 p-6 pb-4'>
        <div>
          <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Inspector</h2>
          <p className='text-xs text-slate-500'>Configure the selected GraphObject and manage its bindings.</p>
        </div>
        <button
          type='button'
          onClick={toggleInspector}
          className='rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700'
          aria-label='Collapse inspector panel'
        >
          ›
        </button>
      </header>

      {!element ? (
        <div className='flex flex-1 flex-col items-center justify-center p-6 text-sm text-slate-400'>
          <p>Select a node to edit its properties.</p>
        </div>
      ) : (
        <div className='flex flex-1 flex-col gap-6 overflow-hidden p-6'>
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

          <nav className='flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400'>
            {inspectorTabs.map(tab => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setInspectorTab(tab.id)}
                className={[
                  'rounded-md px-3 py-1 transition',
                  inspectorTab === tab.id
                    ? 'bg-slate-800 text-emerald-200 shadow-inner shadow-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className='flex-1 overflow-y-auto pr-1'>
            {inspectorTab === 'properties' && <PropertyEditor element={element} />}
            {inspectorTab === 'bindings' && <BindingEditor element={element} />}
            {inspectorTab === 'help' && (
              <section className='space-y-4 text-sm text-slate-300'>
                <p>{metadata?.description ?? 'Select a different element to view contextual help and usage tips.'}</p>
                {metadata && (
                  <>
                    <div className='space-y-2'>
                      <h3 className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Allowed children</h3>
                      {metadata.allowedChildren.length > 0 ? (
                        <ul className='list-disc space-y-1 pl-5'>
                          {metadata.allowedChildren.map(childType => (
                            <li key={childType}>{graphObjectMetadata[childType].label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className='text-xs text-slate-500'>This element does not accept nested graph objects.</p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Default properties</h3>
                      {Object.keys(metadata.defaultProperties).length === 0 ? (
                        <p className='text-xs text-slate-500'>No default properties are defined for this element.</p>
                      ) : (
                        <ul className='space-y-1'>
                          {Object.entries(metadata.defaultProperties).map(([key, value]) => (
                            <li
                              key={key}
                              className='space-y-1 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200'
                            >
                              <span className='font-medium uppercase tracking-wide text-slate-400'>{key}</span>
                              <span className='whitespace-pre-wrap break-words text-slate-200'>{formatDefaultValue(value)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <p className='text-xs text-slate-500'>
                      {metadata.canBeRoot
                        ? 'This element can be used as the root of the template.'
                        : 'This element must be placed inside a compatible parent.'}
                    </p>
                  </>
                )}
              </section>
            )}
          </div>

          <button
            type='button'
            onClick={handleRemove}
            className='mt-auto rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400 hover:bg-red-500/20'
          >
            Remove element
          </button>
        </div>
      )}
    </aside>
  )
}

export default InspectorPanel
