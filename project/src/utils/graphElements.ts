import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import type { GraphElement, GraphObjectType } from '@/store/diagramStore'

export const GRAPH_OBJECT_DRAG_TYPE = 'application/x-graphobject'

const RANDOM_SUFFIX_MIN = 10
const RANDOM_SUFFIX_RANGE = 90

export const generateElementName = (type: GraphObjectType): string => {
  const metadata = graphObjectMetadata[type]
  const suffix = Math.floor(Math.random() * RANDOM_SUFFIX_RANGE) + RANDOM_SUFFIX_MIN
  return `${metadata.defaultName} ${suffix}`
}

export const isGraphObjectType = (value: string): value is GraphObjectType => {
  return Object.prototype.hasOwnProperty.call(graphObjectMetadata, value)
}

const resolveAcceptingParent = (
  elementsById: Map<string, GraphElement>,
  element: GraphElement | null,
  type: GraphObjectType
): GraphElement | null => {
  if (!element) {
    return null
  }

  const metadata = graphObjectMetadata[element.type]
  if (metadata.allowedChildren.includes(type)) {
    return element
  }

  if (!element.parentId) {
    return null
  }

  const nextParent = elementsById.get(element.parentId) ?? null
  return resolveAcceptingParent(elementsById, nextParent, type)
}

export const findAcceptingParent = (
  elements: GraphElement[],
  preferredParentId: string | null | undefined,
  type: GraphObjectType
): GraphElement | null => {
  if (elements.length === 0) {
    return null
  }

  const elementsById = new Map(elements.map(element => [element.id, element]))

  if (preferredParentId) {
    const preferred = elementsById.get(preferredParentId) ?? null
    const resolvedPreferred = resolveAcceptingParent(elementsById, preferred, type)
    if (resolvedPreferred) {
      return resolvedPreferred
    }
  }

  const root = elements.find(element => element.parentId === null) ?? null
  return resolveAcceptingParent(elementsById, root, type)
}
