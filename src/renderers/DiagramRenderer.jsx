import ClassRenderer from './ClassRenderer'
import SequenceRenderer from './SequenceRenderer'
import StateRenderer from './StateRenderer'
import UseCaseRenderer from './UseCaseRenderer'

function EmptyDiagram({ message }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

export default function DiagramRenderer({ parsed, activeType, settings }) {
  if (!parsed) {
    return <EmptyDiagram message="No parsed diagram available." />
  }

  if (activeType === 'usecase') {
    if (!parsed.diagrams.useCase.associations.length) {
      return <EmptyDiagram message="No use case syntax found. Example: Actor -> (UseCase)" />
    }
    return <UseCaseRenderer data={parsed.diagrams.useCase} settings={settings} />
  }

  if (activeType === 'sequence') {
    if (!parsed.diagrams.sequence.messages.length) {
      return <EmptyDiagram message="No sequence syntax found. Example: Alice -> Bob: Hello" />
    }
    return <SequenceRenderer data={parsed.diagrams.sequence} settings={settings} />
  }

  if (activeType === 'class') {
    if (!parsed.diagrams.class.classes.length) {
      return <EmptyDiagram message="No class syntax found. Example: class User { +name: string }" />
    }
    return <ClassRenderer data={parsed.diagrams.class} settings={settings} />
  }

  if (activeType === 'state') {
    if (!parsed.diagrams.state.transitions.length) {
      return <EmptyDiagram message="No state syntax found. Example: [Idle] -> [Active]: start" />
    }
    return <StateRenderer data={parsed.diagrams.state} settings={settings} />
  }

  return <EmptyDiagram message="Add diagram text on the left to start rendering." />
}
