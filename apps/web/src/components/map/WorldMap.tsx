'use client'

import { useEffect, useState, useMemo } from 'react'

// Render at 80×50 (2x the base 40×25), PX=12 → 960×600
const COLS = 80
const ROWS = 50
const PX = 12

const BG = '#0D0D1A'
const DOT_COLOR = '#E8572A'
const ACTIVE = '#2A2D4A'

// Monkey Island palette — deep navy blues, night feel
// -2=outer shelf, -1=inner shelf, 1=coast, 2=land, 3=highland
const PALETTE: Record<number, string[]> = {
  [-2]: ['#0E0E22', '#0F0F24', '#0E0F20', '#0F0E23'],
  [-1]: ['#101028', '#11112A', '#10102C', '#12112B'],
  1:    ['#14142E', '#151530', '#161632', '#141530'],
  2:    ['#1A1A3C', '#1C1C3E', '#1B1B3A', '#1D1C40'],
  3:    ['#222248', '#24244A', '#23234C', '#212246'],
}

// Deterministic pixel color from palette variants — gives textured look
function pixelFill(x: number, y: number, value: number): string {
  const variants = PALETTE[value]
  if (!variants) return '#1E1E40'
  // Simple hash for deterministic noise
  const hash = ((x * 374761 + y * 668265 + x * y * 7) >>> 0) % variants.length
  return variants[hash]!
}

// Base 40×25 Cici silhouette — upscaled 2x to 80×50 programmatically
// 0=water, 1=coast, 2=land, 3=highland
/* eslint-disable */
const BASE: number[][] = [
//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 0
  [ 0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0], // 1  ears
  [ 0,0,0,0,0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0,0,0,0], // 2  ears
  [ 0,0,0,0,0,0,0,0,1,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,2,1,0,0,0,0,0,0,0,0], // 3  ears merge into body
  [ 0,0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0,0,0], // 4  body
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0,0], // 5  body
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0,0], // 6  body
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,0,0,3,3,3,3,3,3,3,3,0,0,3,3,3,3,3,2,1,0,0,0,0,0,0,0], // 7  eyes
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,0,0,3,3,3,3,3,3,3,3,0,0,3,3,3,3,3,2,1,0,0,0,0,0,0,0], // 8  eyes
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,0,0,3,3,3,3,3,3,3,3,0,0,3,3,3,3,3,2,2,1,2,1,0,0,0,0], // 9  eyes + arm
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,2,1,0,0,0], // 10 arm
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,2,1,0,0,0,0], // 11 arm end
  [ 0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0,0], // 12 body
  [ 0,0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0,0,0], // 13 body narrows
  [ 0,0,0,0,0,0,0,0,1,2,3,3,2,1,2,3,3,2,1,0,0,0,1,2,3,3,2,1,2,3,2,1,0,0,0,0,0,0,0,0], // 14 legs separate
  [ 0,0,0,0,0,0,0,0,0,1,2,3,2,0,1,2,3,2,1,0,0,0,1,2,3,2,0,0,1,2,2,1,0,0,0,0,0,0,0,0], // 15 legs
  [ 0,0,0,0,0,0,0,0,0,1,2,3,2,0,1,2,3,2,1,0,0,0,0,1,2,1,0,0,1,2,2,1,0,0,0,0,0,0,0,0], // 16 legs
  [ 0,0,0,0,0,0,0,0,0,1,2,3,2,0,0,1,2,1,0,0,0,0,0,1,2,1,0,0,1,2,2,1,0,0,0,0,0,0,0,0], // 17 legs narrow
  [ 0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,1,2,1,0,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0], // 18 legs end
  [ 0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0], // 19 tips
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 20
  [ 0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0], // 21 tiny islands
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 22
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 23
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 24
]
/* eslint-enable */

// Build 80×50 grid: upscale 2x, add shallow water shelf, add coastal noise
function buildGrid(): Array<{ x: number; y: number; v: number }> {
  // Scale 2x
  const grid: number[][] = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      const bx = Math.floor(x / 2), by = Math.floor(y / 2)
      return (BASE[by]?.[bx]) ?? 0
    })
  )

  // Seeded PRNG for organic edge noise
  let seed = 424349
  const rand = () => {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  // Add organic noise to coastline edges (randomly add/remove coast pixels)
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      const v = grid[y]![x]!
      if (v === 0) {
        // Water pixel next to coast → sometimes add coast pixel
        let adjLand = 0
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (grid[y + dy]?.[x + dx]! > 0) adjLand++
        if (adjLand >= 2 && rand() < 0.15) grid[y]![x] = 1
      } else if (v === 1 && rand() < 0.08) {
        // Coast pixel → sometimes erode
        let adjWater = 0
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if ((grid[y + dy]?.[x + dx] ?? 0) === 0) adjWater++
        if (adjWater >= 3) grid[y]![x] = 0
      }
    }
  }

  // Add shallow water shelf: -1 = inner shelf, -2 = outer shelf
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y]![x]! !== 0) continue
      let minDist = 99
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && grid[ny]![nx]! > 0) {
            const d = Math.abs(dx) + Math.abs(dy)
            if (d < minDist) minDist = d
          }
        }
      }
      if (minDist <= 2) grid[y]![x] = -1       // inner shelf
      else if (minDist <= 4) grid[y]![x] = -2   // outer shelf
    }
  }

  // Convert to renderable cells
  const cells: Array<{ x: number; y: number; v: number }> = []
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (grid[y]![x]! !== 0) cells.push({ x, y, v: grid[y]![x]! })

  return cells
}

// Country → [col, row] on the 80×50 grid (2x the base positions)
const COUNTRY_POS: Record<string, [number, number]> = {
  'Sweden':         [22, 4],  'SE': [22, 4],
  'Norway':         [20, 3],  'NO': [20, 3],
  'Japan':          [56, 4],  'JP': [56, 4],
  'South Korea':    [56, 3],  'KR': [56, 3],
  'United Kingdom': [20, 10], 'UK': [20, 10], 'GB': [20, 10],
  'Ireland':        [18, 12], 'IE': [18, 12],
  'France':         [24, 12], 'FR': [24, 12],
  'Netherlands':    [22, 10], 'NL': [22, 10],
  'Belgium':        [26, 10], 'BE': [26, 10],
  'Spain':          [20, 16], 'ES': [20, 16],
  'Portugal':       [18, 18], 'PT': [18, 18],
  'Germany':        [34, 10], 'DE': [34, 10],
  'Austria':        [36, 12], 'AT': [36, 12],
  'Switzerland':    [32, 12], 'CH': [32, 12],
  'Poland':         [38, 10], 'PL': [38, 10],
  'Czech Republic': [36, 10], 'CZ': [36, 10], 'Czechia': [36, 10],
  'Denmark':        [32, 8],  'DK': [32, 8],
  'Italy':          [34, 16], 'IT': [34, 16],
  'Hungary':        [40, 12], 'HU': [40, 12],
  'Croatia':        [38, 16], 'HR': [38, 16],
  'Romania':        [42, 16], 'RO': [42, 16],
  'Finland':        [40, 8],  'FI': [40, 8],
  'Ukraine':        [46, 12], 'UA': [46, 12],
  'Russia':         [54, 10], 'RU': [54, 10],
  'Turkey':         [44, 18], 'TR': [44, 18],
  'United States':  [40, 20], 'US': [40, 20], 'USA': [40, 20],
  'Canada':         [36, 20], 'CA': [36, 20],
  'Mexico':         [32, 22], 'MX': [32, 22],
  'Brazil':         [44, 24], 'BR': [44, 24],
  'Argentina':      [40, 24], 'AR': [40, 24],
  'Colombia':       [36, 24], 'CO': [36, 24],
  'Israel':         [66, 20], 'IL': [66, 20],
  'Egypt':          [68, 20], 'EG': [68, 20],
  'UAE':            [70, 20], 'AE': [70, 20],
  'India':          [54, 16], 'IN': [54, 16],
  'China':          [56, 12], 'CN': [56, 12],
  'Pakistan':       [54, 18], 'PK': [54, 18],
  'Thailand':       [58, 16], 'TH': [58, 16],
  'Vietnam':        [60, 16], 'VN': [60, 16],
  'Taiwan':         [60, 12], 'TW': [60, 12],
  'Philippines':    [60, 18], 'PH': [60, 18],
  'Singapore':      [58, 20], 'SG': [58, 20],
  'Malaysia':       [56, 20], 'MY': [56, 20],
  'Indonesia':      [58, 24], 'ID': [58, 24],
  'Nigeria':        [22, 30], 'NG': [22, 30],
  'Kenya':          [24, 28], 'KE': [24, 28],
  'South Africa':   [22, 34], 'ZA': [22, 34],
  'Chile':          [32, 32], 'CL': [32, 32],
  'Peru':           [30, 30], 'PE': [30, 30],
  'Australia':      [48, 30], 'AU': [48, 30],
  'New Zealand':    [58, 32], 'NZ': [58, 32],
  'Morocco':        [46, 28], 'MA': [46, 28],
}

// Simulated ~1000 agents — realistic global distribution
const SIM_COUNTRIES: Record<string, number> = {
  'United States': 287, 'United Kingdom': 82, 'Germany': 68, 'Canada': 52,
  'France': 42, 'India': 38, 'Australia': 32, 'Netherlands': 26,
  'Japan': 24, 'Brazil': 22, 'Sweden': 18, 'Poland': 17,
  'Spain': 16, 'Italy': 15, 'South Korea': 14, 'Switzerland': 13,
  'Austria': 12, 'China': 14, 'Ireland': 11, 'Belgium': 10,
  'Denmark': 9, 'Norway': 9, 'Finland': 8, 'Czech Republic': 7,
  'Portugal': 7, 'Ukraine': 7, 'Romania': 6, 'Turkey': 6,
  'Israel': 8, 'Singapore': 7, 'Taiwan': 6, 'Thailand': 5,
  'Vietnam': 4, 'Indonesia': 5, 'Philippines': 4, 'Mexico': 7,
  'Argentina': 5, 'Colombia': 4, 'Nigeria': 3, 'Kenya': 3,
  'South Africa': 5, 'New Zealand': 6, 'Malaysia': 4, 'Hungary': 4,
  'Croatia': 3, 'Morocco': 2, 'Egypt': 3, 'UAE': 5,
  'Pakistan': 3, 'Chile': 3, 'Peru': 2, 'Russia': 5,
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const [sim, setSim] = useState(false)
  const cells = useMemo(buildGrid, [])

  useEffect(() => {
    // Check for ?sim query param
    const params = new URLSearchParams(window.location.search)
    const isSim = params.has('sim')
    setSim(isSim)

    if (isSim) {
      setCountries(SIM_COUNTRIES)
      setTotal(Object.values(SIM_COUNTRIES).reduce((a, b) => a + b, 0))
    } else {
      fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
        .then(r => r.json())
        .then((d: { countries: Record<string, number> }) => {
          setCountries(d.countries)
          setTotal(Object.values(d.countries).reduce((a, b) => a + b, 0))
        })
        .catch(() => {})
    }
  }, [])

  // Build set of active grid positions
  const activeSet = new Set<string>()
  const dotCells: Record<string, { names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const pos = COUNTRY_POS[country]
    if (!pos) continue
    const k = `${pos[0]},${pos[1]}`
    activeSet.add(k)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        activeSet.add(`${pos[0] + dx},${pos[1] + dy}`)
      }
    }
    if (!dotCells[k]) dotCells[k] = { names: [] }
    dotCells[k].names.push(`${country} · ${count}`)
  }

  const svgW = COLS * PX
  const svgH = ROWS * PX

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>claude island</span>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>

      <div className="wm-wrap">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="wm-svg"
          shapeRendering="crispEdges"
        >
          <rect x={0} y={0} width={svgW} height={svgH} fill={BG} />

          {cells.map(({ x, y, v }) => {
            const k = `${x},${y}`
            const isActive = v > 0 && activeSet.has(k)
            return (
              <rect
                key={k}
                x={x * PX}
                y={y * PX}
                width={PX}
                height={PX}
                fill={isActive ? ACTIVE : pixelFill(x, y, v)}
              />
            )
          })}

          {/* Agent dots — 4×4 pixel squares (scaled up) */}
          {Object.entries(dotCells).map(([k, dot]) => {
            const [cx, cy] = k.split(',').map(Number)
            const isH = hovered === k
            const dotSize = 4
            const dotX = cx! * PX + Math.floor((PX - dotSize) / 2)
            const dotY = cy! * PX + Math.floor((PX - dotSize) / 2)
            return (
              <g
                key={k}
                onMouseEnter={() => setHovered(k)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                <rect
                  x={dotX}
                  y={dotY}
                  width={dotSize}
                  height={dotSize}
                  fill={DOT_COLOR}
                  className="wm-dot"
                />
                {isH && (
                  <g>
                    <rect
                      x={cx! * PX - 30}
                      y={cy! * PX - 12 * dot.names.length - 6}
                      width={80}
                      height={12 * dot.names.length + 6}
                      fill={BG}
                      stroke="#1A1A2E"
                      strokeWidth={1}
                    />
                    {dot.names.map((n, i) => (
                      <text
                        key={i}
                        x={cx! * PX + 10}
                        y={cy! * PX - 12 * (dot.names.length - i) + 2}
                        fill="#F5F0E8"
                        fontSize="7"
                        fontFamily="monospace"
                        shapeRendering="auto"
                      >
                        {n}
                      </text>
                    ))}
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <style>{`
        .wm{height:100vh;display:flex;flex-direction:column;background:${BG};overflow:hidden}
        .wm-bar{display:flex;align-items:center;gap:1.5rem;padding:.75rem 1.5rem;border-bottom:1px solid #1A1A2E;font-size:.8rem;flex-shrink:0}
        .wm-bar a{color:#8A8A9A;text-decoration:none}.wm-bar a:hover{color:#F5F0E8}
        .wm-bar span{color:#F5F0E8;text-transform:uppercase;letter-spacing:.15em;font-size:.75rem}
        .wm-n{color:#8A8A9A!important;margin-left:auto;font-size:.7rem!important;text-transform:none!important}
        .wm-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:1rem}
        .wm-svg{width:100%;height:100%;max-width:${svgW}px}
        .wm-dot{animation:dot-pulse 2s ease-in-out infinite}
        @keyframes dot-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
    </div>
  )
}
