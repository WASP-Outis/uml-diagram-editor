import { MonitorCog } from 'lucide-react'
import DiagramRenderer from '../renderers/DiagramRenderer'

export default function LivePreview({ parsed, activeType, settings, previewRef }) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-300 bg-slate-100 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-300 bg-white px-4 py-2">
        <MonitorCog className="h-4 w-4 text-slate-600" />
        <h2 className="text-sm font-semibold text-slate-700">Live Preview</h2>
      </div>

      <div ref={previewRef} className="diagram-grid-bg min-h-0 flex-1 overflow-auto p-4">
        <DiagramRenderer parsed={parsed} activeType={activeType} settings={settings} />
      </div>
    </section>
  )
}
