import type { FC } from 'react'

const Header: FC = () => (
  <header className='flex items-center justify-between border-b border-slate-800 bg-panel px-6 py-4 shadow-md'>
    <div>
      <h1 className='text-lg font-semibold leading-none text-white'>GoJS Template Designer</h1>
      <p className='text-sm text-slate-400'>Visual editor for GoJS node templates</p>
    </div>
    <div className='flex items-center gap-2 text-xs text-slate-400'>
      <span className='rounded-full bg-slate-800 px-3 py-1 font-mono uppercase tracking-wide text-slate-300'>React + TS</span>
      <span className='rounded-full bg-slate-800 px-3 py-1 font-mono uppercase tracking-wide text-slate-300'>Tailwind</span>
      <span className='rounded-full bg-slate-800 px-3 py-1 font-mono uppercase tracking-wide text-slate-300'>Zustand</span>
      <span className='rounded-full bg-slate-800 px-3 py-1 font-mono uppercase tracking-wide text-slate-300'>GoJS</span>
    </div>
  </header>
)

export default Header
