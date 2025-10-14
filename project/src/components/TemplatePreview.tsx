import { useMemo } from 'react'
import type { BindingConfig, GraphElement } from '@/store/diagramStore'
import { useDiagramStore } from '@/store/diagramStore'

interface PreviewNode {
  id: string
  name: string
  type: GraphElement['type']
  properties: GraphElement['properties']
  bindings: BindingConfig[]
  children: PreviewNode[]
}

const buildPreviewTree = (elements: GraphElement[]): PreviewNode | null => {
  if (elements.length === 0) {
    return null
  }

  const nodeMap = new Map<string, PreviewNode>()
  const nodes: PreviewNode[] = elements.map(element => {
    const node: PreviewNode = {
      id: element.id,
      name: element.name,
      type: element.type,
      properties: element.properties,
      bindings: element.bindings,
      children: []
    }
    nodeMap.set(element.id, node)
    return node
  })

  let root: PreviewNode | null = null

  elements.forEach((element, index) => {
    const node = nodes[index]
    if (element.parentId) {
      const parent = nodeMap.get(element.parentId)
      if (parent) {
        parent.children.push(node)
      }
      return
    }

    root = node
  })

  return root
}

const formatPreviewValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(formatPreviewValue).join(', ')}]`
  }

  if (typeof value === 'object') {
    return '{…}'
  }

  return '—'
}

const TemplatePreview = () => {
  const elements = useDiagramStore(state => state.elements)

  const tree = useMemo(() => buildPreviewTree(elements), [elements])

  if (!tree) {
    return (
      <aside className='flex h-full flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400'>
        <header className='space-y-1'>
          <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Template preview</h3>
          <p className='text-xs text-slate-500'>Start by adding elements to the canvas to see a live summary.</p>
        </header>
      </aside>
    )
  }

  const renderNode = (node: PreviewNode, depth = 0): JSX.Element => {
    const propertyEntries = Object.entries(node.properties)
    const previewProperties = propertyEntries.slice(0, 3)
    const remainingPropertyCount = propertyEntries.length - previewProperties.length
    const previewBindings = node.bindings.slice(0, 3)
    const remainingBindingCount = node.bindings.length - previewBindings.length

    return (
      <li key={node.id} className={depth === 0 ? '' : 'space-y-3'}>
        <div className='rounded-lg border border-slate-800 bg-slate-900/80 p-3 shadow-sm shadow-slate-950/30'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-sm font-medium text-slate-100'>{node.name}</p>
              <p className='text-xs text-slate-500'>
                {node.children.length} {node.children.length === 1 ? 'child' : 'children'} ·{' '}
                {propertyEntries.length} {propertyEntries.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
            <span className='rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400'>
              {node.type}
            </span>
          </div>

          {previewProperties.length > 0 && (
            <dl className='mt-3 grid gap-2 text-xs text-slate-300'>
              {previewProperties.map(([key, value]) => (
                <div key={key} className='grid grid-cols-[auto,1fr] items-baseline gap-2'>
                  <dt className='uppercase tracking-wide text-slate-500'>{key}</dt>
                  <dd className='truncate text-slate-200'>{formatPreviewValue(value)}</dd>
                </div>
              ))}
              {remainingPropertyCount > 0 && (
                <div className='text-[11px] text-slate-500'>+{remainingPropertyCount} more properties</div>
              )}
            </dl>
          )}

          {previewBindings.length > 0 && (
            <div className='mt-3 space-y-1 text-xs text-emerald-300'>
              {previewBindings.map(binding => (
                <div key={binding.id}>
                  <span className='font-medium text-emerald-200'>{binding.prop}</span>
                  <span className='text-emerald-400'> → </span>
                  <span className='text-emerald-100'>{binding.path}</span>
                  {binding.twoWay && <span className='ml-2 text-[10px] uppercase text-emerald-400'>Two-way</span>}
                  {binding.converter && (
                    <span className='ml-2 text-[10px] uppercase text-emerald-400'>Converter: {binding.converter}</span>
                  )}
                </div>
              ))}
              {remainingBindingCount > 0 && (
                <p className='text-[11px] text-emerald-400'>+{remainingBindingCount} more bindings</p>
              )}
            </div>
          )}
        </div>
        {node.children.length > 0 && (
          <ul className='ml-4 mt-3 space-y-3 border-l border-slate-800 pl-4'>
            {node.children.map(child => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <aside className='flex h-full min-h-[280px] flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-4'>
      <header className='space-y-1'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Template preview</h3>
        <p className='text-xs text-slate-500'>Live summary of the node hierarchy, properties and bindings.</p>
      </header>
      <div className='max-h-full overflow-y-auto pr-1 text-sm'>
        <ul className='space-y-4'>{renderNode(tree)}</ul>
      </div>
    </aside>
  )
}

export default TemplatePreview
