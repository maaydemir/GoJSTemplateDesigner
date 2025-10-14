import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import type { GraphElement } from '@/store/diagramStore'
import { useDiagramStore } from '@/store/diagramStore'

interface BindingEditorProps {
  element: GraphElement
}

const BindingEditor = ({ element }: BindingEditorProps) => {
  const addBinding = useDiagramStore(state => state.addBinding)
  const updateBinding = useDiagramStore(state => state.updateBinding)
  const removeBinding = useDiagramStore(state => state.removeBinding)
  const metadata = graphObjectMetadata[element.type]
  const bindableProperties = metadata.properties.filter(property => property.bindingEnabled !== false)

  const handleAddBinding = () => {
    addBinding(element.id, { prop: '', path: '', twoWay: false })
  }

  return (
    <section className='space-y-4'>
      <header className='flex items-center justify-between'>
        <div>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Bindings</h3>
          <p className='text-[11px] text-slate-500'>Synchronise properties with data from your model.</p>
        </div>
        <button
          type='button'
          onClick={handleAddBinding}
          className='rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20'
        >
          Add binding
        </button>
      </header>

      {element.bindings.length === 0 && (
        <p className='text-xs text-slate-500'>This element has no bindings yet.</p>
      )}

      <div className='space-y-3'>
        {element.bindings.map(binding => (
          <div key={binding.id} className='rounded-md border border-slate-800 bg-slate-900/60 p-3'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid w-full grid-cols-1 gap-3'>
                <label className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
                  <span>Property</span>
                  <input
                    type='text'
                    value={binding.prop}
                    list={`binding-properties-${element.id}-${binding.id}`}
                    onChange={event => updateBinding(element.id, binding.id, current => ({
                      ...current,
                      prop: event.target.value
                    }))}
                    placeholder='e.g. text, fill, location'
                    className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
                  />
                  <datalist id={`binding-properties-${element.id}-${binding.id}`}>
                    {bindableProperties.map(property => (
                      <option key={property.name} value={property.name}>
                        {property.label}
                      </option>
                    ))}
                  </datalist>
                </label>
                <label className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
                  <span>Data path</span>
                  <input
                    type='text'
                    value={binding.path}
                    onChange={event => updateBinding(element.id, binding.id, current => ({
                      ...current,
                      path: event.target.value
                    }))}
                    placeholder='e.g. name, category, loc'
                    className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
                  />
                </label>
                <div className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
                  <span>Options</span>
                  <div className='flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={binding.twoWay}
                        onChange={event => updateBinding(element.id, binding.id, current => ({
                          ...current,
                          twoWay: event.target.checked
                        }))}
                        className='h-4 w-4 rounded border border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500'
                      />
                      <span className='text-slate-200'>Two-way</span>
                    </label>
                    <label className='flex items-center gap-2 text-slate-200'>
                      <span className='text-xs uppercase tracking-wide text-slate-400'>Converter</span>
                      <input
                        type='text'
                        value={binding.converter ?? ''}
                        onChange={event => updateBinding(element.id, binding.id, current => ({
                          ...current,
                          converter: event.target.value.trim() ? event.target.value : undefined
                        }))}
                        placeholder='Optional function name'
                        className='w-40 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
                      />
                    </label>
                  </div>
                </div>
              </div>
              <button
                type='button'
                onClick={() => removeBinding(element.id, binding.id)}
                className='rounded-md border border-red-500/50 bg-red-500/10 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-red-200 transition hover:border-red-400 hover:bg-red-500/20'
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}

export default BindingEditor
