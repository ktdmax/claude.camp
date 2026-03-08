'use client'

export type CiciState = 'idle' | 'working' | 'celebrating' | 'thinking' | 'new'

interface CiciProps {
  state?: CiciState
  size?: number
  style?: React.CSSProperties
}

// 9x11 pixel grid, 5px per pixel = 45x55 viewBox
// Distinct from Super Meat Boy: pointed head, neck, narrower body, visible feet

export function Cici({ state = 'idle', size = 45, style }: CiciProps) {
  const scale = size / 45
  const p = 5
  const f = '#E8572A'   // fill
  const d = '#1A1A2E'   // dark (eyes, mouth)
  const h = '#FF7B4A'   // highlight (lighter orange for details)
  const isHappy = state === 'celebrating' || state === 'new'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 45 55"
      width={45 * scale}
      height={55 * scale}
      className={`cici ${state}`}
      style={style}
      shapeRendering="crispEdges"
    >
      {/* Row 0: flame tip — single pixel, gives pointy silhouette */}
      <rect x={p * 4} y={0} width={p} height={p} fill={h} />

      {/* Row 1: head top */}
      <rect x={p * 2} y={p} width={p} height={p} fill={f} />
      <rect x={p * 3} y={p} width={p} height={p} fill={f} />
      <rect x={p * 4} y={p} width={p} height={p} fill={f} />
      <rect x={p * 5} y={p} width={p} height={p} fill={f} />
      <rect x={p * 6} y={p} width={p} height={p} fill={f} />

      {/* Row 2: head with eyes — wider */}
      <rect x={p * 1} y={p * 2} width={p} height={p} fill={f} />
      <rect x={p * 2} y={p * 2} width={p} height={p} fill={f} />
      <rect x={p * 3} y={p * 2} width={p} height={p} fill={isHappy ? h : d} />
      <rect x={p * 4} y={p * 2} width={p} height={p} fill={f} />
      <rect x={p * 5} y={p * 2} width={p} height={p} fill={isHappy ? h : d} />
      <rect x={p * 6} y={p * 2} width={p} height={p} fill={f} />
      <rect x={p * 7} y={p * 2} width={p} height={p} fill={f} />

      {/* Row 3: mouth area */}
      <rect x={p * 2} y={p * 3} width={p} height={p} fill={f} />
      <rect x={p * 3} y={p * 3} width={p} height={p} fill={f} />
      <rect x={p * 4} y={p * 3} width={p} height={p} fill={isHappy ? d : f} />
      <rect x={p * 5} y={p * 3} width={p} height={p} fill={f} />
      <rect x={p * 6} y={p * 3} width={p} height={p} fill={f} />
      {/* Smile: tiny mouth pixels */}
      {isHappy && (
        <>
          <rect x={p * 3} y={p * 3} width={p} height={p} fill={d} opacity={0.3} />
          <rect x={p * 5} y={p * 3} width={p} height={p} fill={d} opacity={0.3} />
        </>
      )}

      {/* Row 4: chin — narrower = neck implied */}
      <rect x={p * 3} y={p * 4} width={p} height={p} fill={f} />
      <rect x={p * 4} y={p * 4} width={p} height={p} fill={f} />
      <rect x={p * 5} y={p * 4} width={p} height={p} fill={f} />

      {/* Row 5: shoulders */}
      <rect x={p * 2} y={p * 5} width={p} height={p} fill={f} />
      <rect x={p * 3} y={p * 5} width={p} height={p} fill={f} />
      <rect x={p * 4} y={p * 5} width={p} height={p} fill={f} />
      <rect x={p * 5} y={p * 5} width={p} height={p} fill={f} />
      <rect x={p * 6} y={p * 5} width={p} height={p} fill={f} />

      {/* Row 6: torso */}
      <rect x={p * 2} y={p * 6} width={p} height={p} fill={f} />
      <rect x={p * 3} y={p * 6} width={p} height={p} fill={f} />
      <rect x={p * 4} y={p * 6} width={p} height={p} fill={h} />
      <rect x={p * 5} y={p * 6} width={p} height={p} fill={f} />
      <rect x={p * 6} y={p * 6} width={p} height={p} fill={f} />

      {/* Row 7: hips */}
      <rect x={p * 3} y={p * 7} width={p} height={p} fill={f} />
      <rect x={p * 4} y={p * 7} width={p} height={p} fill={f} />
      <rect x={p * 5} y={p * 7} width={p} height={p} fill={f} />

      {/* Row 8-9: legs + feet */}
      {state === 'working' ? (
        <>
          <rect x={p * 2} y={p * 8} width={p} height={p} fill={f} />
          <rect x={p * 6} y={p * 8} width={p} height={p} fill={f} />
          <rect x={p * 1} y={p * 9} width={p} height={p} fill={f} />
          <rect x={p * 7} y={p * 9} width={p} height={p} fill={f} />
        </>
      ) : (
        <>
          <rect x={p * 3} y={p * 8} width={p} height={p} fill={f} />
          <rect x={p * 5} y={p * 8} width={p} height={p} fill={f} />
          <rect x={p * 2} y={p * 9} width={p} height={p} fill={f} />
          <rect x={p * 6} y={p * 9} width={p} height={p} fill={f} />
        </>
      )}

      {/* State indicators */}
      {state === 'working' && (
        <rect x={p * 8} y={p * 4} width={p} height={p} fill={h} opacity={0.6} />
      )}
      {state === 'celebrating' && (
        <>
          <rect x={p * 0} y={p * 0} width={p} height={p} fill="#FFD700" opacity={0.8} />
          <rect x={p * 8} y={p * 1} width={p} height={p} fill="#FFD700" opacity={0.6} />
        </>
      )}
      {state === 'new' && (
        <>
          <rect x={p * 8} y={p * 2} width={p} height={p} fill={h} opacity={0.8} />
          <rect x={p * 8} y={p * 3} width={p} height={p} fill={h} opacity={0.5} />
        </>
      )}
      {state === 'thinking' && (
        <>
          <rect x={p * 7} y={p * 1} width={p} height={p} fill={h} opacity={0.4} />
          <rect x={p * 8} y={p * 0} width={p} height={p} fill={h} opacity={0.3} />
        </>
      )}
    </svg>
  )
}
