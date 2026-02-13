import { AlertTriangle, Palette, SlidersHorizontal, Sparkles } from 'lucide-react'

const syntaxHints = [
  'Use Case: Actor -> (UseCase)',
  'Sequence: Alice -> Bob: Hello',
  'Activation: activate Bob / deactivate Bob',
  'Class: class User { +name: string }',
  'State: [Idle] -> [Active]: start',
]

export default function Sidebar({
  settings,
  onChangePrimaryColor,
  onChangeStrokeWidth,
  parsed,
  activeType,
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Global Settings</h3>
        </div>

        <label className="mb-2 block text-xs font-medium text-slate-600">
          Primary Color
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
            <Palette className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(event) => onChangePrimaryColor(event.target.value)}
              className="h-7 w-full cursor-pointer border-none bg-transparent p-0"
            />
          </div>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Stroke Width: {settings.strokeWidth}
          <input
            type="range"
            min="1"
            max="4"
            step="0.5"
            value={settings.strokeWidth}
            onChange={(event) => onChangeStrokeWidth(event.target.value)}
            className="mt-2 w-full accent-blue-600"
          />
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Syntax Hints</h3>
        </div>
        <div className="space-y-1 text-xs text-slate-600">
          {syntaxHints.map((hint) => (
            <p key={hint} className="rounded-md bg-slate-50 px-2 py-1 font-mono">
              {hint}
            </p>
          ))}
        </div>
      </section>

      <section className="min-h-0 flex-1 rounded-xl border border-slate-200 p-3">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Parser Status</h3>
        <p className="mb-2 text-xs text-slate-500">Active diagram: {activeType || 'unknown'}</p>
        {parsed.errors.length ? (
          <div className="space-y-2 overflow-auto text-xs text-amber-700">
            {parsed.errors.map((error) => (
              <div key={error} className="flex items-start gap-1 rounded-md bg-amber-50 p-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
            Syntax parsed successfully.
          </div>
        )}
      </section>
    </aside>
  )
}
