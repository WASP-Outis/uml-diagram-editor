import {
  getClosestAnchors,
  pointsToSvgPath,
  routeOrthogonalPath,
} from '../utils/GeometryUtils'
import { MarkerDefs, SvgLabel } from './RendererPrimitives'

export default function UseCaseRenderer({ data, settings }) {
  const actors = data.actors ?? []
  const useCases = data.useCases ?? []
  const associations = data.associations ?? []

  const actorSpacing = 130
  const useCaseSpacing = 110
  const actorStartY = 120
  const useCaseStartY = 110
  const actorX = 120
  const useCaseX = 440

  const actorRects = actors.map((actor, index) => ({
    ...actor,
    x: actorX - 24,
    y: actorStartY + index * actorSpacing - 46,
    width: 48,
    height: 92,
  }))

  const useCaseRects = useCases.map((useCase, index) => ({
    ...useCase,
    x: useCaseX - 90,
    y: useCaseStartY + index * useCaseSpacing - 30,
    width: 180,
    height: 60,
  }))

  const nodeMap = {}
  actorRects.forEach((item) => {
    nodeMap[item.id] = item
  })
  useCaseRects.forEach((item) => {
    nodeMap[item.id] = item
  })

  const width = 860
  const height =
    Math.max(
      actorStartY + actors.length * actorSpacing,
      useCaseStartY + useCases.length * useCaseSpacing,
      360,
    ) + 80

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="rounded-xl border border-slate-300 bg-white shadow-sm"
    >
      <MarkerDefs color={settings.primaryColor} />
      <rect x="0" y="0" width={width} height={height} fill="url(#diagram-grid)" />

      <text
        x="36"
        y="40"
        fontSize="15"
        fontWeight="600"
        fill="#334155"
        fontFamily="'Vazirmatn', ui-sans-serif, system-ui"
      >
        Use Case Diagram
      </text>

      {associations.map((association) => {
        const actorNode = nodeMap[association.actorId]
        const useCaseNode = nodeMap[association.useCaseId]
        if (!actorNode || !useCaseNode) {
          return null
        }

        const { start, end } = getClosestAnchors(actorNode, useCaseNode)
        const obstacles = [...actorRects, ...useCaseRects].filter(
          (item) => item.id !== actorNode.id && item.id !== useCaseNode.id,
        )
        const path = routeOrthogonalPath({
          start,
          end,
          obstacles,
          gridSize: 14,
          obstaclePadding: 12,
          stubLength: 12,
        })

        return (
          <path
            key={association.id}
            d={pointsToSvgPath(path)}
            fill="none"
            stroke={settings.primaryColor}
            strokeWidth={settings.strokeWidth}
            markerEnd={association.async ? 'url(#arrow-async)' : 'url(#arrow-sync)'}
            opacity="0.95"
          />
        )
      })}

      {actorRects.map((actor) => {
        const centerX = actor.x + actor.width / 2
        const topY = actor.y + 8
        return (
          <g key={actor.id}>
            <circle
              cx={centerX}
              cy={topY + 10}
              r="9"
              fill="#f8fafc"
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
            />
            <line
              x1={centerX}
              y1={topY + 19}
              x2={centerX}
              y2={topY + 52}
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
            />
            <line
              x1={centerX - 15}
              y1={topY + 30}
              x2={centerX + 15}
              y2={topY + 30}
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
            />
            <line
              x1={centerX}
              y1={topY + 52}
              x2={centerX - 13}
              y2={topY + 74}
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
            />
            <line
              x1={centerX}
              y1={topY + 52}
              x2={centerX + 13}
              y2={topY + 74}
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
            />
            <SvgLabel
              x={centerX}
              y={actor.y + actor.height + 20}
              text={actor.name}
              center
              fill="#0f172a"
            />
          </g>
        )
      })}

      {useCaseRects.map((useCase) => (
        <g key={useCase.id}>
          <ellipse
            cx={useCase.x + useCase.width / 2}
            cy={useCase.y + useCase.height / 2}
            rx={useCase.width / 2}
            ry={useCase.height / 2}
            fill="#ffffff"
            stroke="#475569"
            strokeWidth="1.6"
          />
          <SvgLabel
            x={useCase.x + useCase.width / 2}
            y={useCase.y + useCase.height / 2 + 4}
            text={useCase.name}
            center
            fill="#111827"
          />
        </g>
      ))}
    </svg>
  )
}
