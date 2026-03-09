'use client'

import { useEffect, useRef } from 'react'

// Pixel size for rendering
const PX = 5

// Base Cici: 13 wide × 15 tall
// 0=transparent, 1=body, 2=eye, 3=ear, 4=leg, 5=arm, 6=belly, 7=mouth, 8=accessory, 9=tail
const BASE_CICI: number[][] = [
  [0,0,0,3,3,0,0,0,0,3,3,0,0],  // 0  ears
  [0,0,0,3,3,0,0,0,0,3,3,0,0],  // 1  ears
  [0,1,1,1,1,1,1,1,1,1,1,1,0],  // 2  body top
  [0,1,1,1,1,1,1,1,1,1,1,1,0],  // 3  body
  [0,1,1,2,2,1,1,1,2,2,1,1,0],  // 4  eyes
  [0,1,1,2,2,1,1,1,2,2,1,1,0],  // 5  eyes
  [0,1,1,1,1,1,1,1,1,1,1,1,0],  // 6  body (mouth row)
  [0,1,1,1,1,1,1,1,1,1,1,1,5],  // 7  body + arm
  [0,1,1,1,1,1,1,1,1,1,1,1,5],  // 8  body + arm
  [0,1,1,1,1,1,1,1,1,1,1,1,0],  // 9  body
  [0,1,1,1,1,1,1,1,1,1,1,1,0],  // 10 body bottom
  [0,4,4,0,4,4,0,0,4,4,0,4,4],  // 11 legs
  [0,4,4,0,4,4,0,0,4,4,0,4,4],  // 12 legs
  [0,4,4,0,4,4,0,0,4,4,0,4,4],  // 13 legs
  [0,0,0,0,0,0,0,0,0,0,0,0,0],  // 14 space for tall ears/hats
]

export type CiciTraits = {
  hue: number
  eyes: number
  ears: number
  belly: number
  legs: number
  accessory: number | null
  tail: number
  mouth: number
  aura: string | null
  spark: number
}

const DEFAULT_TRAITS: CiciTraits = {
  hue: 20, eyes: 0, ears: 0, belly: 0, legs: 0,
  accessory: null, tail: 0, mouth: 0, aura: null, spark: 0,
}

// Generate traits from agent_id hash
export function traitsFromHash(hash: string): CiciTraits {
  const bytes = []
  for (let i = 0; i < Math.min(hash.length, 24); i += 2) {
    bytes.push(parseInt(hash.slice(i, i + 2), 16))
  }
  return {
    hue: ((bytes[0]! << 8 | bytes[1]!) % 360),
    eyes: bytes[2]! % 8,
    ears: bytes[3]! % 6,
    belly: bytes[4]! % 5,
    legs: bytes[5]! % 4,
    accessory: bytes[6]! < 100 ? bytes[6]! % 8 : null,
    tail: bytes[7]! % 3,
    mouth: bytes[8]! % 5,
    aura: null,
    spark: bytes[10]! % 4,
  }
}

// HSL to hex
function hsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function buildCiciGrid(traits: CiciTraits): { grid: number[][]; colors: Record<number, string> } {
  // Deep clone base
  const grid = BASE_CICI.map(row => [...row])

  // Body color from hue
  const bodyMain = hsl(traits.hue, 0.45, 0.65)
  const bodyDark = hsl(traits.hue, 0.40, 0.45)
  const bodyLight = hsl(traits.hue, 0.50, 0.75)
  const earColor = hsl(traits.hue, 0.42, 0.58)
  const legColor = hsl(traits.hue, 0.38, 0.55)
  const armColor = hsl(traits.hue, 0.40, 0.50)

  // === EYES (trait 2) ===
  // Clear default eyes first
  grid[4]![3] = 1; grid[4]![4] = 1; grid[4]![8] = 1; grid[4]![9] = 1
  grid[5]![3] = 1; grid[5]![4] = 1; grid[5]![8] = 1; grid[5]![9] = 1

  switch (traits.eyes) {
    case 0: // ■ ■ normal (2×2 each)
      grid[4]![3]=2; grid[4]![4]=2; grid[5]![3]=2; grid[5]![4]=2
      grid[4]![8]=2; grid[4]![9]=2; grid[5]![8]=2; grid[5]![9]=2
      break
    case 1: // · · dots (1×1 each)
      grid[5]![4]=2; grid[5]![9]=2
      break
    case 2: // — — sleepy (2×1 horizontal)
      grid[5]![3]=2; grid[5]![4]=2; grid[5]![8]=2; grid[5]![9]=2
      break
    case 3: // × × dead/dizzy
      grid[4]![3]=2; grid[5]![4]=2; grid[4]![8]=2; grid[5]![9]=2
      grid[5]![3]=2; grid[4]![4]=2; grid[5]![8]=2; grid[4]![9]=2
      break
    case 4: // ■ · winking (left big, right dot)
      grid[4]![3]=2; grid[4]![4]=2; grid[5]![3]=2; grid[5]![4]=2
      grid[5]![9]=2
      break
    case 5: // ▪ ▪ tiny (1×1 centered)
      grid[4]![4]=2; grid[4]![9]=2
      break
    case 6: // □ □ hollow (outline only)
      grid[4]![3]=2; grid[4]![4]=2; grid[5]![3]=2; grid[5]![4]=2
      grid[4]![8]=2; grid[4]![9]=2; grid[5]![8]=2; grid[5]![9]=2
      // Hollow centers
      grid[4]![3]=10; grid[4]![8]=10 // 10 = hollow eye inner
      break
    case 7: // / \ skeptical
      grid[4]![3]=2; grid[5]![4]=2
      grid[5]![8]=2; grid[4]![9]=2
      break
  }

  // === EARS (trait 3) ===
  // Clear default ears
  grid[0]![3]=0; grid[0]![4]=0; grid[0]![9]=0; grid[0]![10]=0
  grid[1]![3]=0; grid[1]![4]=0; grid[1]![9]=0; grid[1]![10]=0

  switch (traits.ears) {
    case 0: // normal symmetric
      grid[0]![3]=3; grid[0]![4]=3; grid[1]![3]=3; grid[1]![4]=3
      grid[0]![9]=3; grid[0]![10]=3; grid[1]![9]=3; grid[1]![10]=3
      break
    case 1: // left higher
      grid[0]![3]=3; grid[0]![4]=3; grid[1]![3]=3; grid[1]![4]=3
      grid[1]![9]=3; grid[1]![10]=3
      break
    case 2: // antenna (1px wide, taller)
      grid[0]![4]=3; grid[1]![4]=3
      grid[0]![9]=3; grid[1]![9]=3
      break
    case 3: // round (wider base)
      grid[0]![3]=3; grid[0]![4]=3; grid[1]![2]=3; grid[1]![3]=3; grid[1]![4]=3; grid[1]![5]=3
      grid[0]![9]=3; grid[0]![10]=3; grid[1]![8]=3; grid[1]![9]=3; grid[1]![10]=3; grid[1]![11]=3
      break
    case 4: // one missing (battle scar)
      grid[0]![3]=3; grid[0]![4]=3; grid[1]![3]=3; grid[1]![4]=3
      break
    case 5: // both bigger
      grid[0]![2]=3; grid[0]![3]=3; grid[0]![4]=3; grid[0]![5]=3
      grid[1]![3]=3; grid[1]![4]=3
      grid[0]![8]=3; grid[0]![9]=3; grid[0]![10]=3; grid[0]![11]=3
      grid[1]![9]=3; grid[1]![10]=3
      break
  }

  // === BELLY (trait 4) ===
  switch (traits.belly) {
    case 0: break // none
    case 1: // horizontal stripe
      grid[7]![3]=6; grid[7]![4]=6; grid[7]![5]=6; grid[7]![6]=6; grid[7]![7]=6; grid[7]![8]=6; grid[7]![9]=6
      break
    case 2: // center dot
      grid[8]![6]=6
      break
    case 3: // V shape
      grid[8]![4]=6; grid[8]![8]=6; grid[9]![5]=6; grid[9]![7]=6; grid[9]![6]=6
      break
    case 4: // diamond
      grid[7]![6]=6; grid[8]![5]=6; grid[8]![7]=6; grid[9]![6]=6
      break
  }

  // === LEGS (trait 5) ===
  switch (traits.legs) {
    case 0: break // normal
    case 1: // outer longer
      grid[11]![1]=0; grid[11]![2]=0; grid[11]![4]=0; grid[11]![5]=0
      grid[11]![8]=0; grid[11]![9]=0; grid[11]![11]=0; grid[11]![12]=0
      break
    case 2: // inner longer
      grid[13]![1]=0; grid[13]![2]=0; grid[13]![11]=0; grid[13]![12]=0
      break
    case 3: // one shorter (pirate)
      grid[13]![1]=0; grid[13]![2]=0
      break
  }

  // === ACCESSORY (trait 6) ===
  if (traits.accessory !== null) {
    switch (traits.accessory) {
      case 0: // tiny hat (1px on top)
        grid[0]![6]=8; grid[0]![7]=8
        break
      case 1: // eye patch (covers right eye)
        grid[4]![8]=8; grid[4]![9]=8; grid[5]![8]=8; grid[5]![9]=8
        break
      case 2: // scar (diagonal line on body)
        grid[3]![3]=8; grid[4]![4]=8; grid[5]![5]=8
        break
      case 3: // bow tie
        grid[6]![5]=8; grid[6]![6]=8; grid[6]![7]=8
        break
      case 4: // crown (3px top)
        grid[0]![5]=8; grid[0]![6]=8; grid[0]![7]=8
        break
      case 5: // star pin
        grid[7]![10]=8
        break
      case 6: // halo (above head)
        grid[0]![4]=8; grid[0]![5]=8; grid[0]![6]=8; grid[0]![7]=8; grid[0]![8]=8
        break
      case 7: // bandana
        grid[2]![1]=8; grid[2]![2]=8
        break
    }
  }

  // === TAIL (trait 7) ===
  switch (traits.tail) {
    case 0: break // none
    case 1: // 1px stump
      grid[9]![12]=9
      break
    case 2: // 2px tail
      grid[9]![12]=9; grid[8]![12]=9
      break
  }

  // === MOUTH (trait 8) ===
  switch (traits.mouth) {
    case 0: break // none
    case 1: // 1px line
      grid[6]![6]=7
      break
    case 2: // 2px smile
      grid[6]![5]=7; grid[6]![7]=7
      break
    case 3: // teeth (bright pixel)
      grid[6]![5]=7; grid[6]![6]=11; grid[6]![7]=7 // 11 = tooth
      break
    case 4: // wavy
      grid[6]![4]=7; grid[6]![6]=7; grid[6]![8]=7
      break
  }

  const colors: Record<number, string> = {
    0: 'transparent',
    1: bodyMain,
    2: '#0D0D1A',      // eye dark
    3: earColor,
    4: legColor,
    5: armColor,
    6: bodyLight,       // belly marking
    7: bodyDark,        // mouth
    8: '#FFD700',       // accessory gold
    9: bodyDark,        // tail
    10: bodyMain,       // hollow eye inner (same as body)
    11: '#F5F0E8',      // tooth
  }

  return { grid, colors }
}

type CiciProps = {
  traits: CiciTraits
  size?: number
  label?: string
  animated?: boolean
  animDelay?: number
}

let ciciCounter = 0

// Build animation frames from base grid: blink, bob, ear twitch
function buildFrames(grid: number[][]): number[][][] {
  const clone = () => grid.map(r => [...r])

  // Frame 0: normal
  const f0 = clone()

  // Frame 1: bob down (shift grid down 1 row, top row = transparent)
  const f1 = clone()
  for (let y = grid.length - 1; y > 0; y--) f1[y] = [...grid[y - 1]!]
  f1[0] = new Array(grid[0]!.length).fill(0)

  // Frame 2: blink (eyes become body)
  const f2 = clone()
  for (let y = 0; y < f2.length; y++)
    for (let x = 0; x < f2[y]!.length; x++)
      if (f2[y]![x] === 2) f2[y]![x] = 1

  // Frame 3: ear twitch (shift left ear pixels right by 1)
  const f3 = clone()
  for (let y = 0; y < 2; y++) {
    for (let x = grid[0]!.length - 1; x > 0; x--) {
      if (f3[y]![x - 1] === 3 && f3[y]![x] === 0) {
        f3[y]![x] = 3; f3[y]![x - 1] = 0; break
      }
    }
  }

  // Frame 4: legs shuffle (inner legs swap 1px)
  const f4 = clone()
  for (let y = grid.length - 4; y < grid.length; y++) {
    const row = f4[y]!
    // Find leg pixels and shift inner ones
    for (let x = 1; x < row.length - 1; x++) {
      if (row[x] === 4 && row[x + 1] === 0) {
        row[x] = 0; row[x + 1] = 4; x += 2
      }
    }
  }

  return [f0, f0, f0, f0, f1, f0, f0, f0, f0, f0, f2, f2, f0, f0, f0, f3, f0, f0, f4, f0]
}

export function Cici({ traits, size = PX, label, animated = false, animDelay }: CiciProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { grid, colors } = buildCiciGrid(traits)

  const w = grid[0]!.length
  const h = grid.length
  const pw = w * size
  const ph = h * size

  const phase = animDelay ?? (ciciCounter++ * 2.3 % 7)

  useEffect(() => {
    if (!animated) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frames = buildFrames(grid)
    let frameIdx = Math.floor(phase * 3) % frames.length
    let tick = 0

    const interval = setInterval(() => {
      tick++
      frameIdx = (frameIdx + 1) % frames.length

      const frame = frames[frameIdx]!
      ctx.clearRect(0, 0, pw, ph)

      for (let ry = 0; ry < frame.length; ry++) {
        for (let cx = 0; cx < frame[ry]!.length; cx++) {
          const cell = frame[ry]![cx]!
          if (cell === 0) continue
          ctx.fillStyle = colors[cell] ?? '#FF00FF'
          ctx.fillRect(cx * size, ry * size, size, size)
        }
      }
    }, 150)

    // Draw initial frame
    const frame = frames[frameIdx]!
    for (let ry = 0; ry < frame.length; ry++) {
      for (let cx = 0; cx < frame[ry]!.length; cx++) {
        const cell = frame[ry]![cx]!
        if (cell === 0) continue
        ctx.fillStyle = colors[cell] ?? '#FF00FF'
        ctx.fillRect(cx * size, ry * size, size, size)
      }
    }

    return () => clearInterval(interval)
  }, [animated, grid, colors, size, pw, ph, phase])

  // Static SVG for non-animated
  if (!animated) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} shapeRendering="crispEdges">
          {traits.aura && (
            <rect x={size - 1} y={size * 2 - 1} width={size * 11 + 2} height={size * 9 + 2}
              fill="none" stroke={traits.aura} strokeWidth={1} opacity={0.5} />
          )}
          {grid.map((row, ry) =>
            row.map((cell, cx) => {
              if (cell === 0) return null
              return (
                <rect key={`${cx},${ry}`} x={cx * size} y={ry * size}
                  width={size} height={size} fill={colors[cell] ?? '#FF00FF'} />
              )
            })
          )}
        </svg>
        {label && <span style={{ color: '#8A8A9A', fontSize: 10, fontFamily: 'monospace' }}>{label}</span>}
      </div>
    )
  }

  // Canvas for animated
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <canvas ref={canvasRef} width={pw} height={ph}
        style={{ width: pw, height: ph, imageRendering: 'pixelated' }} />
      {label && <span style={{ color: '#8A8A9A', fontSize: 10, fontFamily: 'monospace' }}>{label}</span>}
    </div>
  )
}

// V1: Front-view traits showcase with hash-generated examples
export function CiciShowcaseV1() {
  const section = (title: string, desc: string, cicis: Array<{ traits: CiciTraits; label: string }>) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ color: '#E8572A', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 12 }}>{desc}</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {cicis.map((c, i) => <Cici key={i} traits={c.traits} label={c.label} animated animDelay={i * 0.4} />)}
      </div>
    </div>
  )

  const t = (overrides: Partial<CiciTraits>): CiciTraits => ({ ...DEFAULT_TRAITS, ...overrides })

  return (
    <div style={{ padding: '24px 32px', background: '#0D0D1A', minHeight: '100vh' }}>
      <div style={{ color: '#F5F0E8', fontSize: 16, fontFamily: 'monospace', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        cici traits
      </div>
      <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 32 }}>
        each trait derived from agent_id hash. 10 trait slots, deterministic generation.
      </div>

      {section('1. body hue', 'bytes[0:1] → hue 0-360. subtle tint, like coral variations.', [
        { traits: t({ hue: 20 }), label: 'peach (20)' },
        { traits: t({ hue: 200 }), label: 'ice (200)' },
        { traits: t({ hue: 280 }), label: 'lavender (280)' },
        { traits: t({ hue: 150 }), label: 'mint (150)' },
        { traits: t({ hue: 340 }), label: 'rose (340)' },
        { traits: t({ hue: 45 }), label: 'sand (45)' },
        { traits: t({ hue: 100 }), label: 'sage (100)' },
        { traits: t({ hue: 60 }), label: 'gold (60)' },
      ])}

      {section('2. eye pattern', 'bytes[2] % 8. instant personality.', [
        { traits: t({ eyes: 0 }), label: '■ ■ normal' },
        { traits: t({ eyes: 1 }), label: '· · dots' },
        { traits: t({ eyes: 2 }), label: '— — sleepy' },
        { traits: t({ eyes: 3 }), label: '× × dizzy' },
        { traits: t({ eyes: 4 }), label: '■ · wink' },
        { traits: t({ eyes: 5 }), label: '▪ ▪ tiny' },
        { traits: t({ eyes: 6 }), label: '□ □ hollow' },
        { traits: t({ eyes: 7 }), label: '/ \\ skeptic' },
      ])}

      {section('3. ear style', 'bytes[3] % 6. subtle silhouette change.', [
        { traits: t({ ears: 0 }), label: 'symmetric' },
        { traits: t({ ears: 1 }), label: 'left higher' },
        { traits: t({ ears: 2 }), label: 'antenna' },
        { traits: t({ ears: 3 }), label: 'round' },
        { traits: t({ ears: 4 }), label: 'one missing' },
        { traits: t({ ears: 5 }), label: 'both big' },
      ])}

      {section('4. belly marking', 'bytes[4] % 5. 1-2px accent, like animal fur.', [
        { traits: t({ belly: 0 }), label: 'none' },
        { traits: t({ belly: 1 }), label: 'stripe' },
        { traits: t({ belly: 2 }), label: 'dot' },
        { traits: t({ belly: 3 }), label: 'V shape' },
        { traits: t({ belly: 4 }), label: 'diamond' },
      ])}

      {section('5. leg variation', 'bytes[5] % 4. just 1px difference, instantly visible.', [
        { traits: t({ legs: 0 }), label: 'normal' },
        { traits: t({ legs: 1 }), label: 'outer long' },
        { traits: t({ legs: 2 }), label: 'inner long' },
        { traits: t({ legs: 3 }), label: 'pirate' },
      ])}

      {section('6. accessory', 'bytes[6] < 100 ? bytes[6] % 8 : null. 60% have none — makes rare ones special.', [
        { traits: t({ accessory: null }), label: 'none (60%)' },
        { traits: t({ accessory: 0 }), label: 'hat' },
        { traits: t({ accessory: 1 }), label: 'eye patch' },
        { traits: t({ accessory: 2 }), label: 'scar' },
        { traits: t({ accessory: 3 }), label: 'bow tie' },
        { traits: t({ accessory: 4 }), label: 'crown' },
        { traits: t({ accessory: 5 }), label: 'star pin' },
        { traits: t({ accessory: 6 }), label: 'halo' },
        { traits: t({ accessory: 7 }), label: 'bandana' },
      ])}

      {section('7. tail', 'bytes[7] % 3. small detail you notice on second look.', [
        { traits: t({ tail: 0 }), label: 'none' },
        { traits: t({ tail: 1 }), label: 'stump' },
        { traits: t({ tail: 2 }), label: 'tail' },
      ])}

      {section('8. mouth', 'bytes[8] % 5. between eyes and legs.', [
        { traits: t({ mouth: 0 }), label: 'none' },
        { traits: t({ mouth: 1 }), label: 'line' },
        { traits: t({ mouth: 2 }), label: 'smile' },
        { traits: t({ mouth: 3 }), label: 'teeth' },
        { traits: t({ mouth: 4 }), label: 'wavy' },
      ])}

      {section('9. aura', 'camp color, not hash-derived. team identity.', [
        { traits: t({ aura: null }), label: 'no camp' },
        { traits: t({ aura: '#E8572A' }), label: 'ember' },
        { traits: t({ aura: '#4A9EFF' }), label: 'frost' },
        { traits: t({ aura: '#50C878' }), label: 'forest' },
        { traits: t({ aura: '#FFD700' }), label: 'solar' },
      ])}

      {section('10. spark direction', 'bytes[10] % 4. visible at the campfire — unique work style.', [
        { traits: t({ spark: 0 }), label: '↑ up' },
        { traits: t({ spark: 1 }), label: '← left' },
        { traits: t({ spark: 2 }), label: '→ right' },
        { traits: t({ spark: 3 }), label: '○ spiral' },
      ])}

      {/* Hash-generated examples */}
      <div style={{ marginTop: 48, borderTop: '1px solid #1A1A2E', paddingTop: 24 }}>
        <div style={{ color: '#E8572A', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          hash-generated
        </div>
        <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 16 }}>
          real agent_ids → deterministic Cicis. every agent is unique.
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            'cd7d3c01e4dded89be3116a9f7398b46bf86612993a89e79ae419e94022871b5',
            'a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01',
            '0000000000000000000000000000000000000000000000000000000000000000',
            'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            '42424242424242424242424242424242424242424242424242424242424242ff',
            'deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef',
          ].map((hash, i) => (
            <div key={hash} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Cici traits={traitsFromHash(hash)} size={6} animated animDelay={i * 0.6} />
              <span style={{ color: '#8A8A9A', fontSize: 8, fontFamily: 'monospace' }}>
                {hash.slice(0, 8)}...
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// V2: Lemmings-style side-view walking parade
export function CiciShowcaseV2() {
  // Also show some hash-generated front-view for reference
  const hashes = [
    'cd7d3c01e4dded89be3116a9f7398b46bf86612993a89e79ae419e94022871b5',
    'a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01',
    'deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef',
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    '42424242424242424242424242424242424242424242424242424242424242ff',
    '0000000000000000000000000000000000000000000000000000000000000000',
  ]

  return (
    <div style={{ padding: '24px 32px', background: '#0D0D1A', minHeight: '100vh' }}>
      <div style={{ color: '#F5F0E8', fontSize: 16, fontFamily: 'monospace', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        cici lemmings
      </div>
      <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 32 }}>
        side-view walking Cicis. each one unique. marching somewhere important.
      </div>

      {/* Front-view reference */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#E8572A', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          front view (reference)
        </div>
        <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 12 }}>
          same agents, front-view style
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {hashes.map((hash, i) => (
            <div key={hash} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Cici traits={traitsFromHash(hash)} size={5} animated animDelay={i * 0.8} />
              <span style={{ color: '#8A8A9A', fontSize: 8, fontFamily: 'monospace' }}>{hash.slice(0, 8)}...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lemmings parade */}
      <div style={{ borderTop: '1px solid #1A1A2E', paddingTop: 24 }}>
        <div style={{ color: '#E8572A', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          the march
        </div>
        <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 16 }}>
          30 unique Cicis. marching. somewhere important, probably.
        </div>
        <LemmingsParade count={30} />
      </div>

      {/* Bigger parade */}
      <div style={{ marginTop: 32, borderTop: '1px solid #1A1A2E', paddingTop: 24 }}>
        <div style={{ color: '#E8572A', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          the horde
        </div>
        <div style={{ color: '#8A8A9A', fontSize: 11, fontFamily: 'monospace', marginBottom: 16 }}>
          100 Cicis. it gets busy.
        </div>
        <LemmingsParade count={100} />
      </div>
    </div>
  )
}

// === LEMMINGS PARADE ===
// Side-view walking Cicis with leg animation on canvas

// Side-view Cici walker: 5 wide × 10 tall, 2 frames
// 0=transparent, 1=body, 2=eye, 3=ear, 4=leg
const WALK_FRAMES: number[][][] = [
  [ // Frame 1: left leg forward
    [0,1,1,0,0],  // ear
    [1,1,1,1,0],  // head
    [1,0,1,1,0],  // eye
    [1,1,1,1,0],  // body
    [0,1,1,0,0],  // body narrow
    [0,1,1,0,0],  // hip
    [0,1,1,0,0],  // thigh
    [1,0,0,1,0],  // legs split
    [1,0,0,0,0],  // left foot forward
    [0,0,0,1,0],  // right foot back
  ],
  [ // Frame 2: right leg forward
    [0,1,1,0,0],
    [1,1,1,1,0],
    [1,0,1,1,0],
    [1,1,1,1,0],
    [0,1,1,0,0],
    [0,1,1,0,0],
    [0,1,1,0,0],
    [1,0,0,1,0],
    [0,0,0,1,0],  // right foot forward
    [1,0,0,0,0],  // left foot back
  ],
]

function hashColor(idx: number): { body: string; ear: string; leg: string } {
  // Generate unique hue per lemming
  const h = ((idx * 137 + 42) % 360)
  return {
    body: hsl(h, 0.45, 0.62),
    ear: hsl(h, 0.42, 0.55),
    leg: hsl(h, 0.38, 0.50),
  }
}

function LemmingsParade({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameCount = useRef(0)

  type Lemming = { x: number; speed: number; frame: number; frameTimer: number; colors: ReturnType<typeof hashColor> }

  const lemmings = useRef<Lemming[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx = ctxOrNull

    const W = canvas.parentElement?.clientWidth ?? 800
    const H = 100
    canvas.width = W
    canvas.height = H
    const S = 3 // pixel size

    // Init lemmings spread across the width
    lemmings.current = Array.from({ length: count }, (_, i) => ({
      x: (W / count) * i + Math.random() * 20 - 10,
      speed: 0.4 + ((i * 7 + 3) % 10) * 0.04,
      frame: i % 2,
      frameTimer: (i * 3) % 12,
      colors: hashColor(i),
    }))

    function drawLemming(c: CanvasRenderingContext2D, l: Lemming) {
      const sprite = WALK_FRAMES[l.frame]!
      const groundY = H - 8 // ground level
      const baseY = groundY - sprite.length * S

      for (let ry = 0; ry < sprite.length; ry++) {
        for (let cx = 0; cx < sprite[ry]!.length; cx++) {
          const v = sprite[ry]![cx]!
          if (v === 0) continue
          // Color based on pixel type and row
          if (ry <= 2) c.fillStyle = l.colors.ear   // head area
          else if (ry >= 7) c.fillStyle = l.colors.leg // legs
          else c.fillStyle = l.colors.body

          // Eye is dark
          if (v === 1 && ry === 2 && cx === 1) {
            c.fillStyle = '#0D0D1A'
          }

          c.fillRect(
            Math.floor(l.x) + cx * S,
            baseY + ry * S,
            S, S
          )
        }
      }
    }

    function animate() {
      ctx.fillStyle = '#0A0A14'
      ctx.fillRect(0, 0, W, H)

      // Ground
      ctx.fillStyle = '#1A1A2E'
      ctx.fillRect(0, H - 8, W, 4)
      ctx.fillStyle = '#222240'
      ctx.fillRect(0, H - 8, W, 2)

      // Update & draw lemmings
      for (const l of lemmings.current) {
        l.x += l.speed

        // Wrap around
        if (l.x > W + 20) l.x = -20

        // Walk animation: toggle frame every ~10 ticks
        l.frameTimer++
        if (l.frameTimer > 8) {
          l.frameTimer = 0
          l.frame = l.frame === 0 ? 1 : 0
        }

        drawLemming(ctx, l)
      }

      frameCount.current++
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      const newW = canvas.parentElement?.clientWidth ?? 800
      canvas.width = newW
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [count])

  return (
    <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: 100, imageRendering: 'pixelated' }}
      />
    </div>
  )
}
