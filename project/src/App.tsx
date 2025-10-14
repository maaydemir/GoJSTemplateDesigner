import Header from './components/Header'
import PalettePanel from './components/PalettePanel'
import DiagramCanvas from './components/DiagramCanvas'
import InspectorPanel from './components/InspectorPanel'
import TemplatePreview from './components/TemplatePreview'

const App = () => (
  <div className='flex h-full min-h-screen flex-col bg-slate-950 text-slate-100'>
    <Header />
    <main className='flex flex-1 overflow-hidden'>
      <PalettePanel />
      <section className='flex flex-1 flex-col gap-4 overflow-hidden p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-base font-semibold text-white'>Diagram canvas</h2>
            <p className='text-sm text-slate-400'>GoJS diagram rendering the current template structure.</p>
          </div>
          <div className='flex gap-2'>
            <button
              type='button'
              className={[
                'rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200',
                'transition hover:border-emerald-400 hover:bg-emerald-500/20'
              ].join(' ')}
            >
              Generate code
            </button>
            <button
              type='button'
              className={[
                'rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200',
                'transition hover:border-slate-500 hover:bg-slate-700'
              ].join(' ')}
            >
              Undo (coming soon)
            </button>
          </div>
        </div>
        <div className='grid h-full flex-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40 lg:grid-cols-[2fr,1fr]'>
          <DiagramCanvas />
          <TemplatePreview />
        </div>
      </section>
      <InspectorPanel />
    </main>
  </div>
)

export default App
