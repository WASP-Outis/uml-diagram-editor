import { pointsToSvgPath, routeOrthogonalPath } from '../utils/GeometryUtils'
import { MarkerDefs, SvgLabel } from './RendererPrimitives'

function computeActivationBoxes(activations, participantLayout, topY, gap) {
  return activations
    .map((activation) => {
      const participant = participantLayout[activation.participant]
      if (!participant) {
        return null
      }

      const y = topY + activation.startIndex * gap - 18
      const rawHeight = (activation.endIndex - activation.startIndex) * gap + 40
      return {
        id: activation.id,
        x: participant.x - 8,
        y,
        width: 16,
        height: Math.max(28, rawHeight),
      }
    })
    .filter(Boolean)
}

export default function SequenceRenderer({ data, settings }) {
  const participants = data.participants ?? []
  const messages = data.messages ?? []
  const activations = data.activations ?? []

  const participantStartX = 120
  const participantGap = 180
  const headerY = 44
  const headerWidth = 120
  const headerHeight = 40
  const messageStartY = 140
  const messageGap = 70

  const participantLayout = {}
  participants.forEach((participant, index) => {
    participantLayout[participant.id] = {
      ...participant,
      x: participantStartX + index * participantGap,
    }
  })

  const activationBoxes = computeActivationBoxes(
    activations,
    participantLayout,
    messageStartY,
    messageGap,
  )

  const width = Math.max(900, participantStartX + participants.length * participantGap + 180)
  const height = Math.max(420, messageStartY + messages.length * messageGap + 120)

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="rounded-xl border border-slate-300 bg-white shadow-sm"
    >
      <MarkerDefs color={settings.primaryColor} />
      <rect width={width} height={height} fill="url(#diagram-grid)" />

      <text
        x="36"
        y="38"
        fontSize="15"
        fontWeight="600"
        fill="#334155"
        fontFamily="'Vazirmatn', ui-sans-serif, system-ui"
      >
        Sequence Diagram
      </text>

      {Object.values(participantLayout).map((participant) => (
        <g key={participant.id}>
          <rect
            x={participant.x - headerWidth / 2}
            y={headerY}
            width={headerWidth}
            height={headerHeight}
            rx="8"
            fill="#ffffff"
            stroke="#64748b"
            strokeWidth="1.4"
          />
          <SvgLabel
            x={participant.x}
            y={headerY + 25}
            text={participant.name}
            center
            fill="#0f172a"
          />
          <line
            x1={participant.x}
            y1={headerY + headerHeight}
            x2={participant.x}
            y2={height - 40}
            stroke="#94a3b8"
            strokeDasharray="8 6"
          />
        </g>
      ))}

      {activationBoxes.map((activation) => (
        <rect
          key={activation.id}
          x={activation.x}
          y={activation.y}
          width={activation.width}
          height={activation.height}
          fill="#dbeafe"
          stroke="#3b82f6"
          strokeWidth="1.2"
          opacity="0.95"
        />
      ))}

      {messages.map((message, index) => {
        const source = participantLayout[message.from]
        const target = participantLayout[message.to]
        if (!source || !target) {
          return null
        }

        const y = messageStartY + index * messageGap

        if (message.from === message.to) {
          const selfPath = [
            { x: source.x + 8, y },
            { x: source.x + 62, y },
            { x: source.x + 62, y: y + 30 },
            { x: source.x + 8, y: y + 30 },
          ]
          return (
            <g key={message.id}>
              <path
                d={pointsToSvgPath(selfPath)}
                fill="none"
                stroke={settings.primaryColor}
                strokeWidth={settings.strokeWidth}
                markerEnd={message.messageType === 'async' ? 'url(#arrow-async)' : 'url(#arrow-sync)'}
              />
              <SvgLabel x={source.x + 66} y={y + 12} text={message.message} fill="#0f172a" />
            </g>
          )
        }

        const isRight = source.x < target.x
        const start = {
          x: source.x + (isRight ? 8 : -8),
          y,
          side: isRight ? 'right' : 'left',
          normal: { x: isRight ? 1 : -1, y: 0 },
        }
        const end = {
          x: target.x + (isRight ? -8 : 8),
          y,
          side: isRight ? 'left' : 'right',
          normal: { x: isRight ? -1 : 1, y: 0 },
        }

        const headerObstacles = Object.values(participantLayout).map((participant) => ({
          x: participant.x - headerWidth / 2,
          y: headerY,
          width: headerWidth,
          height: headerHeight,
        }))

        const routed = routeOrthogonalPath({
          start,
          end,
          obstacles: headerObstacles,
          gridSize: 12,
          obstaclePadding: 6,
          stubLength: 10,
        })

        const labelAnchor = routed[Math.floor(routed.length / 2)] ?? {
          x: (start.x + end.x) / 2,
          y,
        }

        return (
          <g key={message.id}>
            <path
              d={pointsToSvgPath(routed)}
              fill="none"
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
              markerEnd={message.messageType === 'async' ? 'url(#arrow-async)' : 'url(#arrow-sync)'}
            />
            <SvgLabel
              x={labelAnchor.x}
              y={labelAnchor.y - 8}
              text={message.message}
              center
              fill="#0f172a"
            />
          </g>
        )
      })}
    </svg>
  )
}
