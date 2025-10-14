import type { FC, ReactNode } from 'react'
import type { GraphObjectType } from '@/store/diagramStore'

interface GraphObjectIconProps {
  type: GraphObjectType
}

const IconContainer: FC<{ children: ReactNode }> = ({ children }) => (
  <span className='flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-emerald-300'>
    {children}
  </span>
)

const NodeIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'>
    <circle cx='12' cy='12' r='5.5' fill='none' stroke='currentColor' strokeWidth='1.5' />
    <circle cx='6.5' cy='7' r='1.75' fill='currentColor' />
    <circle cx='17.5' cy='6.5' r='1.75' fill='currentColor' />
    <circle cx='18' cy='17' r='1.75' fill='currentColor' />
    <line x1='7.8' y1='8.2' x2='10.1' y2='10.5' stroke='currentColor' strokeWidth='1.5' />
    <line x1='14.1' y1='10.2' x2='16.3' y2='7.7' stroke='currentColor' strokeWidth='1.5' />
    <line x1='14.4' y1='13.6' x2='16.6' y2='15.8' stroke='currentColor' strokeWidth='1.5' />
  </svg>
)

const PanelIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'>
    <rect x='4' y='5' width='16' height='14' rx='2' fill='none' stroke='currentColor' strokeWidth='1.5' />
    <line x1='4' y1='11' x2='20' y2='11' stroke='currentColor' strokeWidth='1.2' />
    <line x1='10' y1='5' x2='10' y2='19' stroke='currentColor' strokeWidth='1.2' />
  </svg>
)

const ShapeIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'>
    <path
      d='M8.5 5.5h7a2 2 0 0 1 1.79 1.1l3.22 6.4a2 2 0 0 1 0 1.8l-3.22 6.4A2 2 0 0 1 15.5 22H8.5a2 2 0 0 1-1.79-1.1l-3.22-6.4a2 2 0 0 1 0-1.8l3.22-6.4A2 2 0 0 1 8.5 5.5Z'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
    />
  </svg>
)

const TextIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'>
    <path d='M6 6.5h12' stroke='currentColor' strokeWidth='1.5' />
    <path d='M10.5 6.5v11c0 1 .5 1.5 1.5 1.5s1.5-.5 1.5-1.5v-11' stroke='currentColor' strokeWidth='1.5' />
    <path d='M6 12.5h5' stroke='currentColor' strokeWidth='1.5' />
    <path d='M13 12.5h5' stroke='currentColor' strokeWidth='1.5' />
  </svg>
)

const PictureIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' className='h-5 w-5'>
    <rect x='4' y='5' width='16' height='14' rx='2' fill='none' stroke='currentColor' strokeWidth='1.5' />
    <circle cx='9' cy='10' r='2' fill='currentColor' />
    <path d='M4 16.5 9.5 11l4 3.5 2-2 4.5 4' fill='none' stroke='currentColor' strokeWidth='1.5' />
  </svg>
)

const iconByType: Record<GraphObjectType, JSX.Element> = {
  node: <NodeIcon />,
  panel: <PanelIcon />,
  shape: <ShapeIcon />,
  text: <TextIcon />,
  picture: <PictureIcon />
}

const GraphObjectIcon: FC<GraphObjectIconProps> = ({ type }) => {
  return <IconContainer>{iconByType[type]}</IconContainer>
}

export default GraphObjectIcon
