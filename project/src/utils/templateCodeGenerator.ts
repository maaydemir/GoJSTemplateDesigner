import {
  getRenderableProperties,
  isMarginValue,
  isSizeValue,
  type MarginValue,
  type SizeValue
} from '@/utils/graphObjectProperties'
import { isGoSpotName } from '@/constants/goSpot'
import type { BindingConfig, GraphElement } from '@/store/diagramStore'

type ConverterName = string

const INDENT_UNIT = '  '

const SPOT_PROPERTY_KEYS = new Set(['alignment', 'locationSpot'])

const isValidIdentifier = (value: string): boolean => /^[A-Za-z_$][\w$]*$/.test(value)

const escapeString = (value: string): string => {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')
}

const indentLines = (value: string, level: number): string => {
  const indent = INDENT_UNIT.repeat(level)
  return value
    .split('\n')
    .map(line => `${indent}${line}`)
    .join('\n')
}

const formatMargin = (value: MarginValue): string => {
  const toNumber = (input: number | null, fallback: number) =>
    typeof input === 'number' && Number.isFinite(input) ? input : fallback

  const top = toNumber(value.top, 0)
  const right = toNumber(value.right, 0)
  const bottom = toNumber(value.bottom, 0)
  const left = toNumber(value.left, 0)
  return `new go.Margin(${top}, ${right}, ${bottom}, ${left})`
}

const formatSize = (value: SizeValue): string => {
  const toComponent = (input: number | null) =>
    typeof input === 'number' && Number.isFinite(input) ? input : 'NaN'

  return `new go.Size(${toComponent(value.width)}, ${toComponent(value.height)})`
}

const formatPrimitive = (value: unknown): string => {
  if (typeof value === 'string') {
    return `'${escapeString(value)}'`
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (value === null) {
    return 'null'
  }

  return 'undefined'
}

const formatArray = (values: unknown[], level: number): string => {
  if (values.length === 0) {
    return '[]'
  }

  const inner = values
    .map(item => indentLines(formatValue(item, level + 1), level + 1))
    .join(',\n')

  const closingIndent = INDENT_UNIT.repeat(level)
  return ['[', inner, `${closingIndent}]`].join('\n')
}

const formatObject = (value: Record<string, unknown>, level: number): string => {
  const entries = Object.entries(value)
  if (entries.length === 0) {
    return '{}'
  }

  const lines = entries.map(([key, entry]) => {
    const formattedValue = formatValue(entry, level + 1)
    return `${INDENT_UNIT.repeat(level + 1)}${key}: ${formattedValue}`
  })

  const closingIndent = INDENT_UNIT.repeat(level)
  return ['{', lines.join(',\n'), `${closingIndent}}`].join('\n')
}

const formatValue = (value: unknown, level: number): string => {
  if (Array.isArray(value)) {
    return formatArray(value, level)
  }

  if (value && typeof value === 'object') {
    if (isMarginValue(value)) {
      return formatMargin(value)
    }

    if (isSizeValue(value)) {
      return formatSize(value)
    }

    return formatObject(value as Record<string, unknown>, level)
  }

  return formatPrimitive(value)
}

const buildPropertyObject = (element: GraphElement, level: number): string | null => {
  const properties = getRenderableProperties(element)
  if (properties.length === 0) {
    return null
  }

  const lines = properties.map(({ key, value }) => {
    const formattedValue =
      SPOT_PROPERTY_KEYS.has(key) && isGoSpotName(value)
        ? `go.Spot.${value}`
        : formatValue(value, level + 1)
    return `${INDENT_UNIT.repeat(level + 1)}${key}: ${formattedValue}`
  })

  const closingIndent = INDENT_UNIT.repeat(level)
  return ['{', lines.join(',\n'), `${closingIndent}}`].join('\n')
}

const buildBindingArguments = (
  bindings: BindingConfig[],
  converters: Set<ConverterName>
): string[] => {
  return bindings.map(binding => {
    let accessor: string | null = null
    if (binding.converter) {
      converters.add(binding.converter)
      accessor = isValidIdentifier(binding.converter)
        ? `templateConverters.${binding.converter}`
        : `templateConverters['${escapeString(binding.converter)}']`
    }

    const baseArgs = [
      `'${escapeString(binding.prop)}'`,
      `'${escapeString(binding.path)}'`
    ]

    if (accessor) {
      baseArgs.push(accessor)
    }

    let expression = `new go.Binding(${baseArgs.join(', ')})`
    if (binding.twoWay) {
      expression += '.makeTwoWay()'
    }

    return expression
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

const buildGraphObject = (
  element: GraphElement,
  childrenByParent: Map<string, GraphElement[]>,
  level: number,
  converters: Set<ConverterName>
): string => {
  const args: string[] = []

  if (element.type === 'node') {
    const panelType = typeof element.properties.category === 'string' ? element.properties.category : 'Auto'
    args.push('go.Node')
    args.push(`'${escapeString(panelType)}'`)
  } else if (element.type === 'panel') {
    const panelType = typeof element.properties.type === 'string' ? element.properties.type : 'Auto'
    args.push('go.Panel')
    args.push(`'${escapeString(panelType)}'`)
  } else if (element.type === 'shape') {
    args.push('go.Shape')
  } else if (element.type === 'text') {
    args.push('go.TextBlock')
  } else {
    args.push('go.Picture')
  }

  const propertyObject = buildPropertyObject(element, level + 1)
  if (propertyObject) {
    args.push(propertyObject)
  }

  const bindingArgs = buildBindingArguments(element.bindings, converters)
  args.push(...bindingArgs)

  const children = childrenByParent.get(element.id) ?? []
  const childArgs = children.map(child => buildGraphObject(child, childrenByParent, level + 1, converters))
  args.push(...childArgs)

  const inner = args
    .map(arg => indentLines(arg, level + 1))
    .join(',\n')

  const indent = INDENT_UNIT.repeat(level)
  return ['$(', inner, `${indent})`].join('\n')
}

const buildRootGraphObject = (root: GraphElement, elements: GraphElement[]): {
  code: string
  converters: Set<ConverterName>
} => {
  const childrenByParent = groupChildrenByParent(elements)
  const converters = new Set<ConverterName>()
  const graphObject = buildGraphObject(root, childrenByParent, 1, converters)
  return { code: graphObject, converters }
}

const buildConverterSection = (converters: Set<ConverterName>): string => {
  if (converters.size === 0) {
    return 'export const templateConverters: Record<string, (value: unknown) => unknown> = {}'
  }

  const entries = Array.from(converters)
    .sort()
    .map(name => {
      const key = isValidIdentifier(name) ? name : `'${escapeString(name)}'`
      const header = `${INDENT_UNIT}${key}(value: unknown) {`
      const body = [
        `${INDENT_UNIT.repeat(2)}// TODO: implement conversion logic for bindings using "${escapeString(name)}"`,
        `${INDENT_UNIT.repeat(2)}return value`
      ].join('\n')
      const footer = `${INDENT_UNIT}}`
      return [header, body, footer].join('\n')
    })

  return [
    'export const templateConverters: Record<string, (value: unknown) => unknown> = {',
    entries.join(',\n'),
    '}'
  ].join('\n')
}

export const generateTemplateCode = (elements: GraphElement[]): string => {
  const root = elements.find(element => element.parentId === null)

  if (!root) {
    return [
      "import * as go from 'gojs'",
      '',
      'export const templateConverters: Record<string, (value: unknown) => unknown> = {}',
      '',
      'export const buildTemplate = (): go.Part => {',
      `${INDENT_UNIT}throw new Error('No template root defined')`,
      '}'
    ].join('\n')
  }

  const { code, converters } = buildRootGraphObject(root, elements)
  const converterSection = buildConverterSection(converters)

  return [
    "import * as go from 'gojs'",
    '',
    converterSection,
    '',
    'export const buildTemplate = (): go.Part => {',
    `${INDENT_UNIT}const $ = go.GraphObject.make`,
    '',
    `${INDENT_UNIT}return ${code}`,
    '}'
  ].join('\n')
}
