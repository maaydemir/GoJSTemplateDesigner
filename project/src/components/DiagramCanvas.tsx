import { useEffect, useRef } from 'react'
import * as go from 'gojs'
import { useDiagramStore } from '@/store/diagramStore'

const DiagramCanvas = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const diagramRef = useRef<go.Diagram | null>(null)
  const elements = useDiagramStore(state => state.elements)
  const selectElement = useDiagramStore(state => state.selectElement)
  const selectedId = useDiagramStore(state => state.selectedId)

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

  return <div ref={containerRef} className='h-full w-full rounded-lg border border-slate-800 bg-canvas shadow-inner' />
}

export default DiagramCanvas
