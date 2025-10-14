export const GO_SPOT_NAMES = [
  'Center',
  'TopLeft',
  'Top',
  'TopRight',
  'Left',
  'Right',
  'BottomLeft',
  'Bottom',
  'BottomRight'
] as const

export type GoSpotName = (typeof GO_SPOT_NAMES)[number]

const GO_SPOT_NAME_SET = new Set<string>(GO_SPOT_NAMES)

export const isGoSpotName = (value: unknown): value is GoSpotName => {
  return typeof value === 'string' && GO_SPOT_NAME_SET.has(value)
}
