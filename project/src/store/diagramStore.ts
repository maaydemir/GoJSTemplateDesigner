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

export interface GraphElement {
  id: string
  type: GraphObjectType
  name: string
  parentId: string | null
  properties: Record<string, unknown>
  bindings: BindingConfig[]
}

export interface DiagramState {
  elements: GraphElement[]
  selectedId: string | null
  addElement: (element: Omit<GraphElement, 'id' | 'bindings' | 'properties'> & {
    properties?: GraphElement['properties']
    bindings?: BindingConfig[]
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

const createGraphElement = ({
  type,
  parentId,
  name,
  properties,
  bindings
}: {
  type: GraphObjectType
  parentId: string | null
  name?: string
  properties?: GraphElement['properties']
  bindings?: BindingConfig[]
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
    bindings: bindings ?? []
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

export const useDiagramStore = create<DiagramState>((set, get) => ({
  elements: [createInitialNode()],
  selectedId: null,
  addElement: ({ type, name, parentId, properties = {}, bindings = [] }) => {
    const element = createGraphElement({
      type,
      parentId,
      name,
      properties,
      bindings
    })

    set(state => ({
      elements: [...state.elements, element],
      selectedId: element.id
    }))
  },
  updateElement: (id, updater) => {
    set(state => ({
      elements: state.elements.map(element => (element.id === id ? updater(element) : element))
    }))
  },
  selectElement: id => set({ selectedId: id }),
  removeElement: id => {
    const state = get()
    const index = buildChildrenIndex(state.elements)
    const collect = (currentId: string, acc: Set<string>) => {
      acc.add(currentId)
      const children = index[currentId] ?? []
      children.forEach(child => collect(child.id, acc))
    }

    const toRemove = new Set<string>()
    collect(id, toRemove)

    set(current => {
      const remaining = current.elements.filter(element => !toRemove.has(element.id))
      const hasRoot = remaining.some(element => element.parentId === null)
      const nextElements = hasRoot ? remaining : [createInitialNode()]
      const selectedId = current.selectedId && toRemove.has(current.selectedId) ? null : current.selectedId

      return {
        elements: nextElements,
        selectedId: hasRoot ? selectedId : null
      }
    })
  },
  setProperty: (id, property, value) => {
    const clonedValue = cloneValue(value)
    set(state => ({
      elements: state.elements.map(element =>
        element.id === id
          ? { ...element, properties: { ...element.properties, [property]: clonedValue } }
          : element
      )
    }))
  },
  removeProperty: (id, property) => {
    set(state => ({
      elements: state.elements.map(element => {
        if (element.id !== id) {
          return element
        }

        const { [property]: _removed, ...rest } = element.properties
        return { ...element, properties: rest }
      })
    }))
  },
  addBinding: (elementId, binding) => {
    const entry: BindingConfig = { ...binding, id: nanoid() }
    set(state => ({
      elements: state.elements.map(element =>
        element.id === elementId ? { ...element, bindings: [...element.bindings, entry] } : element
      )
    }))
  },
  updateBinding: (elementId, bindingId, updater) => {
    set(state => ({
      elements: state.elements.map(element => {
        if (element.id !== elementId) {
          return element
        }

        return {
          ...element,
          bindings: element.bindings.map(binding =>
            binding.id === bindingId ? updater(binding) : binding
          )
        }
      })
    }))
  },
  removeBinding: (elementId, bindingId) => {
    set(state => ({
      elements: state.elements.map(element =>
        element.id === elementId
          ? { ...element, bindings: element.bindings.filter(binding => binding.id !== bindingId) }
          : element
      )
    }))
  }
}))
