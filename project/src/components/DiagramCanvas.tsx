import type { DragEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import * as go from 'gojs'
import { useDiagramStore } from '@/store/diagramStore'
import type { GraphObjectType } from '@/store/diagramStore'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import { GRAPH_OBJECT_DRAG_TYPE, generateElementName, isGraphObjectType } from '@/utils/graphElements'

const DiagramCanvas = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const diagramRef = useRef<go.Diagram | null>(null)
  const dragCounterRef = useRef(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const elements = useDiagramStore(state => state.elements)
  const selectElement = useDiagramStore(state => state.selectElement)
  const selectedId = useDiagramStore(state => state.selectedId)
  const addElement = useDiagramStore(state => state.addElement)
  const rootElement = useDiagramStore(state => state.elements.find(element => element.parentId === null))

  useEffect(() => {
    if (!containerRef.current || diagramRef.current) {
      return
    }

    const $ = go.GraphObject.make
    const diagram = $(go.Diagram, containerRef.current, {
      layout: $(go.TreeLayout, { angle: 90, layerSpacing: 40 }),
      padding: 20,
      background: '#1a1f2b'
    })

    diagram.nodeTemplate = $(
      go.Node,
      'Auto',
      {
        selectionAdorned: false,
        cursor: 'pointer'
      },
      new go.Binding('isSelected', 'selected'),
      $(go.Shape, 'RoundedRectangle', {
        fill: '#334155',
        stroke: '#475569',
        strokeWidth: 1.5
      }),
      $(
        go.Panel,
        'Table',
        { padding: 8 },
        $(
          go.TextBlock,
          {
            row: 0,
            column: 0,
            maxSize: new go.Size(140, NaN),
            stroke: 'white',
            font: 'bold 12px Inter, sans-serif'
          },
          new go.Binding('text', 'name')
        ),
        $(
          go.TextBlock,
          {
            row: 1,
            column: 0,
            margin: new go.Margin(4, 0, 0, 0),
            stroke: '#94a3b8',
            font: '10px Inter, sans-serif'
          },
          new go.Binding('text', 'type', type => type.toUpperCase())
        )
      )
    )

    diagram.addDiagramListener('ChangedSelection', () => {
      const first = diagram.selection.first()
      if (first?.data?.key) {
        selectElement(first.data.key as string)
      } else {
        selectElement(null)
      }
    })

    diagramRef.current = diagram
  }, [selectElement])

  useEffect(() => {
    const diagram = diagramRef.current
    if (!diagram) {
      return
    }

    const model = new go.TreeModel()
    model.nodeDataArray = elements.map(element => ({
      key: element.id,
      name: element.name,
      type: element.type,
      parent: element.parentId ?? undefined,
      selected: element.id === selectedId
    }))
    diagram.model = model

    if (selectedId) {
      const part = diagram.findPartForKey(selectedId)
      if (part) {
        diagram.select(part)
      }
    } else {
      diagram.clearSelection()
    }
  }, [elements, selectedId])

  const isPaletteDrag = (event: DragEvent<HTMLDivElement>) =>
    event.dataTransfer.types.includes(GRAPH_OBJECT_DRAG_TYPE)

  const enableDropFeedback = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isPaletteDrag(event)) {
      return
    }

    enableDropFeedback(event)
    const typeValue = event.dataTransfer.getData(GRAPH_OBJECT_DRAG_TYPE)
    dragCounterRef.current = 0
    setIsDragOver(false)

    if (!typeValue || !isGraphObjectType(typeValue)) {
      return
    }

    const type: GraphObjectType = typeValue
    if (!rootElement) {
      return
    }

    const parentMetadata = graphObjectMetadata[rootElement.type]
    if (!parentMetadata.allowedChildren.includes(type)) {
      return
    }

    addElement({
      type,
      parentId: rootElement.id,
      name: generateElementName(type)
    })
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!isPaletteDrag(event)) {
      return
    }

    enableDropFeedback(event)
    dragCounterRef.current += 1
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isPaletteDrag(event)) {
      return
    }

    enableDropFeedback(event)
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }

  const hasChildElements = elements.some(element => element.parentId !== null)
  const canvasClasses = [
    'h-full w-full rounded-lg border border-slate-800 bg-canvas shadow-inner transition-colors',
    isDragOver ? 'border-emerald-400 ring-2 ring-emerald-500/40' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className='relative h-full w-full'>
      <div
        ref={containerRef}
        className={canvasClasses}
        onDragEnter={handleDragEnter}
        onDragOver={event => {
          if (!isPaletteDrag(event)) {
            return
          }

          enableDropFeedback(event)
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      {!hasChildElements && !isDragOver && (
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-slate-400'>
          <span className='rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs uppercase tracking-wide text-slate-300'>
            Empty template
          </span>
          <p className='max-w-[260px] text-xs text-slate-400'>Drag a panel, shape or text block from the palette to start building your node template.</p>
        </div>
      )}
      {isDragOver && (
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-emerald-200'>
          <span className='rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-wide'>
            Release to add
          </span>
          <p className='max-w-[260px] text-xs text-emerald-100/80'>
            The new element will be nested under {rootElement?.name ?? 'the root node'}.
          </p>
        </div>
      )}
    </div>
  )
}

export default DiagramCanvas
