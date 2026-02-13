import {
  Bot,
  Boxes,
  ChartNoAxesGantt,
  Download,
  FileImage,
  ListTree,
  RefreshCw,
  Route,
} from 'lucide-react'

const TYPES = [
  { value: 'auto', label: 'Auto Detect', icon: Bot },
  { value: 'usecase', label: 'Use Case', icon: Route },
  { value: 'sequence', label: 'Sequence', icon: ChartNoAxesGantt },
  { value: 'class', label: 'Class', icon: Boxes },
  { value: 'state', label: 'State', icon: ListTree },
]

export default function Toolbar({
  selectedType,
  onTypeChange,
  onLoadSample,
  onExportSvg,
  onExportPng,
}) {
  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-slate-800">Text-to-Diagram Studio</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          SVG Engine
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="diagram-type" className="text-xs font-medium text-slate-600">
          Diagram
        </label>
        <select
          id="diagram-type"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          {TYPES.map((type) => (
            <option value={type.value} key={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        {TYPES.filter((type) => type.value !== 'auto').map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.value}
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              onClick={() => onLoadSample(type.value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {type.label}
            </button>
          )
        })}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          onClick={onExportSvg}
          title="Export current diagram as SVG"
        >
          <Download className="h-3.5 w-3.5" />
          SVG
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          onClick={onExportPng}
          title="Export current diagram as PNG"
        >
          <FileImage className="h-3.5 w-3.5" />
          PNG
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          onClick={() => onLoadSample('usecase')}
          title="Reset to starter sample"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </header>
  )
}
