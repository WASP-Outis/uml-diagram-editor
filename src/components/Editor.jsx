import { FileCode2 } from 'lucide-react'

function buildLineNumbers(text) {
  const lines = text.split('\n').length
  return Array.from({ length: lines }, (_, index) => index + 1).join('\n')
}

export default function Editor({ value, onChange }) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
        <FileCode2 className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-700">Diagram DSL Editor</h2>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-b-2xl">
        <pre className="pointer-events-none m-0 w-12 overflow-hidden border-r border-slate-200 bg-slate-50 p-3 text-right text-xs leading-6 text-slate-400">
          {buildLineNumbers(value)}
        </pre>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          className="h-full min-h-0 flex-1 resize-none bg-white p-3 font-mono text-sm leading-6 text-slate-800 outline-none"
          placeholder={`Actor -> (Login)\nAlice -> Bob: Hello\nclass User { +name: string }\n[Idle] -> [Active]: start`}
        />
      </div>
    </section>
  )
}
