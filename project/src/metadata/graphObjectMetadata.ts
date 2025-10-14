import type { GraphObjectType } from '@/store/diagramStore'

export type PropertyControlType =
  | 'text'
  | 'multiline'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'size'
  | 'margin'

export interface SelectOption {
  label: string
  value: string
}

export interface PropertyControlConfig {
  type: PropertyControlType
  /** Optional placeholder or helper copy rendered inside the UI control. */
  placeholder?: string
  /** Optional minimum numeric value; applied to number and size controls. */
  min?: number
  /** Optional maximum numeric value; applied to number and size controls. */
  max?: number
  /** Optional numeric step for increment/decrement controls. */
  step?: number
  /** Dropdown options for select controls. */
  options?: SelectOption[]
  /** Labels used by vector-like controls such as size or margin. */
  axisLabels?: string[]
}

export interface GraphObjectPropertyDescriptor {
  /** Name of the GoJS property (e.g., `fill`, `figure`). */
  name: string
  /** Human readable label that will be displayed in the inspector UI. */
  label: string
  /** Short description to guide users on how the property is used. */
  description?: string
  /** Default value suggested when the GraphObject is created. */
  defaultValue?: unknown
  /** Configuration describing which UI control should edit the property. */
  control: PropertyControlConfig
  /** Whether the property supports data bindings. Defaults to true. */
  bindingEnabled?: boolean
  /** Marks the property as advanced so it can be hidden by default in the UI. */
  advanced?: boolean
}

export interface GraphObjectMetadata {
  /** Unique GraphObject type identifier. */
  type: GraphObjectType
  /** Display name used across the UI. */
  label: string
  /** Helpful description presented in tooltips or docs. */
  description: string
  /** Icon identifier that UI components can reference. */
  icon: string
  /** Whether the element can act as the root of a template. */
  canBeRoot: boolean
  /** Types that may be nested directly under this GraphObject. */
  allowedChildren: GraphObjectType[]
  /** Default name assigned to new instances. */
  defaultName: string
  /** Default property bag used when the element is created. */
  defaultProperties: Record<string, unknown>
  /** Declarative list of properties that can be edited from the inspector. */
  properties: GraphObjectPropertyDescriptor[]
}

export type GraphObjectMetadataMap = Record<GraphObjectType, GraphObjectMetadata>

export const graphObjectMetadata: GraphObjectMetadataMap = {
  node: {
    type: 'node',
    label: 'Node',
    description:
      'GraphObject hierarchy entry point. Nodes host panels, shapes and text to visualise model data.',
    icon: 'node',
    canBeRoot: true,
    allowedChildren: ['panel', 'shape', 'text', 'picture'],
    defaultName: 'Auto Node',
    defaultProperties: {
      category: 'Auto'
    },
    properties: [
      {
        name: 'category',
        label: 'Category',
        description: 'Determines the default panel layout applied to the node.',
        defaultValue: 'Auto',
        control: {
          type: 'select',
          options: [
            { label: 'Auto', value: 'Auto' },
            { label: 'Spot', value: 'Spot' },
            { label: 'Table', value: 'Table' },
            { label: 'Vertical', value: 'Vertical' },
            { label: 'Horizontal', value: 'Horizontal' }
          ]
        }
      },
      {
        name: 'locationSpot',
        label: 'Location Spot',
        description: 'Alignment spot used when positioning the node.',
        control: {
          type: 'select',
          options: [
            { label: 'Center', value: 'Center' },
            { label: 'Top', value: 'Top' },
            { label: 'Bottom', value: 'Bottom' },
            { label: 'Left', value: 'Left' },
            { label: 'Right', value: 'Right' }
          ]
        },
        advanced: true
      }
    ]
  },
  panel: {
    type: 'panel',
    label: 'Panel',
    description: 'Layout container that can hold nested GraphObjects and arrange them spatially.',
    icon: 'panel',
    canBeRoot: false,
    allowedChildren: ['panel', 'shape', 'text', 'picture'],
    defaultName: 'Panel',
    defaultProperties: {
      type: 'Auto'
    },
    properties: [
      {
        name: 'type',
        label: 'Panel Type',
        description: 'Controls how the panel arranges its immediate children.',
        defaultValue: 'Auto',
        control: {
          type: 'select',
          options: [
            { label: 'Auto', value: 'Auto' },
            { label: 'Vertical', value: 'Vertical' },
            { label: 'Horizontal', value: 'Horizontal' },
            { label: 'Spot', value: 'Spot' },
            { label: 'Table', value: 'Table' }
          ]
        }
      },
      {
        name: 'padding',
        label: 'Padding',
        description: 'Internal padding applied around the panel content.',
        control: {
          type: 'margin',
          axisLabels: ['Top', 'Right', 'Bottom', 'Left']
        },
        advanced: true
      }
    ]
  },
  shape: {
    type: 'shape',
    label: 'Shape',
    description: 'Visual figure that renders vector graphics such as rectangles or ellipses.',
    icon: 'shape',
    canBeRoot: false,
    allowedChildren: [],
    defaultName: 'Shape',
    defaultProperties: {
      figure: 'RoundedRectangle',
      fill: '#475569',
      stroke: '#1e293b'
    },
    properties: [
      {
        name: 'figure',
        label: 'Figure',
        description: 'Selects the predefined GoJS geometry used to draw the shape.',
        defaultValue: 'RoundedRectangle',
        control: {
          type: 'select',
          options: [
            { label: 'Rectangle', value: 'Rectangle' },
            { label: 'RoundedRectangle', value: 'RoundedRectangle' },
            { label: 'Ellipse', value: 'Ellipse' },
            { label: 'TriangleRight', value: 'TriangleRight' },
            { label: 'Diamond', value: 'Diamond' }
          ]
        }
      },
      {
        name: 'fill',
        label: 'Fill',
        description: 'Background colour used to paint the interior of the shape.',
        defaultValue: '#475569',
        control: { type: 'color' }
      },
      {
        name: 'stroke',
        label: 'Stroke',
        description: 'Colour applied to the outline of the shape.',
        defaultValue: '#1e293b',
        control: { type: 'color' }
      },
      {
        name: 'strokeWidth',
        label: 'Stroke Width',
        description: 'Line width used for the shape outline.',
        defaultValue: 1,
        control: {
          type: 'number',
          min: 0,
          step: 0.5
        }
      },
      {
        name: 'desiredSize',
        label: 'Desired Size',
        description: 'Preferred width and height of the shape. The layout may override this value.',
        control: {
          type: 'size',
          axisLabels: ['Width', 'Height'],
          min: 0
        },
        advanced: true
      }
    ]
  },
  text: {
    type: 'text',
    label: 'TextBlock',
    description: 'Displays textual content. Supports styling, wrapping and data binding.',
    icon: 'text',
    canBeRoot: false,
    allowedChildren: [],
    defaultName: 'Text',
    defaultProperties: {
      text: 'TextBlock',
      stroke: '#f8fafc'
    },
    properties: [
      {
        name: 'text',
        label: 'Text',
        description: 'Literal text content rendered by the block. Typically bound to model data.',
        defaultValue: 'TextBlock',
        control: {
          type: 'multiline',
          placeholder: 'Enter text...'
        }
      },
      {
        name: 'stroke',
        label: 'Colour',
        description: 'Text colour. Accepts hex codes or named colours.',
        defaultValue: '#f8fafc',
        control: { type: 'color' }
      },
      {
        name: 'font',
        label: 'Font',
        description: 'CSS font declaration applied to the text.',
        defaultValue: '12px Inter, sans-serif',
        control: {
          type: 'text',
          placeholder: 'e.g. bold 12px Inter, sans-serif'
        }
      },
      {
        name: 'wrap',
        label: 'Wrap Mode',
        description: 'Determines how overflowing text should be wrapped.',
        control: {
          type: 'select',
          options: [
            { label: 'None', value: 'None' },
            { label: 'Fit', value: 'Fit' },
            { label: 'DesiredSize', value: 'DesiredSize' }
          ]
        },
        advanced: true
      }
    ]
  },
  picture: {
    type: 'picture',
    label: 'Picture',
    description: 'Renders an image from a URL or base64 encoded source.',
    icon: 'picture',
    canBeRoot: false,
    allowedChildren: [],
    defaultName: 'Picture',
    defaultProperties: {
      source: '',
      desiredSize: { width: 64, height: 64 }
    },
    properties: [
      {
        name: 'source',
        label: 'Image Source',
        description: 'Accepts an image URL or base64 encoded data URI.',
        control: {
          type: 'text',
          placeholder: 'https://example.com/image.png'
        }
      },
      {
        name: 'desiredSize',
        label: 'Desired Size',
        description: 'Preferred image size expressed in pixels.',
        control: {
          type: 'size',
          axisLabels: ['Width', 'Height'],
          min: 0
        }
      },
      {
        name: 'stretch',
        label: 'Stretch Mode',
        description: 'Specifies how the picture should scale within its bounds.',
        control: {
          type: 'select',
          options: [
            { label: 'Uniform', value: 'Uniform' },
            { label: 'Fill', value: 'Fill' },
            { label: 'UniformToFill', value: 'UniformToFill' },
            { label: 'None', value: 'None' }
          ]
        },
        advanced: true
      }
    ]
  }
}
