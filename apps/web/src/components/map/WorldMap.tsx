'use client'

import { useEffect, useState, useMemo } from 'react'

const W = 200, H = 100, PX = 5

// Seeded PRNG
function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// 2D value noise with smooth interpolation
function generateNoise(w: number, h: number, rand: () => number): number[][] {
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(0))

  // Multiple octaves for natural-looking terrain
  const octaves = [
    { scale: 6, weight: 0.5 },
    { scale: 12, weight: 0.25 },
    { scale: 24, weight: 0.15 },
    { scale: 48, weight: 0.1 },
  ]

  for (const { scale, weight } of octaves) {
    const gw = Math.ceil(w / scale) + 2
    const gh = Math.ceil(h / scale) + 2
    const base: number[][] = Array.from({ length: gh }, () =>
      Array.from({ length: gw }, () => rand())
    )

    // Smooth interpolation
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const fx = x / scale
        const fy = y / scale
        const ix = Math.floor(fx)
        const iy = Math.floor(fy)
        const dx = fx - ix
        const dy = fy - iy
        // Smoothstep
        const sx = dx * dx * (3 - 2 * dx)
        const sy = dy * dy * (3 - 2 * dy)

        const v00 = base[iy]![ix]!
        const v10 = base[iy]![ix + 1]!
        const v01 = base[iy + 1]![ix]!
        const v11 = base[iy + 1]![ix + 1]!

        const v = v00 * (1 - sx) * (1 - sy) + v10 * sx * (1 - sy) +
                  v01 * (1 - sx) * sy + v11 * sx * sy

        grid[y]![x]! += v * weight
      }
    }
  }

  return grid
}

function generateMap(seed: number): { cells: Array<{ x: number; y: number; v: number }>; seed: number } {
  const rand = mulberry32(seed)
  const noise = generateNoise(W, H, rand)

  // Find threshold for ~30% land coverage
  const flat = noise.flatMap(r => r).sort((a, b) => a - b)
  const landThreshold = flat[Math.floor(flat.length * 0.70)]!
  const coastThreshold = flat[Math.floor(flat.length * 0.65)]!

  const cells: Array<{ x: number; y: number; v: number }> = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = noise[y]![x]!
      if (v >= landThreshold) cells.push({ x, y, v: 2 })
      else if (v >= coastThreshold) cells.push({ x, y, v: 1 })
    }
  }

  return { cells, seed }
}

// Country dot positions (percentage-based, works with any map)
const DOT: Record<string, [number, number]> = {
  'Austria': [54.5, 23], 'AT': [54.5, 23],
  'Germany': [52.5, 21], 'DE': [52.5, 21],
  'United States': [23, 28], 'US': [23, 28], 'USA': [23, 28],
  'United Kingdom': [50, 16], 'UK': [50, 16], 'GB': [50, 16],
  'France': [50.5, 24], 'FR': [50.5, 24],
  'Japan': [89, 25], 'JP': [89, 25],
  'India': [71, 40], 'IN': [71, 40],
  'Brazil': [37, 62], 'BR': [37, 62],
  'Canada': [22, 14], 'CA': [22, 14],
  'Australia': [91, 70], 'AU': [91, 70],
  'China': [82, 24], 'CN': [82, 24],
  'Russia': [72, 10], 'RU': [72, 10],
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  const seed = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const s = params.get('seed')
      if (s) return parseInt(s)
    }
    return Math.floor(Math.random() * 2147483647)
  }, [])

  const { cells } = useMemo(() => generateMap(seed), [seed])

  useEffect(() => {
    fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
      .then(r => r.json())
      .then((d: { countries: Record<string, number> }) => {
        setCountries(d.countries)
        setTotal(Object.values(d.countries).reduce((a, b) => a + b, 0))
      })
      .catch(() => {})
  }, [])

  const dotCells: Record<string, { n: number; names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const c = DOT[country]
    if (!c) continue
    const gx = Math.round((c[0] / 100) * W)
    const gy = Math.round((c[1] / 100) * H)
    const k = `${gx},${gy}`
    if (!dotCells[k]) dotCells[k] = { n: 0, names: [] }
    dotCells[k].n += count
    dotCells[k].names.push(`${country} · ${count}`)
  }

  const svgW = W * PX
  const svgH = H * PX

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>world</span>
        <span className="wm-seed">seed: {seed}</span>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>
      <div className="wm-wrap">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="wm-svg" shapeRendering="crispEdges">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {cells.map(({ x, y, v }) => (
            <rect
              key={`${x},${y}`}
              x={x * PX}
              y={y * PX}
              width={PX + 0.5}
              height={PX + 0.5}
              fill={v === 2 ? '#1E1E38' : '#161630'}
            />
          ))}

          {Object.entries(dotCells).map(([k, dot]) => {
            const [x, y] = k.split(',').map(Number)
            const cx = x! * PX + PX / 2
            const cy = y! * PX + PX / 2
            const isH = hovered === k
            return (
              <g key={k}
                onMouseEnter={() => setHovered(k)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                <circle cx={cx} cy={cy} r={12} fill="#E8572A" opacity={0.08} className="wm-p1" shapeRendering="auto" />
                <circle cx={cx} cy={cy} r={8} fill="#E8572A" opacity={0.15} className="wm-p2" shapeRendering="auto" />
                <circle cx={cx} cy={cy} r={4} fill="#E8572A" filter="url(#glow)" shapeRendering="auto" />
                {isH && (
                  <g shapeRendering="auto">
                    <rect x={cx - 30} y={cy - 16} width={60} height={12 * dot.names.length + 4} fill="#0D0D1A" stroke="#E8572A" strokeWidth="0.5" rx="1" />
                    {dot.names.map((n, i) => (
                      <text key={i} x={cx} y={cy - 8 + i * 12} textAnchor="middle" fill="#F5F0E8" fontSize="6" fontFamily="monospace">{n}</text>
                    ))}
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <style>{`
        .wm { height:100vh; display:flex; flex-direction:column; background:#0D0D1A; overflow:hidden; }
        .wm-bar { display:flex; align-items:center; gap:1.5rem; padding:.75rem 1.5rem; border-bottom:1px solid #1A1A2E; font-size:.8rem; flex-shrink:0; }
        .wm-bar a { color:#8A8A9A; text-decoration:none; }
        .wm-bar a:hover { color:#F5F0E8; }
        .wm-bar span { color:#F5F0E8; text-transform:uppercase; letter-spacing:.15em; font-size:.75rem; }
        .wm-seed { color:#8A8A9A !important; font-size:.6rem !important; text-transform:none !important; letter-spacing:0 !important; }
        .wm-n { color:#8A8A9A !important; margin-left:auto; font-size:.7rem !important; text-transform:none !important; }
        .wm-wrap { flex:1; display:flex; align-items:center; justify-content:center; padding:1rem 2rem; }
        .wm-svg { width:100%; height:100%; max-width:1400px; }
        .wm-p1 { animation: p1 2.5s ease-in-out infinite; }
        .wm-p2 { animation: p2 2.5s ease-in-out infinite .3s; }
        @keyframes p1 { 0%,100%{opacity:.05;} 50%{opacity:.15;} }
        @keyframes p2 { 0%,100%{opacity:.1;} 50%{opacity:.3;} }
      `}</style>
    </div>
  )
}
