'use client'

import { useEffect, useState, useMemo } from 'react'

const W = 200, H = 100, PX = 5

// Seeded PRNG for consistent organic noise
function rng(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function buildIsland(): Array<{ x: number; y: number; v: number }> {
  const rand = rng(ISLAND_SEED)
  const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(0))

  // Define Cici shape as signed distance from center of each body part
  // Returns > 0 if inside, 0 if outside
  function ciciShape(px: number, py: number): number {
    // Centered at x=100, y=50, lying on side (head left)
    const x = px, y = py

    // Flame tip — small ellipse on far left
    const ft = 1 - Math.sqrt(((x - 14) / 5) ** 2 + ((y - 50) / 4) ** 2)
    if (ft > 0) return ft * 0.6

    // Head — large ellipse, left side
    const hx = 38, hy = 50, hrx = 22, hry = 18
    const hd = 1 - Math.sqrt(((x - hx) / hrx) ** 2 + ((y - hy) / hry) ** 2)

    // Upper eye lagoon (bay) — ellipse cutout
    const e1 = 1 - Math.sqrt(((x - 44) / 7) ** 2 + ((y - 40) / 5) ** 2)
    // Lower eye lagoon
    const e2 = 1 - Math.sqrt(((x - 44) / 7) ** 2 + ((y - 60) / 5) ** 2)

    if (hd > 0 && e1 <= 0.1 && e2 <= 0.1) return hd

    // Neck — ellipse connecting head to body
    const nd = 1 - Math.sqrt(((x - 68) / 12) ** 2 + ((y - 50) / 10) ** 2)

    // Body — large ellipse
    const bx = 100, by = 50, brx = 22, bry = 18
    const bd = 1 - Math.sqrt(((x - bx) / brx) ** 2 + ((y - by) / bry) ** 2)

    // Hips — connecting body to legs
    const hipd = 1 - Math.sqrt(((x - 132) / 12) ** 2 + ((y - 50) / 10) ** 2)

    // Upper leg
    const ul = 1 - Math.sqrt(((x - 155) / 14) ** 2 + ((y - 39) / 7) ** 2)
    // Lower leg
    const ll = 1 - Math.sqrt(((x - 155) / 14) ** 2 + ((y - 61) / 7) ** 2)

    // Upper foot — blob at end
    const uf = 1 - Math.sqrt(((x - 175) / 9) ** 2 + ((y - 34) / 6) ** 2)
    // Lower foot
    const lf = 1 - Math.sqrt(((x - 175) / 9) ** 2 + ((y - 66) / 6) ** 2)

    const d = Math.max(hd, nd, bd, hipd, ul, ll, uf, lf)
    return d
  }

  // Fill grid with Cici shape + organic noise
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = ciciShape(x, y)
      if (d <= -0.15) continue // definitely water

      // Add organic noise to coastline
      const noise = (rand() - 0.5) * 0.18
      const jitter = d + noise

      if (jitter > 0.15) {
        grid[y]![x] = 3 // inland
      } else if (jitter > 0.05) {
        grid[y]![x] = 2 // land
      } else if (jitter > -0.03) {
        grid[y]![x] = 1 // coast/beach
      }
    }
  }

  // Carve the eye lagoons more aggressively
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const e1 = 1 - Math.sqrt(((x - 44) / 6) ** 2 + ((y - 40) / 4) ** 2)
      const e2 = 1 - Math.sqrt(((x - 44) / 6) ** 2 + ((y - 60) / 4) ** 2)
      if (e1 > 0.1 || e2 > 0.1) {
        // Add slight noise to lagoon edges
        const ln = (rand() - 0.5) * 0.2
        if (e1 + ln > 0.05 || e2 + ln > 0.05) {
          grid[y]![x] = 0
        }
      }
    }
  }

  // Add coastal shelf (shallow water glow around island)
  const shelf: Array<{ x: number; y: number; v: number }> = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y]![x]! > 0) continue
      // Check if near land
      let nearLand = false
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && grid[ny]![nx]! > 0)
            nearLand = true
        }
      if (nearLand) shelf.push({ x, y, v: -1 }) // shelf marker
    }
  }

  // Small islands
  const islands: Array<[number, number, number]> = [
    [20, 28, 4], [72, 30, 3], [48, 188, 4], [80, 20, 3],
    [15, 60, 3], [85, 160, 3], [30, 75, 2],
  ]
  for (const [iy, ix, ir] of islands) {
    for (let dy = -ir; dy <= ir; dy++)
      for (let dx = -ir; dx <= ir; dx++) {
        if (dx * dx + dy * dy <= ir * ir + (rand() - 0.5) * ir) {
          const ny = iy + dy, nx = ix + dx
          if (ny >= 0 && ny < H && nx >= 0 && nx < W)
            grid[ny]![nx] = 2
        }
      }
  }

  // Convert to cell array
  const cells: Array<{ x: number; y: number; v: number }> = [...shelf]
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (grid[y]![x]! > 0) cells.push({ x, y, v: grid[y]![x]! })

  return cells
}

// Use a numeric seed (can't use string in math)
const ISLAND_SEED = 424349

const DOT: Record<string, [number, number]> = {
  'Austria': [48, 46], 'AT': [48, 46],
  'Germany': [42, 42], 'DE': [42, 42],
  'France': [36, 52], 'FR': [36, 52],
  'Switzerland': [40, 48], 'CH': [40, 48],
  'United Kingdom': [30, 44], 'UK': [30, 44], 'GB': [30, 44],
  'Spain': [34, 56], 'ES': [34, 56],
  'Italy': [44, 54], 'IT': [44, 54],
  'Netherlands': [36, 42], 'NL': [36, 42],
  'Poland': [46, 40], 'PL': [46, 40],
  'Sweden': [40, 36], 'SE': [40, 36],
  'Norway': [34, 38], 'NO': [34, 38],
  'Ukraine': [50, 42], 'UA': [50, 42],
  'Turkey': [52, 56], 'TR': [52, 56],
  'Romania': [50, 52], 'RO': [50, 52],
  'Ireland': [26, 46], 'IE': [26, 46],
  'Finland': [44, 36], 'FI': [44, 36],
  'Denmark': [38, 40], 'DK': [38, 40],
  'Czech Republic': [44, 44], 'CZ': [44, 44], 'Czechia': [44, 44],
  'Hungary': [48, 50], 'HU': [48, 50],
  'Croatia': [46, 52], 'HR': [46, 52],
  'Belgium': [36, 44], 'BE': [36, 44],
  'Portugal': [30, 56], 'PT': [30, 56],
  'Israel': [62, 46], 'IL': [62, 46],
  'Egypt': [66, 54], 'EG': [66, 54],
  'UAE': [68, 44], 'AE': [68, 44],
  'Morocco': [60, 56], 'MA': [60, 56],
  'Russia': [70, 48], 'RU': [70, 48],
  'United States': [100, 48], 'US': [100, 48], 'USA': [100, 48],
  'Canada': [96, 38], 'CA': [96, 38],
  'Mexico': [92, 56], 'MX': [92, 56],
  'Brazil': [108, 56], 'BR': [108, 56],
  'Argentina': [112, 60], 'AR': [112, 60],
  'Colombia': [98, 58], 'CO': [98, 58],
  'Chile': [106, 62], 'CL': [106, 62],
  'Peru': [102, 58], 'PE': [102, 58],
  'Nigeria': [130, 48], 'NG': [130, 48],
  'Kenya': [134, 44], 'KE': [134, 44],
  'South Africa': [136, 54], 'ZA': [136, 54],
  'India': [150, 38], 'IN': [150, 38],
  'China': [155, 36], 'CN': [155, 36],
  'Japan': [160, 34], 'JP': [160, 34],
  'South Korea': [158, 36], 'KR': [158, 36],
  'Pakistan': [148, 40], 'PK': [148, 40],
  'Australia': [158, 62], 'AU': [158, 62],
  'New Zealand': [170, 66], 'NZ': [170, 66],
  'Indonesia': [154, 58], 'ID': [154, 58],
  'Thailand': [148, 58], 'TH': [148, 58],
  'Vietnam': [150, 56], 'VN': [150, 56],
  'Philippines': [156, 56], 'PH': [156, 56],
  'Singapore': [150, 62], 'SG': [150, 62],
  'Malaysia': [152, 60], 'MY': [152, 60],
  'Taiwan': [160, 38], 'TW': [160, 38],
}

const FILLS: Record<number, string> = {
  [-1]: '#0F1028', // shelf (shallow water)
  1: '#1A1A36',    // coast
  2: '#1E1E3A',    // land
  3: '#222240',    // inland (slightly brighter)
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const cells = useMemo(buildIsland, [])

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
    const k = `${c[0]},${c[1]}`
    if (!dotCells[k]) dotCells[k] = { n: 0, names: [] }
    dotCells[k].n += count
    dotCells[k].names.push(`${country} · ${count}`)
  }

  const svgW = W * PX, svgH = H * PX

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>claude island</span>
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
            <rect key={`${x},${y}`} x={x*PX} y={y*PX} width={PX+.5} height={PX+.5}
              fill={FILLS[v] ?? '#1E1E3A'} />
          ))}
          {Object.entries(dotCells).map(([k, dot]) => {
            const [x, y] = k.split(',').map(Number)
            const cx = x!*PX+PX/2, cy = y!*PX+PX/2
            const isH = hovered === k
            return (
              <g key={k} onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)} style={{cursor:'default'}}>
                <circle cx={cx} cy={cy} r={12} fill="#E8572A" opacity={.08} className="wm-p1" shapeRendering="auto" />
                <circle cx={cx} cy={cy} r={8} fill="#E8572A" opacity={.15} className="wm-p2" shapeRendering="auto" />
                <circle cx={cx} cy={cy} r={4} fill="#E8572A" filter="url(#glow)" shapeRendering="auto" />
                {isH && (
                  <g shapeRendering="auto">
                    <rect x={cx-30} y={cy-16} width={60} height={12*dot.names.length+4} fill="#0D0D1A" stroke="#E8572A" strokeWidth=".5" rx="1" />
                    {dot.names.map((n,i) => (
                      <text key={i} x={cx} y={cy-8+i*12} textAnchor="middle" fill="#F5F0E8" fontSize="6" fontFamily="monospace">{n}</text>
                    ))}
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <style>{`
        .wm{height:100vh;display:flex;flex-direction:column;background:#0D0D1A;overflow:hidden}
        .wm-bar{display:flex;align-items:center;gap:1.5rem;padding:.75rem 1.5rem;border-bottom:1px solid #1A1A2E;font-size:.8rem;flex-shrink:0}
        .wm-bar a{color:#8A8A9A;text-decoration:none}.wm-bar a:hover{color:#F5F0E8}
        .wm-bar span{color:#F5F0E8;text-transform:uppercase;letter-spacing:.15em;font-size:.75rem}
        .wm-n{color:#8A8A9A!important;margin-left:auto;font-size:.7rem!important;text-transform:none!important}
        .wm-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:1rem 2rem}
        .wm-svg{width:100%;height:100%;max-width:1400px}
        .wm-p1{animation:p1 2.5s ease-in-out infinite}
        .wm-p2{animation:p2 2.5s ease-in-out infinite .3s}
        @keyframes p1{0%,100%{opacity:.05}50%{opacity:.15}}
        @keyframes p2{0%,100%{opacity:.1}50%{opacity:.3}}
      `}</style>
    </div>
  )
}
