'use client'

export type CiciState = 'idle' | 'working' | 'celebrating' | 'thinking' | 'new'

interface CiciProps {
  state?: CiciState
  size?: number
  style?: React.CSSProperties
}

// Pixel art eyes/mouth variants per state
function getEyes(state: CiciState): { left: string; right: string; mouth: string } {
  switch (state) {
    case 'celebrating':
    case 'new':
      return { left: '◕', right: '◕', mouth: '‿' }
    default:
      return { left: '◉', right: '◉', mouth: '▲' }
  }
}

export function Cici({ state = 'idle', size = 42, style }: CiciProps) {
  const scale = size / 42
  const p = 6 // pixel size in SVG units

  const fill = '#E8572A'
  const dark = '#1A1A2E'
  const eyes = getEyes(state)

  // Celebrating Cici has slightly different mouth row
  const isHappy = state === 'celebrating' || state === 'new'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 42 54"
      width={42 * scale}
      height={54 * scale}
      className={`cici ${state}`}
      style={style}
    >
      {/* Row 1: head top */}
      <rect x={p} y={0} width={p} height={p} fill={fill} />
      <rect x={p * 2} y={0} width={p} height={p} fill={fill} />
      <rect x={p * 3} y={0} width={p} height={p} fill={fill} />
      <rect x={p * 4} y={0} width={p} height={p} fill={fill} />
      <rect x={p * 5} y={0} width={p} height={p} fill={fill} />

      {/* Row 2: eyes */}
      <rect x={0} y={p} width={p} height={p} fill={fill} />
      <rect x={p * 2} y={p} width={p} height={p} fill={dark} />
      <rect x={p * 4} y={p} width={p} height={p} fill={dark} />
      <rect x={p * 6} y={p} width={p} height={p} fill={fill} />

      {/* Row 3: mouth */}
      <rect x={p} y={p * 2} width={p} height={p} fill={fill} />
      <rect x={p * 3} y={p * 2} width={p} height={p} fill={isHappy ? fill : dark} />
      <rect x={p * 5} y={p * 2} width={p} height={p} fill={fill} />
      {/* Happy mouth: wider, lower arc implied by extra pixels */}
      {isHappy && (
        <>
          <rect x={p * 2} y={p * 2} width={p} height={p} fill={dark} opacity={0.4} />
          <rect x={p * 4} y={p * 2} width={p} height={p} fill={dark} opacity={0.4} />
        </>
      )}

      {/* Row 4: chin */}
      <rect x={p * 2} y={p * 3} width={p} height={p} fill={fill} />
      <rect x={p * 3} y={p * 3} width={p} height={p} fill={fill} />
      <rect x={p * 4} y={p * 3} width={p} height={p} fill={fill} />

      {/* Row 5: body top */}
      <rect x={p} y={p * 4} width={p} height={p} fill={fill} />
      <rect x={p * 2} y={p * 4} width={p} height={p} fill={fill} />
      <rect x={p * 3} y={p * 4} width={p} height={p} fill={fill} />
      <rect x={p * 4} y={p * 4} width={p} height={p} fill={fill} />
      <rect x={p * 5} y={p * 4} width={p} height={p} fill={fill} />

      {/* Row 6–8: legs vary by state */}
      {state === 'working' ? (
        <>
          {/* Walking: legs apart */}
          <rect x={p} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p * 3} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p * 5} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p} y={p * 6} width={p} height={p} fill={fill} />
          <rect x={p * 5} y={p * 6} width={p} height={p} fill={fill} />
        </>
      ) : (
        <>
          {/* Standing: legs together */}
          <rect x={p} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p * 2} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p * 3} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p * 4} y={p * 5} width={p} height={p} fill={fill} />
          <rect x={p * 5} y={p * 5} width={p} height={p} fill={fill} />
        </>
      )}

      {/* Working gear icon */}
      {state === 'working' && (
        <text x={p * 6} y={p * 4 + 4} fontSize="8" fill="#F5F0E8" opacity={0.7}>⚙</text>
      )}

      {/* Celebrating sparkle */}
      {state === 'celebrating' && (
        <text x={p * 6} y={p} fontSize="8" fill="#FFD700">✨</text>
      )}

      {/* New wave */}
      {state === 'new' && (
        <text x={p * 6} y={p} fontSize="8" fill="#F5F0E8">👋</text>
      )}

      {/* Thinking dots */}
      {state === 'thinking' && (
        <text x={p * 6} y={p * 3} fontSize="6" fill="#F5F0E8" opacity={0.5}>...</text>
      )}
    </svg>
  )
}
