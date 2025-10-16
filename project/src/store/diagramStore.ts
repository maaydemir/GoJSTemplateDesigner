import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'

export type GraphObjectType = 'node' | 'panel' | 'shape' | 'text' | 'picture'

export interface BindingConfig {
  id: string
  prop: string
  path: string
  twoWay: boolean
  converter?: string
}

export type BindingInput = Omit<BindingConfig, 'id'>

export interface HoverInteractionConfig {
  enabled: boolean
  borderColor: string | null
  backgroundColor: string | null
  showIndicator: boolean
}

export interface GraphElement {
  id: string
  type: GraphObjectType
  name: string
  parentId: string | null
  properties: Record<string, unknown>
  bindings: BindingConfig[]
  hoverInteraction: HoverInteractionConfig
}

interface DiagramSnapshot {
  elements: GraphElement[]
  selectedId: string | null
}

interface DiagramHistoryState {
  past: DiagramSnapshot[]
  future: DiagramSnapshot[]
}

export interface DiagramState {
  elements: GraphElement[]
  selectedId: string | null
  canUndo: boolean
  canRedo: boolean
  addElement: (element: Omit<GraphElement, 'id' | 'bindings' | 'properties' | 'hoverInteraction'> & {
    properties?: GraphElement['properties']
    bindings?: BindingConfig[]
    hoverInteraction?: Partial<HoverInteractionConfig>
  }) => void
  updateElement: (id: string, updater: (element: GraphElement) => GraphElement) => void
  selectElement: (id: string | null) => void
  removeElement: (id: string) => void
  setProperty: (id: string, property: string, value: unknown) => void
  removeProperty: (id: string, property: string) => void
  addBinding: (elementId: string, binding: BindingInput) => void
  updateBinding: (
    elementId: string,
    bindingId: string,
    updater: (binding: BindingConfig) => BindingConfig
  ) => void
  removeBinding: (elementId: string, bindingId: string) => void
  updateHoverInteraction: (
    elementId: string,
    updater: (interaction: HoverInteractionConfig) => HoverInteractionConfig
  ) => void
  undo: () => void
  redo: () => void
  history: DiagramHistoryState
}

export const HOVER_INTERACTION_DEFAULTS: HoverInteractionConfig = {
  enabled: false,
  borderColor: '#38bdf8',
  backgroundColor: '#1e293b',
  showIndicator: false
}

const createHoverInteraction = (overrides?: Partial<HoverInteractionConfig>): HoverInteractionConfig => ({
  ...HOVER_INTERACTION_DEFAULTS,
  ...overrides
})

const areHoverInteractionsEqual = (
  left: HoverInteractionConfig,
  right: HoverInteractionConfig
): boolean => {
  return (
    left.enabled === right.enabled &&
    left.borderColor === right.borderColor &&
    left.backgroundColor === right.backgroundColor &&
    left.showIndicator === right.showIndicator
  )
}

const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item)) as unknown as T
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      cloneValue(entry)
    ])
    return Object.fromEntries(entries) as T
  }

  return value
}

const cloneElement = (element: GraphElement): GraphElement => ({
  ...element,
  properties: cloneValue(element.properties),
  bindings: element.bindings.map(binding => ({ ...binding })),
  hoverInteraction: { ...element.hoverInteraction }
})

const createSnapshot = (state: DiagramState): DiagramSnapshot => ({
  elements: state.elements.map(cloneElement),
  selectedId: state.selectedId
})

const applySnapshot = (snapshot: DiagramSnapshot) => ({
  elements: snapshot.elements.map(cloneElement),
  selectedId: snapshot.selectedId
})

const createGraphElement = ({
  type,
  parentId,
  name,
  properties,
  bindings,
  hoverInteraction
}: {
  type: GraphObjectType
  parentId: string | null
  name?: string
  properties?: GraphElement['properties']
  bindings?: BindingConfig[]
  hoverInteraction?: Partial<HoverInteractionConfig>
}): GraphElement => {
  const metadata = graphObjectMetadata[type]
  const mergedProperties: GraphElement['properties'] = {
    ...cloneValue(metadata.defaultProperties),
    ...(properties ?? {})
  }

  return {
    id: nanoid(),
    type,
    name: name ?? metadata.defaultName,
    parentId,
    properties: mergedProperties,
    bindings: bindings ? bindings.map(binding => ({ ...binding })) : [],
    hoverInteraction: createHoverInteraction(hoverInteraction)
  }
}

const createInitialNode = (): GraphElement =>
  createGraphElement({
    type: 'node',
    parentId: null
  })

const buildChildrenIndex = (elements: GraphElement[]): Record<string, GraphElement[]> => {
  return elements.reduce<Record<string, GraphElement[]>>((acc, element) => {
    if (!element.parentId) {
      return acc
    }

    if (!acc[element.parentId]) {
      acc[element.parentId] = []
    }

    acc[element.parentId].push(element)
    return acc
  }, {})
}

export const useDiagramStore = create<DiagramState>((set) => ({
  elements: [createInitialNode()],
  selectedId: null,
  canUndo: false,
  canRedo: false,
  history: {
    past: [],
    future: []
  },
  addElement: ({
    type,
    name,
    parentId,
    properties = {},
    bindings = [],
    hoverInteraction
  }) => {
    const element = createGraphElement({
      type,
      parentId,
      name,
      properties,
      bindings,
      hoverInteraction
    })

    set(state => {
      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements: [...state.elements, element],
        selectedId: element.id,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  updateElement: (id, updater) => {
    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== id) {
          return element
        }

        const updated = updater(element)
        if (updated !== element) {
          didUpdate = true
        }

        return updated
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  selectElement: id => set({ selectedId: id }),
  removeElement: id => {
    set(state => {
      if (!state.elements.some(element => element.id === id)) {
        return {}
      }

      const index = buildChildrenIndex(state.elements)
      const collect = (currentId: string, acc: Set<string>) => {
        acc.add(currentId)
        const children = index[currentId] ?? []
        children.forEach(child => collect(child.id, acc))
      }

      const toRemove = new Set<string>()
      collect(id, toRemove)

      const remaining = state.elements.filter(element => !toRemove.has(element.id))
      const hasRoot = remaining.some(element => element.parentId === null)
      const nextElements = hasRoot ? remaining : [createInitialNode()]
      const selectedId = state.selectedId && toRemove.has(state.selectedId) ? null : state.selectedId

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements: nextElements,
        selectedId: hasRoot ? selectedId : null,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  setProperty: (id, property, value) => {
    const clonedValue = cloneValue(value)

    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== id) {
          return element
        }

        didUpdate = true
        return { ...element, properties: { ...element.properties, [property]: clonedValue } }
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  removeProperty: (id, property) => {
    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== id) {
          return element
        }

        if (!(property in element.properties)) {
          return element
        }

        didUpdate = true
        const { [property]: _removed, ...rest } = element.properties
        return { ...element, properties: rest }
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  updateHoverInteraction: (elementId, updater) => {
    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== elementId) {
          return element
        }

        const next = updater({ ...element.hoverInteraction })
        if (areHoverInteractionsEqual(next, element.hoverInteraction)) {
          return element
        }

        didUpdate = true
        return { ...element, hoverInteraction: { ...next } }
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  addBinding: (elementId, binding) => {
    const entry: BindingConfig = { ...binding, id: nanoid() }

    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== elementId) {
          return element
        }

        didUpdate = true
        return { ...element, bindings: [...element.bindings, entry] }
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  updateBinding: (elementId, bindingId, updater) => {
    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== elementId) {
          return element
        }

        const bindings = element.bindings.map(binding => {
          if (binding.id !== bindingId) {
            return binding
          }

          const updated = updater(binding)
          if (updated !== binding) {
            didUpdate = true
          }

          return updated
        })

        if (!didUpdate && element.bindings.some(binding => binding.id === bindingId)) {
          didUpdate = true
        }

        return { ...element, bindings }
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  removeBinding: (elementId, bindingId) => {
    set(state => {
      let didUpdate = false
      const elements = state.elements.map(element => {
        if (element.id !== elementId) {
          return element
        }

        const bindings = element.bindings.filter(binding => binding.id !== bindingId)
        if (bindings.length === element.bindings.length) {
          return element
        }

        didUpdate = true
        return { ...element, bindings }
      })

      if (!didUpdate) {
        return {}
      }

      const snapshot = createSnapshot(state)
      const past = [...state.history.past, snapshot]

      return {
        elements,
        history: { past, future: [] },
        canUndo: past.length > 0,
        canRedo: false
      }
    })
  },
  undo: () => {
    set(state => {
      const { past, future } = state.history
      if (past.length === 0) {
        return {}
      }

      const previous = past[past.length - 1]
      const nextPast = past.slice(0, -1)
      const currentSnapshot = createSnapshot(state)
      const nextFuture = [currentSnapshot, ...future]
      const applied = applySnapshot(previous)

      return {
        ...applied,
        history: { past: nextPast, future: nextFuture },
        canUndo: nextPast.length > 0,
        canRedo: true
      }
    })
  },
  redo: () => {
    set(state => {
      const { past, future } = state.history
      if (future.length === 0) {
        return {}
      }

      const [next, ...remainingFuture] = future
      const currentSnapshot = createSnapshot(state)
      const nextPast = [...past, currentSnapshot]
      const applied = applySnapshot(next)

      return {
        ...applied,
        history: { past: nextPast, future: remainingFuture },
        canUndo: true,
        canRedo: remainingFuture.length > 0
      }
    })
  }
}))
