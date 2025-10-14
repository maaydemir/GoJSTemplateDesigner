import { useEffect } from 'react'
import MonacoCodeViewer from './MonacoCodeViewer'

interface CodePreviewModalProps {
  isOpen: boolean
  code: string
  onClose: () => void
}

const CodePreviewModal = ({ isOpen, code, onClose }: CodePreviewModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur'
      onClick={onClose}
    >
      <div
        className='flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40'
        onClick={event => event.stopPropagation()}
      >
        <header className='flex items-start justify-between gap-4 border-b border-slate-800 p-4'>
          <div>
            <h2 className='text-lg font-semibold text-white'>Generated TypeScript code</h2>
            <p className='text-sm text-slate-400'>Copy and paste this snippet into your GoJS project.</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-700'
          >
            Close
          </button>
        </header>
        <div className='flex-1 min-h-[400px] bg-slate-950'>
          <MonacoCodeViewer value={code} />
        </div>
      </div>
    </div>
  )
}

export default CodePreviewModal
