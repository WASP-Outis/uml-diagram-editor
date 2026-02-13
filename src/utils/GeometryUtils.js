const DEFAULT_GRID_SIZE = 14
const DEFAULT_OBSTACLE_PADDING = 14
const DEFAULT_MARGIN = 80
const DEFAULT_STUB_LENGTH = 14

const TURN_PENALTY = 0.9
const UTURN_PENALTY = 0.6
const START_DIRECTION_PENALTY = 0.45

const CARDINAL_DIRECTIONS = [
  { dx: 1, dy: 0, side: 'right' },
  { dx: -1, dy: 0, side: 'left' },
  { dx: 0, dy: 1, side: 'bottom' },
  { dx: 0, dy: -1, side: 'top' },
]

const SIDE_VECTORS = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
}

const SIDE_TO_DIRECTION_INDEX = {
  right: 0,
  left: 1,
  bottom: 2,
  top: 3,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function getRectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}

export function inflateRect(rect, padding = DEFAULT_OBSTACLE_PADDING) {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

export function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function buildSideAnchor(rect, side, towardPoint, offset = 0) {
  const inset = 12
  const normal = SIDE_VECTORS[side]
  const minX = rect.x + inset
  const maxX = rect.x + rect.width - inset
  const minY = rect.y + inset
  const maxY = rect.y + rect.height - inset

  if (side === 'left' || side === 'right') {
    const y = clamp(towardPoint.y, minY, maxY)
    const x = side === 'left' ? rect.x : rect.x + rect.width
    return {
      x: x + normal.x * offset,
      y: y + normal.y * offset,
      side,
      normal,
    }
  }

  const x = clamp(towardPoint.x, minX, maxX)
  const y = side === 'top' ? rect.y : rect.y + rect.height
  return {
    x: x + normal.x * offset,
    y: y + normal.y * offset,
    side,
    normal,
  }
}

function scoreAnchorPair(startAnchor, endAnchor) {
  const dx = endAnchor.x - startAnchor.x
  const dy = endAnchor.y - startAnchor.y
  const manhattan = Math.abs(dx) + Math.abs(dy)

  const startFacing =
    startAnchor.normal.x * dx + startAnchor.normal.y * dy
  const endFacing = endAnchor.normal.x * -dx + endAnchor.normal.y * -dy

  let score = manhattan
  if (startFacing < 0) {
    score += 180
  }
  if (endFacing < 0) {
    score += 180
  }
  if (startAnchor.side === endAnchor.side) {
    score += 28
  }

  return score
}

export function getAnchorPoint(rect, targetPoint, offset = 0) {
  const center = getRectCenter(rect)
  const dx = targetPoint.x - center.x
  const dy = targetPoint.y - center.y

  let side = 'right'
  if (Math.abs(dx) >= Math.abs(dy)) {
    side = dx >= 0 ? 'right' : 'left'
  } else {
    side = dy >= 0 ? 'bottom' : 'top'
  }
  return buildSideAnchor(rect, side, targetPoint, offset)
}

export function getClosestAnchors(sourceRect, targetRect, offset = 0) {
  const sourceCenter = getRectCenter(sourceRect)
  const targetCenter = getRectCenter(targetRect)

  const sides = ['left', 'right', 'top', 'bottom']
  let best = null

  for (const sourceSide of sides) {
    const start = buildSideAnchor(sourceRect, sourceSide, targetCenter, offset)
    for (const targetSide of sides) {
      const end = buildSideAnchor(targetRect, targetSide, sourceCenter, offset)
      const score = scoreAnchorPair(start, end)

      if (!best || score < best.score) {
        best = { score, start, end }
      }
    }
  }

  return best
    ? { start: best.start, end: best.end }
    : {
        start: getAnchorPoint(sourceRect, targetCenter, offset),
        end: getAnchorPoint(targetRect, sourceCenter, offset),
      }
}

function buildBounds(points, obstacles, margin = DEFAULT_MARGIN) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  for (const obstacle of obstacles) {
    xs.push(obstacle.x, obstacle.x + obstacle.width)
    ys.push(obstacle.y, obstacle.y + obstacle.height)
  }

  const minX = Math.min(...xs) - margin
  const maxX = Math.max(...xs) + margin
  const minY = Math.min(...ys) - margin
  const maxY = Math.max(...ys) + margin

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function toCell(point, bounds, gridSize) {
  return {
    cx: Math.round((point.x - bounds.minX) / gridSize),
    cy: Math.round((point.y - bounds.minY) / gridSize),
  }
}

function fromCell(cell, bounds, gridSize) {
  return {
    x: bounds.minX + cell.cx * gridSize,
    y: bounds.minY + cell.cy * gridSize,
  }
}

function getCellKey(cx, cy) {
  return `${cx},${cy}`
}

function getStateKey(cx, cy, directionIndex) {
  return `${cx},${cy},${directionIndex}`
}

function manhattanDistance(a, b) {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy)
}

function simplifyOrthogonalPoints(points) {
  if (points.length <= 2) {
    return points
  }

  const compact = [points[0]]
  for (let index = 1; index < points.length; index += 1) {
    const previous = compact[compact.length - 1]
    const current = points[index]
    if (previous.x !== current.x || previous.y !== current.y) {
      compact.push(current)
    }
  }

  const simplified = [compact[0]]
  for (let index = 1; index < compact.length - 1; index += 1) {
    const prev = simplified[simplified.length - 1]
    const curr = compact[index]
    const next = compact[index + 1]

    const sameVertical = prev.x === curr.x && curr.x === next.x
    const sameHorizontal = prev.y === curr.y && curr.y === next.y
    if (!sameVertical && !sameHorizontal) {
      simplified.push(curr)
    }
  }
  simplified.push(compact[compact.length - 1])

  return simplified
}

function reconstructPath(cameFrom, stateKey) {
  const stateKeys = [stateKey]
  let walker = stateKey
  while (cameFrom.has(walker)) {
    walker = cameFrom.get(walker)
    stateKeys.push(walker)
  }
  const points = stateKeys
    .reverse()
    .map((item) => {
      const [cx, cy] = item.split(',').map(Number)
      return { cx, cy }
    })
    .filter((point, index, array) => {
      const prev = array[index - 1]
      return !prev || prev.cx !== point.cx || prev.cy !== point.cy
    })
  return points
}

function isOppositeDirection(indexA, indexB) {
  if (indexA === -1 || indexB === -1) {
    return false
  }
  const a = CARDINAL_DIRECTIONS[indexA]
  const b = CARDINAL_DIRECTIONS[indexB]
  return a.dx + b.dx === 0 && a.dy + b.dy === 0
}

function routeAStar(startCell, endCell, isBlocked, getCellPenalty, columns, rows, preferredStartDirection) {
  const startStateKey = getStateKey(startCell.cx, startCell.cy, -1)
  const openSet = new Set([startStateKey])
  const cameFrom = new Map()
  const gScore = new Map([[startStateKey, 0]])
  const fScore = new Map([[startStateKey, manhattanDistance(startCell, endCell)]])

  while (openSet.size > 0) {
    let currentStateKey = null
    let currentScore = Number.POSITIVE_INFINITY

    for (const key of openSet) {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY
      if (score < currentScore) {
        currentScore = score
        currentStateKey = key
      }
    }

    const [cx, cy, previousDirection] = currentStateKey.split(',').map(Number)
    if (cx === endCell.cx && cy === endCell.cy) {
      return reconstructPath(cameFrom, currentStateKey)
    }

    openSet.delete(currentStateKey)
    const currentCost = gScore.get(currentStateKey) ?? Number.POSITIVE_INFINITY

    for (let directionIndex = 0; directionIndex < CARDINAL_DIRECTIONS.length; directionIndex += 1) {
      const direction = CARDINAL_DIRECTIONS[directionIndex]
      const nx = cx + direction.dx
      const ny = cy + direction.dy

      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) {
        continue
      }
      if (isBlocked(nx, ny)) {
        continue
      }

      const neighborStateKey = getStateKey(nx, ny, directionIndex)
      let movementCost = 1 + getCellPenalty(nx, ny)

      if (previousDirection !== -1 && previousDirection !== directionIndex) {
        movementCost += TURN_PENALTY
      }
      if (isOppositeDirection(previousDirection, directionIndex)) {
        movementCost += UTURN_PENALTY
      }
      if (
        previousDirection === -1 &&
        preferredStartDirection !== -1 &&
        directionIndex !== preferredStartDirection
      ) {
        movementCost += START_DIRECTION_PENALTY
      }

      const tentativeGScore = currentCost + movementCost
      const existingGScore = gScore.get(neighborStateKey)

      if (existingGScore === undefined || tentativeGScore < existingGScore) {
        cameFrom.set(neighborStateKey, currentStateKey)
        gScore.set(neighborStateKey, tentativeGScore)
        fScore.set(
          neighborStateKey,
          tentativeGScore + manhattanDistance({ cx: nx, cy: ny }, endCell),
        )
        openSet.add(neighborStateKey)
      }
    }
  }

  return null
}

function createCellPenaltyGetter(blockedSet, columns, rows) {
  return (cx, cy) => {
    let penalty = 0
    for (let x = cx - 1; x <= cx + 1; x += 1) {
      for (let y = cy - 1; y <= cy + 1; y += 1) {
        if (x < 0 || y < 0 || x >= columns || y >= rows || (x === cx && y === cy)) {
          continue
        }
        if (blockedSet.has(getCellKey(x, y))) {
          penalty += 0.14
        }
      }
    }
    return penalty
  }
}

function buildStubPoint(anchor, length) {
  if (!anchor?.side || !anchor?.normal) {
    return null
  }
  return {
    x: anchor.x + anchor.normal.x * length,
    y: anchor.y + anchor.normal.y * length,
    side: anchor.side,
    normal: anchor.normal,
  }
}

export function routeOrthogonalPath({
  start,
  end,
  obstacles = [],
  gridSize = DEFAULT_GRID_SIZE,
  obstaclePadding = DEFAULT_OBSTACLE_PADDING,
  stubLength = DEFAULT_STUB_LENGTH,
}) {
  const startStub = buildStubPoint(start, stubLength)
  const endStub = buildStubPoint(end, stubLength)

  const routingStart = startStub ?? start
  const routingEnd = endStub ?? end

  const paddedObstacles = obstacles.map((obstacle) =>
    inflateRect(obstacle, obstaclePadding),
  )
  const bounds = buildBounds([start, end, routingStart, routingEnd], paddedObstacles)

  const columns = Math.max(2, Math.ceil(bounds.width / gridSize) + 1)
  const rows = Math.max(2, Math.ceil(bounds.height / gridSize) + 1)

  const blocked = new Set()
  for (let cx = 0; cx < columns; cx += 1) {
    for (let cy = 0; cy < rows; cy += 1) {
      const point = fromCell({ cx, cy }, bounds, gridSize)
      if (paddedObstacles.some((obstacle) => pointInRect(point, obstacle))) {
        blocked.add(getCellKey(cx, cy))
      }
    }
  }

  const startCell = toCell(routingStart, bounds, gridSize)
  const endCell = toCell(routingEnd, bounds, gridSize)

  blocked.delete(getCellKey(startCell.cx, startCell.cy))
  blocked.delete(getCellKey(endCell.cx, endCell.cy))

  const getCellPenalty = createCellPenaltyGetter(blocked, columns, rows)
  const preferredStartDirection = start?.side
    ? SIDE_TO_DIRECTION_INDEX[start.side]
    : -1

  const pathCells = routeAStar(
    startCell,
    endCell,
    (cx, cy) => blocked.has(getCellKey(cx, cy)),
    getCellPenalty,
    columns,
    rows,
    preferredStartDirection,
  )

  if (!pathCells) {
    const fallback = simplifyOrthogonalPoints([
      routingStart,
      { x: routingStart.x, y: routingEnd.y },
      routingEnd,
    ])
    return simplifyOrthogonalPoints([
      start,
      ...(startStub ? [routingStart] : []),
      ...fallback.slice(1, -1),
      ...(endStub ? [routingEnd] : []),
      end,
    ])
  }

  const points = pathCells.map((cell) => fromCell(cell, bounds, gridSize))
  points[0] = routingStart
  points[points.length - 1] = routingEnd

  const finalPoints = simplifyOrthogonalPoints([
    start,
    ...(startStub ? [routingStart] : []),
    ...points.slice(1, -1),
    ...(endStub ? [routingEnd] : []),
    end,
  ])

  return finalPoints
}

export function pointsToSvgPath(points) {
  if (!points.length) {
    return ''
  }
  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(' ')
}
