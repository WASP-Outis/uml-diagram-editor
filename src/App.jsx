import { useRef } from 'react'
import Editor from './components/Editor'
import LivePreview from './components/LivePreview'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import { useDiagramEngine } from './hooks/useDiagramEngine'
import { exportDiagramAsPng, exportDiagramAsSvg } from './utils/ExportUtils'

function App() {
  const previewRef = useRef(null)
  const {
    text,
    setText,
    parsed,
    selectedType,
    setSelectedType,
    activeType,
    settings,
    setSettings,
    setStrokeWidth,
    loadSample,
  } = useDiagramEngine()

  const exportBaseName = `diagram-${activeType || 'unknown'}`

  const handleExportSvg = () => {
    try {
      exportDiagramAsSvg(previewRef.current, `${exportBaseName}.svg`)
    } catch (error) {
      // Export issues should not break the editor runtime.
      console.error(error)
    }
  }

  const handleExportPng = async () => {
    try {
      await exportDiagramAsPng(previewRef.current, `${exportBaseName}.png`)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <main className="flex h-screen w-full flex-col gap-3 bg-slate-200 p-3 text-slate-800">
      <Toolbar
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onLoadSample={loadSample}
        onExportSvg={handleExportSvg}
        onExportPng={handleExportPng}
      />

      <section className="grid min-h-0 flex-1 grid-cols-[minmax(300px,38%)_1fr_290px] gap-3">
        <Editor value={text} onChange={setText} />
        <LivePreview
          parsed={parsed}
          activeType={activeType}
          settings={settings}
          previewRef={previewRef}
        />
        <Sidebar
          settings={settings}
          parsed={parsed}
          activeType={activeType}
          onChangePrimaryColor={(value) =>
            setSettings((previous) => ({
              ...previous,
              primaryColor: value,
            }))
          }
          onChangeStrokeWidth={setStrokeWidth}
        />
      </section>
    </main>
  )
}

export default App
