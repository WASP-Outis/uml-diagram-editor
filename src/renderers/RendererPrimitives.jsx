import { containsPersian } from '../utils/TextUtils'

export function MarkerDefs({ color }) {
  return (
    <defs>
      <marker
        id="arrow-sync"
        markerWidth="12"
        markerHeight="12"
        refX="11"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 12 6 L 0 12 z" fill={color} />
      </marker>

      <marker
        id="arrow-async"
        markerWidth="12"
        markerHeight="12"
        refX="11"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 1 1 L 11 6 L 1 11" fill="none" stroke={color} strokeWidth="1.6" />
      </marker>

      <marker
        id="triangle-hollow"
        markerWidth="14"
        markerHeight="14"
        refX="12"
        refY="7"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 1 1 L 13 7 L 1 13 z" fill="#ffffff" stroke={color} strokeWidth="1.4" />
      </marker>

      <marker
        id="diamond-solid"
        markerWidth="14"
        markerHeight="14"
        refX="13"
        refY="7"
        orient="auto-start-reverse"
        markerUnits="strokeWidth"
      >
        <path d="M 1 7 L 7 1 L 13 7 L 7 13 z" fill={color} />
      </marker>

      <marker
        id="diamond-hollow"
        markerWidth="14"
        markerHeight="14"
        refX="13"
        refY="7"
        orient="auto-start-reverse"
        markerUnits="strokeWidth"
      >
        <path d="M 1 7 L 7 1 L 13 7 L 7 13 z" fill="#ffffff" stroke={color} strokeWidth="1.3" />
      </marker>

      <pattern id="diagram-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#d7dee7" strokeWidth="0.9" />
      </pattern>
    </defs>
  )
}

export function SvgLabel({
  x,
  y,
  text,
  center = false,
  className = '',
  fill = '#111827',
  size = 13,
}) {
  const isRtl = containsPersian(text)
  const textAnchor = center ? 'middle' : isRtl ? 'end' : 'start'

  return (
    <text
      x={x}
      y={y}
      className={className}
      fontSize={size}
      fill={fill}
      textAnchor={textAnchor}
      direction={isRtl ? 'rtl' : 'ltr'}
      unicodeBidi="plaintext"
      fontFamily="'Vazirmatn', ui-sans-serif, system-ui"
    >
      {text}
    </text>
  )
}
