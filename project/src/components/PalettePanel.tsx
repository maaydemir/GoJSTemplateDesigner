import type { FC } from 'react'
import GraphObjectIcon from './GraphObjectIcon'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import type { GraphObjectType } from '@/store/diagramStore'
import { useDiagramStore } from '@/store/diagramStore'
import { useUIStore } from '@/store/uiStore'
import { GRAPH_OBJECT_DRAG_TYPE, findAcceptingParent, generateElementName } from '@/utils/graphElements'

const paletteTypes: GraphObjectType[] = ['panel', 'shape', 'text', 'picture']

const paletteItems = paletteTypes.map(type => {
  const metadata = graphObjectMetadata[type]
  return {
    type,
    label: metadata.label
  }
})

const PalettePanel: FC = () => {
  const addElement = useDiagramStore(state => state.addElement)
  const isPaletteCollapsed = useUIStore(state => state.isPaletteCollapsed)
  const togglePalette = useUIStore(state => state.togglePalette)

  if (isPaletteCollapsed) {
    return (
      <aside className='flex h-full w-10 flex-col items-center justify-center border-r border-slate-800 bg-panel'>
        <button
          type='button'
          onClick={togglePalette}
          className='rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700'
          aria-label='Expand palette panel'
        >
          ›
        </button>
      </aside>
    )
  }

  return (
    <aside className='flex h-full min-w-[240px] flex-col gap-4 border-r border-slate-800 bg-panel p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Palette</h2>
          <p className='text-xs text-slate-500'>Drag items onto the canvas or click to add them.</p>
        </div>
        <button
          type='button'
          onClick={togglePalette}
          className='rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700'
          aria-label='Collapse palette panel'
        >
          ‹
        </button>
      </div>
      <div className='grid gap-3'>
        {paletteItems.map(item => (
          <button
            key={item.type}
            type='button'
            draggable
            onClick={() => {
              const { elements, selectedId } = useDiagramStore.getState()
              const parent = findAcceptingParent(elements, selectedId, item.type)
              if (!parent) {
                return
              }

              addElement({
                type: item.type,
                name: generateElementName(item.type),
                parentId: parent.id
              })
            }}
            onDragStart={event => {
              event.dataTransfer.setData(GRAPH_OBJECT_DRAG_TYPE, item.type)
              event.dataTransfer.effectAllowed = 'copy'
              event.dataTransfer.setData('text/plain', item.label)
            }}
            className='flex cursor-grab items-center gap-3 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-700'
          >
            <GraphObjectIcon type={item.type} />
            <span className='font-medium'>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default PalettePanel
