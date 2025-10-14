import type { FC } from 'react'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import type { GraphObjectType } from '@/store/diagramStore'
import { useDiagramStore } from '@/store/diagramStore'

const paletteTypes: GraphObjectType[] = ['panel', 'shape', 'text', 'picture']

const paletteItems = paletteTypes.map(type => {
  const metadata = graphObjectMetadata[type]
  return {
    type,
    label: metadata.label,
    description: metadata.description,
    defaultName: metadata.defaultName
  }
})

const PalettePanel: FC = () => {
  const root = useDiagramStore(state => state.elements.find(element => element.parentId === null))
  const addElement = useDiagramStore(state => state.addElement)

  return (
    <aside className='flex h-full min-w-[220px] flex-col gap-4 border-r border-slate-800 bg-panel p-4'>
      <div>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Palette</h2>
        <p className='text-xs text-slate-500'>Drop targets will be implemented later.</p>
      </div>
      <div className='flex flex-col gap-3'>
        {paletteItems.map(item => (
          <button
            key={item.type}
            type='button'
            onClick={() =>
              addElement({
                type: item.type,
                name: `${item.defaultName} ${Math.floor(Math.random() * 90) + 10}`,
                parentId: root?.id ?? null
              })
            }
            className={[
              'rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm text-slate-200',
              'transition hover:border-slate-500 hover:bg-slate-700'
            ].join(' ')}
          >
            <span className='block font-medium'>{item.label}</span>
            <span className='block text-xs text-slate-400'>{item.description}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default PalettePanel
