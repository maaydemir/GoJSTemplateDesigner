import { nanoid } from 'nanoid'
import { create } from 'zustand'

export type GraphObjectType = 'node' | 'panel' | 'shape' | 'text' | 'picture'

export interface BindingConfig {
  id: string
  prop: string
  path: string
  twoWay: boolean
  converter?: string
}

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
}

const createInitialNode = (): GraphElement => ({
  id: nanoid(),
  type: 'node',
  name: 'Auto Node',
  parentId: null,
  properties: {
    category: 'Auto'
  },
  bindings: []
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
    const element: GraphElement = {
      id: nanoid(),
      type,
      name,
      parentId,
      properties,
      bindings
    }

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
  }
}))
