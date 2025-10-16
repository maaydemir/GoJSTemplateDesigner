import { ChangeEvent, useEffect, useState } from 'react'
import { graphObjectMetadata } from '@/metadata/graphObjectMetadata'
import type { GraphObjectPropertyDescriptor, SelectOption } from '@/metadata/graphObjectMetadata'
import type { GraphElement } from '@/store/diagramStore'
import { useDiagramStore } from '@/store/diagramStore'

type MarginValue = {
  top: number | null
  right: number | null
  bottom: number | null
  left: number | null
}

type SizeValue = {
  width: number | null
  height: number | null
}

const parseNumber = (value: string): number | '' => {
  if (value.trim() === '') {
    return ''
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : ''
}

const formatNumber = (value: unknown): string => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }

  return ''
}

const areValuesEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false
    }

    return left.every((value, index) => areValuesEqual(value, right[index]))
  }

  if (
    typeof left === 'object' &&
    left !== null &&
    typeof right === 'object' &&
    right !== null
  ) {
    const leftEntries = Object.entries(left as Record<string, unknown>)
    const rightEntries = Object.entries(right as Record<string, unknown>)

    if (leftEntries.length !== rightEntries.length) {
      return false
    }

    return leftEntries.every(([key, value]) =>
      areValuesEqual(value, (right as Record<string, unknown>)[key])
    )
  }

  return false
}

const isNumericOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value))

const isSizeValue = (value: unknown): value is SizeValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'width' in value &&
    'height' in value &&
    isNumericOrNull((value as { width: unknown }).width) &&
    isNumericOrNull((value as { height: unknown }).height)
  )
}

const isMarginValue = (value: unknown): value is MarginValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'top' in value &&
    'right' in value &&
    'bottom' in value &&
    'left' in value &&
    isNumericOrNull((value as { top: unknown }).top) &&
    isNumericOrNull((value as { right: unknown }).right) &&
    isNumericOrNull((value as { bottom: unknown }).bottom) &&
    isNumericOrNull((value as { left: unknown }).left)
  )
}

const defaultMarginValue = (): MarginValue => ({ top: null, right: null, bottom: null, left: null })
const defaultSizeValue = (): SizeValue => ({ width: null, height: null })

const DEFAULT_IMAGE_ACCEPT = [
  'image/png',
  'image/webp',
  'image/svg+xml',
  '.png',
  '.webp',
  '.svg'
]

const ACCEPTED_IMAGE_LABEL = 'PNG, WebP or SVG'

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }

  const precision = index === 0 ? 0 : 1
  return `${size.toFixed(precision)} ${units[index]}`
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Failed to read file'))
    })

    reader.addEventListener('abort', () => {
      reject(new Error('File reading aborted'))
    })

    reader.addEventListener('load', () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
        return
      }

      reject(new Error('Unsupported file reader result'))
    })

    reader.readAsDataURL(file)
  })
}

const matchesAcceptValue = (file: File, acceptValue: string): boolean => {
  const normalized = acceptValue.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()

  if (normalized.startsWith('.')) {
    return fileName.endsWith(normalized)
  }

  if (normalized.endsWith('/*')) {
    const prefix = normalized.slice(0, -1)
    return fileType.startsWith(prefix)
  }

  return fileType === normalized
}

const isAcceptedImageFile = (file: File, acceptList: string[]): boolean => {
  if (acceptList.length === 0) {
    return true
  }

  return acceptList.some(value => matchesAcceptValue(file, value))
}

interface ImagePropertyControlProps {
  value: unknown
  placeholder?: string
  accept?: string[]
  onChange: (nextValue: string) => void
  onClear: () => void
}

const ImagePropertyControl = ({ value, placeholder, accept, onChange, onClear }: ImagePropertyControlProps) => {
  const [status, setStatus] = useState<{ type: 'info' | 'error'; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const stringValue = typeof value === 'string' ? value : ''
  const resolvedAccept = accept && accept.length > 0 ? accept : DEFAULT_IMAGE_ACCEPT
  const acceptAttribute = resolvedAccept.join(',')
  const hasImage = stringValue.trim().length > 0

  useEffect(() => {
    setPreviewError(null)
  }, [stringValue])

  useEffect(() => {
    if (!hasImage) {
      setStatus(null)
    }
  }, [hasImage])

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStatus(null)
    setPreviewError(null)
    onChange(event.target.value)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0] ?? null
    input.value = ''

    if (!file) {
      return
    }

    if (!isAcceptedImageFile(file, resolvedAccept)) {
      setStatus({
        type: 'error',
        message: `Unsupported file type. Please choose a ${ACCEPTED_IMAGE_LABEL} image.`
      })
      return
    }

    setIsLoading(true)
    try {
      const dataUrl = await readFileAsDataURL(file)
      onChange(dataUrl)
      setStatus({
        type: 'info',
        message: `Loaded ${file.name} (${formatFileSize(file.size)}) as a data URL.`
      })
      setPreviewError(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Unable to read the selected file. Please try another image.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    onClear()
    setStatus(null)
    setPreviewError(null)
  }

  return (
    <div className='space-y-3'>
      <input
        type='text'
        value={stringValue}
        placeholder={placeholder}
        onChange={handleTextChange}
        className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
      />
      <div className='flex flex-wrap items-center gap-2 text-[11px] text-slate-500'>
        <label
          className={[
            'inline-flex cursor-pointer items-center rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition',
            isLoading ? 'opacity-60' : 'hover:border-slate-500 hover:bg-slate-700'
          ].join(' ')}
        >
          <input
            type='file'
            accept={acceptAttribute}
            disabled={isLoading}
            onChange={handleFileChange}
            className='sr-only'
          />
          {isLoading ? 'Processing…' : 'Upload image'}
        </label>
        {hasImage && (
          <button
            type='button'
            onClick={handleClear}
            className='text-xs font-medium text-red-300 transition hover:text-red-200'
          >
            Clear
          </button>
        )}
        <span className='text-[11px] text-slate-500'>
          Supports {ACCEPTED_IMAGE_LABEL} files. Values are stored as inline data URIs.
        </span>
      </div>
      <div className='relative flex h-32 items-center justify-center overflow-hidden rounded-md border border-slate-800 bg-slate-950/80'>
        {hasImage ? (
          <>
            <img
              src={stringValue}
              alt='Selected image preview'
              className='max-h-full max-w-full object-contain'
              onError={() => setPreviewError('Unable to render the current image source.')}
              onLoad={() => setPreviewError(null)}
            />
            {previewError && (
              <div className='absolute inset-0 flex items-center justify-center bg-rose-950/60 px-4 text-center text-xs text-rose-100'>
                {previewError}
              </div>
            )}
            {isLoading && (
              <div className='absolute inset-0 flex items-center justify-center bg-slate-950/80 text-xs text-slate-300'>
                Converting image…
              </div>
            )}
          </>
        ) : (
          <p className='max-w-[220px] px-4 text-center text-xs text-slate-500'>
            Paste an image URL or upload a PNG, WebP or SVG file to preview it here.
          </p>
        )}
      </div>
      {status && (
        <p className={['text-xs', status.type === 'error' ? 'text-rose-300' : 'text-emerald-300'].join(' ')}>
          {status.message}
        </p>
      )}
      {previewError && (
        <p className='text-xs text-rose-300'>The preview could not be rendered. Check the image source.</p>
      )}
    </div>
  )
}

const PropertyControl = ({
  descriptor,
  element,
  hasExplicitValue
}: {
  descriptor: GraphObjectPropertyDescriptor
  element: GraphElement
  hasExplicitValue: boolean
}) => {
  const setProperty = useDiagramStore(state => state.setProperty)
  const propertyName = descriptor.name
  const rawValue = hasExplicitValue ? element.properties[propertyName] : descriptor.defaultValue
  const value = rawValue

  const handlePrimitiveChange = (nextValue: unknown) => {
    setProperty(element.id, propertyName, nextValue)
  }

  const control = descriptor.control

  if (control.type === 'text') {
    return (
      <input
        type='text'
        value={typeof value === 'string' ? value : ''}
        placeholder={control.placeholder}
        onChange={event => handlePrimitiveChange(event.target.value)}
        className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
      />
    )
  }

  if (control.type === 'image') {
    return (
      <ImagePropertyControl
        value={value}
        placeholder={control.placeholder}
        accept={control.accept}
        onChange={nextValue => handlePrimitiveChange(nextValue)}
        onClear={() => handlePrimitiveChange('')}
      />
    )
  }

  if (control.type === 'multiline') {
    return (
      <textarea
        rows={4}
        value={typeof value === 'string' ? value : ''}
        placeholder={control.placeholder}
        onChange={event => handlePrimitiveChange(event.target.value)}
        className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
      />
    )
  }

  if (control.type === 'number') {
    const numericValue = typeof value === 'number' ? value : null
    return (
      <input
        type='number'
        value={numericValue ?? ''}
        min={control.min}
        max={control.max}
        step={control.step ?? 'any'}
        onChange={event => {
          const parsed = parseNumber(event.target.value)
          if (parsed === '') {
            setProperty(element.id, propertyName, null)
            return
          }

          setProperty(element.id, propertyName, parsed)
        }}
        className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
      />
    )
  }

  if (control.type === 'boolean') {
    const boolValue = typeof value === 'boolean' ? value : Boolean(value)
    return (
      <label className='flex items-center gap-2 text-sm text-slate-200'>
        <input
          type='checkbox'
          checked={boolValue}
          onChange={event => setProperty(element.id, propertyName, event.target.checked)}
          className='h-4 w-4 rounded border border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500'
        />
        <span>Enabled</span>
      </label>
    )
  }

  if (control.type === 'color') {
    const current = typeof value === 'string' ? value : '#ffffff'
    return (
      <input
        type='color'
        value={current}
        onChange={event => handlePrimitiveChange(event.target.value)}
        className='h-10 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-900 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
      />
    )
  }

  if (control.type === 'select') {
    const currentValue = typeof value === 'string' ? value : descriptor.defaultValue
    return (
      <select
        value={typeof currentValue === 'string' ? currentValue : ''}
        onChange={event => handlePrimitiveChange(event.target.value)}
        className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
      >
        {renderSelectOptions(control.options)}
      </select>
    )
  }

  if (control.type === 'size') {
    const defaultValue = isSizeValue(descriptor.defaultValue) ? descriptor.defaultValue : defaultSizeValue()
    const current: SizeValue = isSizeValue(value)
      ? value
      : hasExplicitValue
        ? defaultSizeValue()
        : defaultValue
    return (
      <div className='grid grid-cols-2 gap-3'>
        {(control.axisLabels ?? ['Width', 'Height']).map((label, index) => {
          const key = index === 0 ? 'width' : 'height'
          return (
            <label key={key} className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
              <span>{label}</span>
              <input
                type='number'
                value={formatNumber(current[key as keyof SizeValue])}
                min={control.min}
                max={control.max}
                step={control.step ?? 'any'}
                onChange={event => {
                  const parsed = parseNumber(event.target.value)
                  if (parsed === '') {
                    const next = { ...current, [key]: null }
                    setProperty(element.id, propertyName, next)
                    return
                  }

                  const next = { ...current, [key]: parsed }
                  setProperty(element.id, propertyName, next)
                }}
                className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
              />
            </label>
          )
        })}
      </div>
    )
  }

  if (control.type === 'margin') {
    const defaultValue = isMarginValue(descriptor.defaultValue) ? descriptor.defaultValue : defaultMarginValue()
    const current: MarginValue = isMarginValue(value)
      ? value
      : hasExplicitValue
        ? defaultMarginValue()
        : defaultValue
    const labels = control.axisLabels ?? ['Top', 'Right', 'Bottom', 'Left']
    const keys: Array<keyof MarginValue> = ['top', 'right', 'bottom', 'left']

    return (
      <div className='grid grid-cols-2 gap-3'>
        {keys.map((key, index) => (
          <label key={key} className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
            <span>{labels[index] ?? key}</span>
            <input
              type='number'
              value={formatNumber(current[key])}
              min={control.min}
              max={control.max}
              step={control.step ?? 'any'}
              onChange={event => {
                const parsed = parseNumber(event.target.value)
                if (parsed === '') {
                  const next = { ...current, [key]: null }
                  setProperty(element.id, propertyName, next)
                  return
                }

                const next = { ...current, [key]: parsed }
                setProperty(element.id, propertyName, next)
              }}
              className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
            />
          </label>
        ))}
      </div>
    )
  }

  return null
}

const renderSelectOptions = (options: SelectOption[] | undefined) => {
  if (!options || options.length === 0) {
    return <option value=''>Select…</option>
  }

  return options.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))
}

const filterProperties = (
  descriptors: GraphObjectPropertyDescriptor[],
  advanced: boolean
): GraphObjectPropertyDescriptor[] =>
  descriptors.filter(descriptor => (descriptor.advanced ?? false) === advanced)

interface PropertyEditorProps {
  element: GraphElement
}

const PropertyEditor = ({ element }: PropertyEditorProps) => {
  const metadata = graphObjectMetadata[element.type]
  const [showAdvanced, setShowAdvanced] = useState(false)
  const setProperty = useDiagramStore(state => state.setProperty)
  const removeProperty = useDiagramStore(state => state.removeProperty)
  const [customKey, setCustomKey] = useState('')
  const [customValue, setCustomValue] = useState('')

  const descriptors = metadata.properties
  const basicProperties = filterProperties(descriptors, false)
  const advancedProperties = filterProperties(descriptors, true)
  const knownPropertyNames = new Set(descriptors.map(descriptor => descriptor.name))
  const customProperties = Object.entries(element.properties).filter(([key]) => !knownPropertyNames.has(key))

  const hasExplicitValue = (propertyName: string) =>
    Object.prototype.hasOwnProperty.call(element.properties, propertyName)

  const handleResetProperty = (propertyName: string) => {
    removeProperty(element.id, propertyName)
  }

  const shouldShowReset = (descriptor: GraphObjectPropertyDescriptor) => {
    if (!hasExplicitValue(descriptor.name)) {
      return false
    }

    const currentValue = element.properties[descriptor.name]
    return !areValuesEqual(currentValue, descriptor.defaultValue)
  }

  const handleAddCustomProperty = () => {
    const key = customKey.trim()
    if (!key || knownPropertyNames.has(key) || element.properties[key] !== undefined) {
      return
    }

    setProperty(element.id, key, customValue)
    setCustomKey('')
    setCustomValue('')
  }

  return (
    <section className='space-y-6'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Properties</h3>
          {advancedProperties.length > 0 && (
            <button
              type='button'
              onClick={() => setShowAdvanced(current => !current)}
              className='text-xs font-medium text-emerald-300 transition hover:text-emerald-200'
            >
              {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </button>
          )}
        </div>
        <div className='space-y-5'>
          {basicProperties.map(descriptor => {
            const explicit = hasExplicitValue(descriptor.name)
            const showReset = shouldShowReset(descriptor)
            return (
              <div key={descriptor.name} className='space-y-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
                    <span>{descriptor.label}</span>
                    {descriptor.description && (
                      <span className='text-[11px] normal-case text-slate-500'>{descriptor.description}</span>
                    )}
                  </div>
                  {showReset && (
                    <button
                      type='button'
                      onClick={() => handleResetProperty(descriptor.name)}
                      className='text-[11px] font-medium uppercase tracking-wide text-slate-500 transition hover:text-slate-300'
                    >
                      Reset
                    </button>
                  )}
                </div>
                <PropertyControl descriptor={descriptor} element={element} hasExplicitValue={explicit} />
              </div>
            )
          })}
        </div>
        {showAdvanced && advancedProperties.length > 0 && (
          <div className='space-y-5 border-t border-slate-800 pt-4'>
            {advancedProperties.map(descriptor => {
              const explicit = hasExplicitValue(descriptor.name)
              const showReset = shouldShowReset(descriptor)
              return (
                <div key={descriptor.name} className='space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
                      <span>{descriptor.label}</span>
                      {descriptor.description && (
                        <span className='text-[11px] normal-case text-slate-500'>{descriptor.description}</span>
                      )}
                    </div>
                    {showReset && (
                      <button
                        type='button'
                        onClick={() => handleResetProperty(descriptor.name)}
                        className='text-[11px] font-medium uppercase tracking-wide text-slate-500 transition hover:text-slate-300'
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <PropertyControl descriptor={descriptor} element={element} hasExplicitValue={explicit} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className='space-y-3'>
        <header className='flex items-center justify-between'>
          <div>
            <h4 className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Custom properties</h4>
            <p className='text-[11px] text-slate-500'>Add arbitrary key/value pairs to include in the generated template.</p>
          </div>
        </header>
        <div className='space-y-3'>
          {customProperties.length === 0 && (
            <p className='text-xs text-slate-500'>No custom properties defined for this element.</p>
          )}
          {customProperties.map(([key, value]) => (
            <div key={key} className='rounded-md border border-slate-800 bg-slate-900/60 p-3'>
              <div className='flex items-center justify-between text-xs uppercase tracking-wide text-slate-400'>
                <span>{key}</span>
                <button
                  type='button'
                  onClick={() => removeProperty(element.id, key)}
                  className='text-[11px] font-medium text-red-300 transition hover:text-red-200'
                >
                  Remove
                </button>
              </div>
              <input
                type='text'
                value={typeof value === 'string' ? value : JSON.stringify(value)}
                onChange={event => setProperty(element.id, key, event.target.value)}
                className='mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
              />
            </div>
          ))}
        </div>
        <div className='rounded-md border border-slate-800 bg-slate-900/60 p-3'>
          <div className='grid grid-cols-1 gap-3'>
            <label className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
              <span>Key</span>
              <input
                type='text'
                value={customKey}
                onChange={event => setCustomKey(event.target.value)}
                placeholder='e.g. tooltip'
                className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
              />
            </label>
            <label className='flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400'>
              <span>Value</span>
              <input
                type='text'
                value={customValue}
                onChange={event => setCustomValue(event.target.value)}
                placeholder='Enter property value'
                className='w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
              />
            </label>
          </div>
          <button
            type='button'
            onClick={handleAddCustomProperty}
            className='mt-3 w-full rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20'
          >
            Add property
          </button>
        </div>
      </div>
    </section>
  )
}

export default PropertyEditor
