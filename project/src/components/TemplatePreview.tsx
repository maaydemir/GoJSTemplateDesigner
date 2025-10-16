import { useEffect, useMemo, useRef } from 'react'
import * as go from 'gojs'
import type { BindingConfig, GraphElement, HoverInteractionConfig } from '@/store/diagramStore'
import { HOVER_INTERACTION_DEFAULTS, useDiagramStore } from '@/store/diagramStore'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import { useNotificationStore, type AddNotificationOptions } from '@/store/notificationStore'
import {
  getRenderableProperties,
  isMarginValue,
  isSizeValue,
  type MarginValue,
  type SizeValue
} from '@/utils/graphObjectProperties'
import { isGoSpotName, type GoSpotName } from '@/constants/goSpot'

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

const SPOT_PROPERTY_KEYS = new Set(['alignment', 'locationSpot'])
const PREVIEW_HOVER_ADORNMENT_KEY = 'hover-preview-highlight'

const toGoSpot = (value: GoSpotName): go.Spot | null => {
  const record = go.Spot as unknown as Record<string, go.Spot | undefined>
  return record[value] ?? null
}

interface PropertyAssignment {
  key: string
  rawValue: unknown
  preparedValue: unknown
}

const buildPropertyAssignments = (element: GraphElement): PropertyAssignment[] => {
  const entries: PropertyAssignment[] = []

  getRenderableProperties(element).forEach(({ key, value }) => {
    if (isMarginValue(value)) {
      entries.push({ key, rawValue: value, preparedValue: normaliseMargin(value) })
      return
    }

    if (isSizeValue(value)) {
      entries.push({ key, rawValue: value, preparedValue: normaliseSize(value) })
      return
    }

    if (SPOT_PROPERTY_KEYS.has(key) && isGoSpotName(value)) {
      const spot = toGoSpot(value)
      if (spot) {
        entries.push({ key, rawValue: value, preparedValue: spot })
        return
      }
    }

    entries.push({ key, rawValue: value, preparedValue: value })
  })

  return entries
}

type NotifyFn = (message: string, options?: AddNotificationOptions) => string
type PropertyErrorCache = Map<string, string | undefined>

const serialiseValue = (value: unknown): string | undefined => {
  try {
    return JSON.stringify(value)
  } catch (error) {
    return typeof value === 'string' ? value : undefined
  }
}

const applyPropertyAssignments = (
  graphObject: go.GraphObject,
  element: GraphElement,
  assignments: PropertyAssignment[],
  notify: NotifyFn,
  propertyErrorCache: PropertyErrorCache
) => {
  const metadata = graphObjectMetadata[element.type]
  const displayName = element.name || metadata?.defaultName || metadata?.label || element.type

  assignments.forEach(({ key, preparedValue, rawValue }) => {
    const cacheKey = `${element.id}:${key}`

    try {
      ;(graphObject as unknown as Record<string, unknown>)[key] = preparedValue
      propertyErrorCache.delete(cacheKey)
    } catch (error) {
      const serialisedValue = serialiseValue(rawValue)
      if (propertyErrorCache.get(cacheKey) === serialisedValue) {
        return
      }

      propertyErrorCache.set(cacheKey, serialisedValue)
      const description = error instanceof Error ? error.message : undefined

      notify(`${displayName} nesnesinin ${key} özelliği yok gibi.`, {
        variant: 'error',
        description
      })
    }
  })
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

const resolveHoverInteraction = (
  interaction: HoverInteractionConfig | undefined
): HoverInteractionConfig => ({
  ...HOVER_INTERACTION_DEFAULTS,
  ...(interaction ?? {})
})

const createHoverHighlightAdornment = (
  $: typeof go.GraphObject.make,
  interaction: HoverInteractionConfig
): go.Adornment => {
  const borderColor = interaction.borderColor ?? null
  const backgroundColor = interaction.backgroundColor ?? null
  const strokeWidth = borderColor ? 2.4 : 0
  const indicatorFill = borderColor ?? HOVER_INTERACTION_DEFAULTS.borderColor ?? '#38bdf8'

  return $(
    go.Adornment,
    'Spot',
    { isActionable: false },
    $(
      go.Panel,
      'Auto',
      $(
        go.Shape,
        'Rectangle',
        {
          stroke: borderColor ?? 'transparent',
          strokeWidth,
          fill: backgroundColor ?? 'transparent',
          name: 'HOVER_HIGHLIGHT_SHAPE',
          isActionable: false
        }
      ),
      $(go.Placeholder, {
        padding: strokeWidth > 0 ? 4 : 2,
        isActionable: false,
        isHitTestable: false
      })
    ),
    $(
      go.Shape,
      'Circle',
      {
        alignment: go.Spot.TopRight,
        alignmentFocus: go.Spot.TopRight,
        desiredSize: new go.Size(10, 10),
        stroke: null,
        fill: indicatorFill,
        visible: Boolean(interaction.showIndicator),
        isHitTestable: false
      }
    )
  )
}

const applyNodeHoverInteraction = (
  node: go.Node,
  interaction: HoverInteractionConfig,
  $: typeof go.GraphObject.make
) => {
  if (!interaction.enabled) {
    return
  }

  const previousMouseEnter = node.mouseEnter
  const previousMouseLeave = node.mouseLeave

  node.mouseEnter = (event, obj, prevObj) => {
    if (typeof previousMouseEnter === 'function') {
      previousMouseEnter(event, obj, prevObj)
    }

    const part = obj.part
    if (!(part instanceof go.Node)) {
      return
    }

    if (!part.findAdornment(PREVIEW_HOVER_ADORNMENT_KEY)) {
      const adornment = createHoverHighlightAdornment($, interaction)
      adornment.category = PREVIEW_HOVER_ADORNMENT_KEY
      part.addAdornment(PREVIEW_HOVER_ADORNMENT_KEY, adornment)
    }
  }

  node.mouseLeave = (event, obj, nextObj) => {
    if (typeof previousMouseLeave === 'function') {
      previousMouseLeave(event, obj, nextObj)
    }

    const part = obj.part
    if (!(part instanceof go.Node)) {
      return
    }

    part.removeAdornment(PREVIEW_HOVER_ADORNMENT_KEY)
  }
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
  converters: Record<string, (value: unknown) => unknown>,
  notify: NotifyFn,
  propertyErrorCache: PropertyErrorCache
): go.GraphObject => {
  const childElements = childrenByParent.get(element.id) ?? []
  const childGraphObjects = childElements.map(child =>
    createGraphObject(child, childrenByParent, $, converters, notify, propertyErrorCache)
  )
  const assignments = buildPropertyAssignments(element)
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

  args.push(...bindingArgs)
  args.push(...childGraphObjects)

  const make = $ as unknown as (...factoryArgs: unknown[]) => go.GraphObject
  try {
    const graphObject = make(...args)
    applyPropertyAssignments(graphObject, element, assignments, notify, propertyErrorCache)

    if (element.type === 'node' && graphObject instanceof go.Node) {
      const interaction = resolveHoverInteraction(element.hoverInteraction)
      applyNodeHoverInteraction(graphObject, interaction, $)
    }

    return graphObject
  } catch (error) {
    const metadata = graphObjectMetadata[element.type]
    const displayName = element.name || metadata?.defaultName || metadata?.label || element.type
    const description = error instanceof Error ? error.message : undefined

    notify(`${displayName} nesnesi oluşturulurken bir hata oluştu.`, {
      variant: 'error',
      description
    })

    return make(go.Panel)
  }
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
  const propertyErrorCacheRef = useRef<PropertyErrorCache>(new Map())
  const addNotification = useNotificationStore(state => state.addNotification)
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

    const propertyErrorCache = propertyErrorCacheRef.current
    const elementById = new Map(elements.map(element => [element.id, element]))
    propertyErrorCache.forEach((_, key) => {
      const [elementId, propertyName] = key.split(':')
      const element = elementById.get(elementId)
      if (!element) {
        propertyErrorCache.delete(key)
        return
      }

      if (!(propertyName in element.properties)) {
        propertyErrorCache.delete(key)
      }
    })

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
    const nodeTemplate = createGraphObject(
      root,
      childrenByParent,
      $,
      converters,
      addNotification,
      propertyErrorCache
    ) as go.Node

    diagram.nodeTemplate = nodeTemplate
    diagram.clearHighlighteds()
    const sampleData = buildSampleNodeData(elements)
    diagram.model = new go.GraphLinksModel({
      nodeDataArray: [{ key: 'preview-node', ...sampleData }]
    })

    if (diagram.nodes.count > 0) {
      diagram.zoomToFit()
    } else {
      diagram.scale = 1
    }
  }, [elements, addNotification])

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
