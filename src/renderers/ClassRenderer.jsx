import {
  getClosestAnchors,
  pointsToSvgPath,
  routeOrthogonalPath,
} from '../utils/GeometryUtils'
import { containsPersian } from '../utils/TextUtils'
import { MarkerDefs, SvgLabel } from './RendererPrimitives'

function calculateClassHeight(classNode) {
  const attributeRows = Math.max(1, classNode.attributes.length)
  const methodRows = Math.max(1, classNode.methods.length)
  return 48 + attributeRows * 24 + methodRows * 24 + 8
}

function estimateTextWidth(text) {
  return [...String(text)].reduce((sum, character) => {
    if (character === ' ') {
      return sum + 4
    }
    if (character.charCodeAt(0) > 255) {
      return sum + 8.7
    }
    return sum + 7.2
  }, 0)
}

function fitTextToWidth(text, maxWidth) {
  const value = String(text ?? '')
  if (estimateTextWidth(value) <= maxWidth) {
    return value
  }

  const suffix = '...'
  let truncated = value
  while (truncated.length > 0 && estimateTextWidth(`${truncated}${suffix}`) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated.length ? `${truncated}${suffix}` : suffix
}

function getClassWidth(classNode) {
  const members = [classNode.name, ...classNode.attributes, ...classNode.methods]
  const widest = members.reduce(
    (max, line) => Math.max(max, estimateTextWidth(line)),
    120,
  )
  return Math.max(250, Math.min(320, Math.ceil(widest + 34)))
}

function buildInheritanceMaps(classes, relations) {
  const classIds = new Set(classes.map((item) => item.id))
  const inheritance = relations.filter((item) => item.relationType === 'inheritance')

  const childrenByParent = {}
  const parentsByChild = {}

  classes.forEach((item) => {
    childrenByParent[item.id] = []
    parentsByChild[item.id] = []
  })

  inheritance.forEach((relation) => {
    const child = relation.from
    const parent = relation.to
    if (!classIds.has(child) || !classIds.has(parent)) {
      return
    }
    childrenByParent[parent].push(child)
    parentsByChild[child].push(parent)
  })

  return {
    inheritance,
    childrenByParent,
    parentsByChild,
  }
}

function buildLevelMap(classes, relations) {
  const { inheritance, childrenByParent, parentsByChild } = buildInheritanceMaps(classes, relations)
  if (!inheritance.length) {
    return null
  }

  const classIds = classes.map((item) => item.id)
  const roots = classIds.filter((id) => parentsByChild[id].length === 0)
  if (!roots.length) {
    return null
  }

  const levelById = {}
  roots.forEach((root) => {
    levelById[root] = 0
  })

  const queue = [...roots]
  while (queue.length) {
    const parent = queue.shift()
    const parentLevel = levelById[parent]

    for (const child of childrenByParent[parent]) {
      const proposed = parentLevel + 1
      if (levelById[child] === undefined || proposed > levelById[child]) {
        levelById[child] = proposed
        queue.push(child)
      }
    }
  }

  let maxLevel = Math.max(...Object.values(levelById))
  classIds.forEach((id) => {
    if (levelById[id] === undefined) {
      maxLevel += 1
      levelById[id] = maxLevel
    }
  })

  return {
    levelById,
    parentsByChild,
  }
}

function buildGridLayout(classes, dimensions) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(classes.length || 1)))
  const horizontalGap = 90
  const verticalGap = 90
  const startX = 90
  const startY = 100

  const rows = []
  for (let index = 0; index < classes.length; index += 1) {
    const rowIndex = Math.floor(index / columns)
    if (!rows[rowIndex]) {
      rows[rowIndex] = []
    }
    rows[rowIndex].push(classes[index].id)
  }

  const rowHeights = rows.map((row) =>
    Math.max(...row.map((id) => dimensions[id].height)),
  )

  const yByRow = []
  let cursorY = startY
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    yByRow[rowIndex] = cursorY
    cursorY += rowHeights[rowIndex] + verticalGap
  }

  return classes.map((classNode, index) => {
    const rowIndex = Math.floor(index / columns)
    const colIndex = index % columns
    const item = dimensions[classNode.id]
    return {
      ...classNode,
      width: item.width,
      height: item.height,
      x: startX + colIndex * (320 + horizontalGap),
      y: yByRow[rowIndex],
    }
  })
}

function buildHierarchicalLayout(classes, relations, dimensions) {
  const levelInfo = buildLevelMap(classes, relations)
  if (!levelInfo) {
    return null
  }

  const { levelById, parentsByChild } = levelInfo
  const horizontalGap = 90
  const verticalGap = 120
  const startX = 90
  const startY = 90

  const levels = {}
  classes.forEach((item) => {
    const level = levelById[item.id] ?? 0
    if (!levels[level]) {
      levels[level] = []
    }
    levels[level].push(item.id)
  })

  const orderedLevels = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b)

  const orderIndexById = {}
  orderedLevels.forEach((level, levelIndex) => {
    const ids = levels[level]
    if (levelIndex === 0) {
      ids.sort()
    } else {
      ids.sort((leftId, rightId) => {
        const leftParents = parentsByChild[leftId] ?? []
        const rightParents = parentsByChild[rightId] ?? []
        const leftScore =
          leftParents.reduce((sum, id) => sum + (orderIndexById[id] ?? 0), 0) /
          Math.max(1, leftParents.length)
        const rightScore =
          rightParents.reduce((sum, id) => sum + (orderIndexById[id] ?? 0), 0) /
          Math.max(1, rightParents.length)
        if (leftScore !== rightScore) {
          return leftScore - rightScore
        }
        return leftId.localeCompare(rightId)
      })
    }

    ids.forEach((id, index) => {
      orderIndexById[id] = index
    })
  })

  const levelMaxHeights = orderedLevels.map((level) =>
    Math.max(...levels[level].map((id) => dimensions[id].height)),
  )

  const levelWidths = orderedLevels.map((level) => {
    const ids = levels[level]
    const totalNodeWidth = ids.reduce((sum, id) => sum + dimensions[id].width, 0)
    const totalGap = Math.max(0, ids.length - 1) * horizontalGap
    return totalNodeWidth + totalGap
  })

  const maxLevelWidth = Math.max(...levelWidths, 500)

  const yByLevel = []
  let yCursor = startY
  for (let index = 0; index < orderedLevels.length; index += 1) {
    yByLevel[index] = yCursor
    yCursor += levelMaxHeights[index] + verticalGap
  }

  const positioned = []
  orderedLevels.forEach((level, levelIndex) => {
    const ids = levels[level]
    const levelWidth = levelWidths[levelIndex]
    let xCursor = startX + (maxLevelWidth - levelWidth) / 2
    const y = yByLevel[levelIndex]

    ids.forEach((id) => {
      const classNode = classes.find((item) => item.id === id)
      const item = dimensions[id]
      positioned.push({
        ...classNode,
        width: item.width,
        height: item.height,
        x: xCursor,
        y,
      })
      xCursor += item.width + horizontalGap
    })
  })

  return positioned
}

function buildLayout(classes, relations) {
  const dimensions = {}
  classes.forEach((classNode) => {
    dimensions[classNode.id] = {
      width: getClassWidth(classNode),
      height: calculateClassHeight(classNode),
    }
  })

  const hierarchical = buildHierarchicalLayout(classes, relations, dimensions)
  if (hierarchical) {
    return hierarchical
  }

  return buildGridLayout(classes, dimensions)
}

function getLineX(classNode, text) {
  if (containsPersian(text)) {
    return classNode.x + classNode.width - 12
  }
  return classNode.x + 12
}

function createSideAnchor(rect, side, ratio = 0.5) {
  const normalMap = {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  }
  const normal = normalMap[side]

  if (side === 'top' || side === 'bottom') {
    return {
      x: rect.x + rect.width * ratio,
      y: side === 'top' ? rect.y : rect.y + rect.height,
      side,
      normal,
    }
  }

  return {
    x: side === 'left' ? rect.x : rect.x + rect.width,
    y: rect.y + rect.height * ratio,
    side,
    normal,
  }
}

export default function ClassRenderer({ data, settings }) {
  const classes = data.classes ?? []
  const relations = data.relations ?? []

  const layout = buildLayout(classes, relations)
  const nodeMap = {}
  layout.forEach((node) => {
    nodeMap[node.id] = node
  })

  const inheritanceSiblingMeta = {}
  const groupedInheritanceByParent = {}
  relations
    .filter((relation) => relation.relationType === 'inheritance')
    .forEach((relation) => {
      const parent = relation.to
      if (!groupedInheritanceByParent[parent]) {
        groupedInheritanceByParent[parent] = []
      }
      groupedInheritanceByParent[parent].push(relation)
    })

  Object.values(groupedInheritanceByParent).forEach((group) => {
    group.sort((left, right) => {
      const leftX = (nodeMap[left.from]?.x ?? 0) + (nodeMap[left.from]?.width ?? 0) / 2
      const rightX = (nodeMap[right.from]?.x ?? 0) + (nodeMap[right.from]?.width ?? 0) / 2
      return leftX - rightX
    })

    group.forEach((relation, index) => {
      inheritanceSiblingMeta[relation.id] = {
        index,
        total: group.length,
      }
    })
  })

  const maxX = layout.reduce((acc, item) => Math.max(acc, item.x + item.width), 860)
  const maxY = layout.reduce((acc, item) => Math.max(acc, item.y + item.height), 420)
  const width = maxX + 120
  const height = maxY + 120

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
        Class Diagram
      </text>

      {relations.map((relation) => {
        const source = nodeMap[relation.from]
        const target = nodeMap[relation.to]
        if (!source || !target) {
          return null
        }

        let anchorPair = getClosestAnchors(source, target)

        if (relation.relationType === 'inheritance') {
          const isTargetAbove = target.y + target.height <= source.y
          const siblingInfo = inheritanceSiblingMeta[relation.id] ?? { index: 0, total: 1 }
          const ratio = (siblingInfo.index + 1) / (siblingInfo.total + 1)

          if (isTargetAbove) {
            anchorPair = {
              start: createSideAnchor(source, 'top', 0.5),
              end: createSideAnchor(target, 'bottom', ratio),
            }
          } else {
            anchorPair = {
              start: createSideAnchor(source, 'bottom', 0.5),
              end: createSideAnchor(target, 'top', ratio),
            }
          }
        }

        const obstacles = layout.filter((item) => item.id !== source.id && item.id !== target.id)
        const routed = routeOrthogonalPath({
          start: anchorPair.start,
          end: anchorPair.end,
          obstacles,
          gridSize: 14,
          obstaclePadding: 10,
          stubLength: 14,
        })

        const markerStart =
          relation.markerStart === 'diamond'
            ? 'url(#diamond-solid)'
            : relation.markerStart === 'hollow-diamond'
              ? 'url(#diamond-hollow)'
              : undefined

        const markerEnd = relation.markerEnd === 'triangle' ? 'url(#triangle-hollow)' : undefined

        return (
          <path
            key={relation.id}
            d={pointsToSvgPath(routed)}
            fill="none"
            stroke={settings.primaryColor}
            strokeWidth={settings.strokeWidth}
            markerStart={markerStart}
            markerEnd={markerEnd}
          />
        )
      })}

      {layout.map((classNode) => {
        const headerBottom = classNode.y + 42
        const attributesBottom = headerBottom + Math.max(1, classNode.attributes.length) * 24

        return (
          <g key={classNode.id}>
            <rect
              x={classNode.x}
              y={classNode.y}
              width={classNode.width}
              height={classNode.height}
              rx="8"
              fill="#ffffff"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <line x1={classNode.x} y1={headerBottom} x2={classNode.x + classNode.width} y2={headerBottom} stroke="#94a3b8" />
            <line
              x1={classNode.x}
              y1={attributesBottom}
              x2={classNode.x + classNode.width}
              y2={attributesBottom}
              stroke="#94a3b8"
            />

            <SvgLabel
              x={classNode.x + classNode.width / 2}
              y={classNode.y + 27}
              text={classNode.name}
              center
              fill="#0f172a"
            />

            {(classNode.attributes.length ? classNode.attributes : ['-']).map((attribute, index) => (
              <SvgLabel
                key={`${classNode.id}-attr-${index + 1}`}
                x={getLineX(classNode, attribute)}
                y={headerBottom + 18 + index * 24}
                text={fitTextToWidth(attribute, classNode.width - 24)}
                fill="#1f2937"
                size={12}
              />
            ))}

            {(classNode.methods.length ? classNode.methods : ['-']).map((method, index) => (
              <SvgLabel
                key={`${classNode.id}-method-${index + 1}`}
                x={getLineX(classNode, method)}
                y={attributesBottom + 18 + index * 24}
                text={fitTextToWidth(method, classNode.width - 24)}
                fill="#1f2937"
                size={12}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
