import type { GraphElement } from '@/store/diagramStore'

export interface MarginValue {
  top: number | null
  right: number | null
  bottom: number | null
  left: number | null
}

export interface SizeValue {
  width: number | null
  height: number | null
}

const isFiniteOrNull = (value: unknown): value is number | null => {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

export const isMarginValue = (value: unknown): value is MarginValue => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const margin = value as Partial<MarginValue>
  return (
    'top' in margin &&
    'right' in margin &&
    'bottom' in margin &&
    'left' in margin &&
    isFiniteOrNull(margin.top) &&
    isFiniteOrNull(margin.right) &&
    isFiniteOrNull(margin.bottom) &&
    isFiniteOrNull(margin.left)
  )
}

export const isSizeValue = (value: unknown): value is SizeValue => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const size = value as Partial<SizeValue>
  return (
    'width' in size &&
    'height' in size &&
    isFiniteOrNull(size.width) &&
    isFiniteOrNull(size.height)
  )
}

export interface RenderablePropertyEntry {
  key: string
  value: unknown
}

export const getRenderableProperties = (element: GraphElement): RenderablePropertyEntry[] => {
  const entries: RenderablePropertyEntry[] = []

  Object.entries(element.properties).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    if (element.type === 'node' && key === 'category') {
      return
    }

    if (element.type === 'panel' && key === 'type') {
      return
    }

    entries.push({ key, value })
  })

  if (!entries.some(entry => entry.key === 'name')) {
    entries.push({ key: 'name', value: element.name })
  }

  return entries
}
