import {
  getClosestAnchors,
  pointsToSvgPath,
  routeOrthogonalPath,
} from '../utils/GeometryUtils'
import { MarkerDefs, SvgLabel } from './RendererPrimitives'

function buildStateLayout(states) {
  const count = Math.max(states.length, 1)
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)))
  const cellWidth = 230
  const cellHeight = 150
  const startX = 150
  const startY = 140

  return states.map((state, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    return {
      ...state,
      x: startX + col * cellWidth,
      y: startY + row * cellHeight,
      width: 140,
      height: 60,
      kind: 'state',
    }
  })
}

function pseudoNodeToRect(node) {
  if (node.kind === 'start' || node.kind === 'end') {
    return {
      x: node.x - node.radius,
      y: node.y - node.radius,
      width: node.radius * 2,
      height: node.radius * 2,
    }
  }
  return node
}

function getNodeCenter(node) {
  if (node.kind === 'start' || node.kind === 'end') {
    return { x: node.x, y: node.y }
  }
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}

function offsetAnchor(anchor, offsetX, offsetY) {
  return {
    ...anchor,
    x: anchor.x + offsetX,
    y: anchor.y + offsetY,
  }
}

function estimateLabelBox(text, centerX, centerY) {
  const width =
    [...String(text)].reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 8.8 : 7.2), 0) + 12
  const height = 18
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  }
}

function inflateRect(rect, padding) {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function segmentToRect(pointA, pointB, padding = 0) {
  const minX = Math.min(pointA.x, pointB.x)
  const minY = Math.min(pointA.y, pointB.y)
  const width = Math.max(1, Math.abs(pointA.x - pointB.x))
  const height = Math.max(1, Math.abs(pointA.y - pointB.y))
  return inflateRect({ x: minX, y: minY, width, height }, padding)
}

function dedupeCandidates(points) {
  const seen = new Set()
  return points.filter((point) => {
    const key = `${Math.round(point.x)}:${Math.round(point.y)}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function chooseLabelPlacement({
  label,
  path,
  nodeObstacles,
  usedLabelRects,
  usedPathRects,
}) {
  if (!label || path.length < 2) {
    return null
  }

  const midpoint = path[Math.floor(path.length / 2)] ?? path[0]
  const candidates = []

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index]
    const end = path[index + 1]
    const mid = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }

    const isHorizontal = start.y === end.y
    if (isHorizontal) {
      candidates.push({ x: mid.x, y: start.y - 14 })
      candidates.push({ x: mid.x, y: start.y + 18 })
    } else {
      candidates.push({ x: start.x - 14, y: mid.y })
      candidates.push({ x: start.x + 14, y: mid.y })
    }
  }

  candidates.push({ x: midpoint.x, y: midpoint.y - 18 })
  candidates.push({ x: midpoint.x, y: midpoint.y + 18 })

  const uniqueCandidates = dedupeCandidates(candidates)

  let best = null
  for (const candidate of uniqueCandidates) {
    const rect = estimateLabelBox(label, candidate.x, candidate.y)
    let score = 0

    for (const nodeRect of nodeObstacles) {
      if (rectsIntersect(inflateRect(rect, 4), nodeRect)) {
        score += 900
      }
    }

    for (const occupied of usedLabelRects) {
      if (rectsIntersect(inflateRect(rect, 3), occupied)) {
        score += 700
      }
    }

    for (const pathRect of usedPathRects) {
      if (rectsIntersect(inflateRect(rect, 2), pathRect)) {
        score += 280
      }
    }

    score +=
      (Math.abs(candidate.x - midpoint.x) + Math.abs(candidate.y - midpoint.y)) * 0.08

    if (!best || score < best.score) {
      best = { score, center: candidate, rect }
    }
  }

  return best
}

export default function StateRenderer({ data, settings }) {
  const states = data.states ?? []
  const transitions = data.transitions ?? []

  const stateLayout = buildStateLayout(states)
  const nodeMap = {}
  stateLayout.forEach((state) => {
    nodeMap[state.id] = state
  })

  const hasStart = transitions.some((item) => item.from === '*')
  const hasEnd = transitions.some((item) => item.to === '*')

  if (hasStart) {
    nodeMap.__start = { id: '__start', kind: 'start', x: 70, y: 150, radius: 10 }
  }
  if (hasEnd) {
    const rightMost = stateLayout.reduce((acc, item) => Math.max(acc, item.x + item.width), 620)
    nodeMap.__end = { id: '__end', kind: 'end', x: rightMost + 120, y: 150, radius: 12 }
  }

  const width =
    Math.max(
      900,
      ...stateLayout.map((state) => state.x + state.width + 140),
      nodeMap.__end ? nodeMap.__end.x + 120 : 0,
    )
  const height = Math.max(460, ...stateLayout.map((state) => state.y + state.height + 120))

  const obstacles = [
    ...stateLayout.map((state) => ({
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      id: state.id,
    })),
    ...(nodeMap.__start
      ? [
          {
            ...pseudoNodeToRect(nodeMap.__start),
            id: '__start',
          },
        ]
      : []),
    ...(nodeMap.__end
      ? [
          {
            ...pseudoNodeToRect(nodeMap.__end),
            id: '__end',
          },
        ]
      : []),
  ]

  const resolveNode = (id) => {
    if (id === '*') {
      return null
    }
    return nodeMap[id]
  }

  const nodeObstacles = obstacles.map((item) => ({
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
  }))

  const directedCounts = new Map()
  const directionSigns = new Map()
  const usedLabelRects = []
  const usedPathRects = []

  const renderedTransitions = transitions
    .map((transition) => {
      const fromNode = transition.from === '*' ? nodeMap.__start : resolveNode(transition.from)
      const toNode = transition.to === '*' ? nodeMap.__end : resolveNode(transition.to)
      if (!fromNode || !toNode) {
        return null
      }

      const fromId = fromNode.id
      const toId = toNode.id
      const directedKey = `${fromId}->${toId}`
      const reverseKey = `${toId}->${fromId}`

      const laneIndex = directedCounts.get(directedKey) ?? 0
      directedCounts.set(directedKey, laneIndex + 1)

      let sign = directionSigns.get(directedKey)
      if (sign === undefined) {
        const reverseSign = directionSigns.get(reverseKey)
        sign = reverseSign !== undefined ? -reverseSign : 1
        directionSigns.set(directedKey, sign)
      }

      const laneOffset = sign * (12 + laneIndex * 10)

      const fromRect = pseudoNodeToRect(fromNode)
      const toRect = pseudoNodeToRect(toNode)
      const { start: rawStart, end: rawEnd } = getClosestAnchors(fromRect, toRect)

      const fromCenter = getNodeCenter(fromNode)
      const toCenter = getNodeCenter(toNode)
      const mainlyHorizontal = Math.abs(toCenter.x - fromCenter.x) >= Math.abs(toCenter.y - fromCenter.y)
      const start = mainlyHorizontal
        ? offsetAnchor(rawStart, 0, laneOffset)
        : offsetAnchor(rawStart, laneOffset, 0)
      const end = mainlyHorizontal
        ? offsetAnchor(rawEnd, 0, laneOffset)
        : offsetAnchor(rawEnd, laneOffset, 0)

      const routed = routeOrthogonalPath({
        start,
        end,
        obstacles: [
          ...obstacles.filter((item) => item.id !== fromNode.id && item.id !== toNode.id),
          ...usedPathRects.map((rect, index) => ({
            ...rect,
            id: `path-rect-${index + 1}`,
          })),
        ],
        gridSize: 12,
        obstaclePadding: 10,
        stubLength: 12,
      })

      const labelPlacement = chooseLabelPlacement({
        label: transition.label,
        path: routed,
        nodeObstacles,
        usedLabelRects,
        usedPathRects,
      })

      if (labelPlacement) {
        usedLabelRects.push(labelPlacement.rect)
      }

      for (let segmentIndex = 0; segmentIndex < routed.length - 1; segmentIndex += 1) {
        const segmentRect = segmentToRect(routed[segmentIndex], routed[segmentIndex + 1], 4)
        usedPathRects.push(segmentRect)
      }

      return {
        ...transition,
        path: routed,
        labelPlacement,
      }
    })
    .filter(Boolean)

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
        State Machine Diagram
      </text>

      {renderedTransitions.map((transition) => {
        return (
          <g key={transition.id}>
            <path
              d={pointsToSvgPath(transition.path)}
              fill="none"
              stroke={settings.primaryColor}
              strokeWidth={settings.strokeWidth}
              markerEnd={transition.async ? 'url(#arrow-async)' : 'url(#arrow-sync)'}
            />
            {transition.label && transition.labelPlacement ? (
              <g>
                <rect
                  x={transition.labelPlacement.rect.x}
                  y={transition.labelPlacement.rect.y}
                  width={transition.labelPlacement.rect.width}
                  height={transition.labelPlacement.rect.height}
                  rx="5"
                  fill="#ffffff"
                  opacity="0.92"
                />
                <SvgLabel
                  x={transition.labelPlacement.center.x}
                  y={transition.labelPlacement.center.y + 4}
                  text={transition.label}
                  center
                  fill="#111827"
                />
              </g>
            ) : null}
          </g>
        )
      })}

      {stateLayout.map((state) => (
        <g key={state.id}>
          <rect
            x={state.x}
            y={state.y}
            width={state.width}
            height={state.height}
            rx="16"
            fill="#ffffff"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <SvgLabel
            x={state.x + state.width / 2}
            y={state.y + state.height / 2 + 4}
            text={state.name}
            center
            fill="#0f172a"
          />
        </g>
      ))}

      {nodeMap.__start ? <circle cx={nodeMap.__start.x} cy={nodeMap.__start.y} r="10" fill="#0f172a" /> : null}

      {nodeMap.__end ? (
        <g>
          <circle cx={nodeMap.__end.x} cy={nodeMap.__end.y} r="13" fill="none" stroke="#0f172a" strokeWidth="2" />
          <circle cx={nodeMap.__end.x} cy={nodeMap.__end.y} r="8" fill="#0f172a" />
        </g>
      ) : null}
    </svg>
  )
}
