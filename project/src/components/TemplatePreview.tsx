import { useEffect, useMemo, useRef } from 'react'
import * as go from 'gojs'
import type { BindingConfig, GraphElement } from '@/store/diagramStore'
import { useDiagramStore } from '@/store/diagramStore'
import {
  getRenderableProperties,
  isMarginValue,
  isSizeValue,
  type MarginValue,
  type SizeValue
} from '@/utils/graphObjectProperties'

const normaliseMargin = (value: MarginValue): go.Margin => {
  const toNumber = (input: number | null, fallback: number) =>
    typeof input === 'number' && Number.isFinite(input) ? input : fallback

  return new go.Margin(
    toNumber(value.top, 0),
    toNumber(value.right, 0),
    toNumber(value.bottom, 0),
    toNumber(value.left, 0)
  )
}

const normaliseSize = (value: SizeValue): go.Size => {
  const toComponent = (input: number | null) =>
    typeof input === 'number' && Number.isFinite(input) ? input : NaN

  return new go.Size(toComponent(value.width), toComponent(value.height))
}

const buildPropertyObject = (element: GraphElement): Record<string, unknown> => {
  const entries: [string, unknown][] = []

  getRenderableProperties(element).forEach(({ key, value }) => {
    if (isMarginValue(value)) {
      entries.push([key, normaliseMargin(value)])
      return
    }

    if (isSizeValue(value)) {
      entries.push([key, normaliseSize(value)])
      return
    }

    entries.push([key, value])
  })

  return Object.fromEntries(entries)
}

const buildBindingArguments = (
  bindings: BindingConfig[],
  converters: Record<string, (value: unknown) => unknown>
): go.Binding[] => {
  return bindings.map(binding => {
    const bindingInstance = new go.Binding(binding.prop, binding.path)

    if (binding.twoWay) {
      bindingInstance.makeTwoWay()
    }

    if (binding.converter) {
      if (!converters[binding.converter]) {
        converters[binding.converter] = value => value
      }

      bindingInstance.converter = converters[binding.converter]
    }

    return bindingInstance
  })
}

const groupChildrenByParent = (elements: GraphElement[]): Map<string, GraphElement[]> => {
  const map = new Map<string, GraphElement[]>()

  elements.forEach(element => {
    if (!element.parentId) {
      return
    }

    if (!map.has(element.parentId)) {
      map.set(element.parentId, [])
    }

    map.get(element.parentId)!.push(element)
  })

  return map
}

const createGraphObject = (
  element: GraphElement,
  childrenByParent: Map<string, GraphElement[]>,
  $: typeof go.GraphObject.make,
  converters: Record<string, (value: unknown) => unknown>
): go.GraphObject => {
  const childElements = childrenByParent.get(element.id) ?? []
  const childGraphObjects = childElements.map(child =>
    createGraphObject(child, childrenByParent, $, converters)
  )
  const propertyObject = buildPropertyObject(element)
  const bindingArgs = buildBindingArguments(element.bindings, converters)
  const args: unknown[] = []

  if (element.type === 'node') {
    const panelType = typeof element.properties.category === 'string' ? element.properties.category : 'Auto'
    args.push(go.Node, panelType)
  } else if (element.type === 'panel') {
    const panelType = typeof element.properties.type === 'string' ? element.properties.type : 'Auto'
    args.push(go.Panel, panelType)
  } else if (element.type === 'shape') {
    args.push(go.Shape)
  } else if (element.type === 'text') {
    args.push(go.TextBlock)
  } else {
    args.push(go.Picture)
  }

  if (Object.keys(propertyObject).length > 0) {
    args.push(propertyObject)
  }

  args.push(...bindingArgs)
  args.push(...childGraphObjects)

  const make = $ as unknown as (...factoryArgs: unknown[]) => go.GraphObject

  return make(...args)
}

const buildSampleNodeData = (elements: GraphElement[]): go.ObjectData => {
  const sample: Record<string, unknown> = {
    key: 'preview-node'
  }

  elements.forEach(element => {
    element.bindings.forEach(binding => {
      if (sample[binding.path] !== undefined) {
        return
      }

      const value = element.properties[binding.prop]
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        sample[binding.path] = value
        return
      }

      if (value && typeof value === 'object') {
        sample[binding.path] = value
        return
      }

      sample[binding.path] = `Sample ${binding.path}`
    })
  })

  return sample
}

const TemplatePreview = () => {
  const elements = useDiagramStore(state => state.elements)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const diagramRef = useRef<go.Diagram | null>(null)
  const hasRenderableContent = useMemo(
    () => elements.some(element => element.parentId !== null),
    [elements]
  )

  useEffect(() => {
    if (!containerRef.current || diagramRef.current) {
      return
    }

    const $ = go.GraphObject.make
    const diagram = $(go.Diagram, containerRef.current, {
      isReadOnly: true,
      allowHorizontalScroll: false,
      allowVerticalScroll: false,
      allowZoom: false,
      'animationManager.isEnabled': false,
      padding: 16,
      contentAlignment: go.Spot.Center
    })

    diagramRef.current = diagram
    diagram.model = new go.GraphLinksModel()

    return () => {
      diagram.div = null
      diagramRef.current = null
    }
  }, [])

  useEffect(() => {
    const diagram = diagramRef.current
    if (!diagram) {
      return
    }

    const root = elements.find(element => element.parentId === null)
    const $ = go.GraphObject.make
    if (!root) {
      diagram.nodeTemplate = $(go.Node, 'Auto')
      diagram.model = new go.GraphLinksModel()
      diagram.scale = 1
      return
    }

    const childrenByParent = groupChildrenByParent(elements)
    const converters: Record<string, (value: unknown) => unknown> = {}
    const nodeTemplate = createGraphObject(root, childrenByParent, $, converters) as go.Node

    diagram.nodeTemplate = nodeTemplate
    const sampleData = buildSampleNodeData(elements)
    diagram.model = new go.GraphLinksModel({
      nodeDataArray: [{ key: 'preview-node', ...sampleData }]
    })

    if (diagram.nodes.count > 0) {
      diagram.zoomToFit()
    } else {
      diagram.scale = 1
    }
  }, [elements])

  return (
    <aside className='flex h-full min-h-[280px] flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-4'>
      <header className='space-y-1'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-200'>Template preview</h3>
        <p className='text-xs text-slate-500'>See how the current template renders inside a GoJS diagram.</p>
      </header>
      <div
        ref={containerRef}
        className='relative flex-1 min-h-[240px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60'
      />
      {!hasRenderableContent && (
        <p className='text-xs text-slate-500'>Add panels, shapes or text blocks to the template to see them rendered live.</p>
      )}
    </aside>
  )
}

export default TemplatePreview
