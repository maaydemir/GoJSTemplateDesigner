import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import type { GraphObjectType } from '@/store/diagramStore'

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
