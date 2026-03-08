'use client'

import { useEffect, useState, useMemo } from 'react'

const W = 200, H = 100, PX = 5

// Claude Island — shaped like the Cici sprite from above
// The easter egg: it's a face. Monkey Island vibes.
// Eyes are bays/lagoons (water cutouts in the head)
const SPANS: Array<[number, number, number]> = [
  // === FLAME TIP (row 0) ===
  [12,98,101],[13,97,102],[14,96,103],[15,96,103],[16,97,102],[17,97,102],

  // === HEAD TOP (row 1) ===
  [18,86,113],[19,85,114],[20,84,115],[21,84,115],[22,84,115],[23,85,114],

  // === EYES ROW (row 2) — cols 1-7, eyes at cols 3+5 are WATER ===
  // Left side of head
  [24,79,96],[24,103,120],
  [25,78,96],[25,103,121],
  [26,78,95],[26,104,121],
  [27,78,95],[27,104,121],
  [28,78,96],[28,103,121],
  [29,79,96],[29,103,120],
  // The gaps at x=91-96 and x=103-108 ARE the eye-lagoons

  // === MOUTH ROW (row 3) ===
  [30,85,114],[31,84,115],[32,84,115],[33,84,115],[34,85,114],[35,85,114],

  // === NECK (row 4) — narrower ===
  [36,91,108],[37,90,109],[38,90,109],[39,90,109],[40,91,108],[41,91,108],

  // === SHOULDERS (row 5) ===
  [42,85,114],[43,84,115],[44,84,115],[45,84,115],[46,85,114],[47,85,114],

  // === TORSO (row 6) ===
  [48,85,114],[49,84,115],[50,84,115],[51,84,115],[52,85,114],[53,85,114],

  // === HIPS (row 7) — narrower ===
  [54,91,108],[55,90,109],[56,90,109],[57,90,109],[58,91,108],[59,91,108],

  // === LEGS (row 8) — two separate columns ===
  [60,91,96],[60,103,108],
  [61,90,97],[61,102,109],
  [62,90,97],[62,102,109],
  [63,90,97],[63,102,109],
  [64,91,96],[64,103,108],
  [65,91,96],[65,103,108],

  // === FEET (row 9) — wider, offset outward ===
  [66,85,92],[66,107,114],
  [67,84,93],[67,106,115],
  [68,84,93],[68,106,115],
  [69,85,92],[69,107,114],
  [70,86,91],[70,108,113],

  // === SMALL ISLANDS around ===
  // Reef east
  [40,118,121],[41,117,122],[42,118,121],
  // Reef west
  [44,74,78],[45,73,79],[46,74,78],
  // Tiny island north
  [8,94,97],[9,93,98],[10,94,97],
  // Tiny island south
  [74,96,100],[75,95,101],[76,96,100],
  // Archipelago NE
  [16,118,121],[17,117,122],[18,118,121],
  [20,124,126],[21,123,127],[22,124,126],
]

// Country → position on the island body [x, y]
const DOT: Record<string, [number, number]> = {
  'Austria': [100, 32], 'AT': [100, 32],
  'Germany': [92, 28], 'DE': [92, 28],
  'Switzerland': [88, 33], 'CH': [88, 33],
  'United States': [88, 50], 'US': [88, 50], 'USA': [88, 50],
  'United Kingdom': [82, 26], 'UK': [82, 26], 'GB': [82, 26],
  'France': [90, 44], 'FR': [90, 44],
  'Japan': [112, 50], 'JP': [112, 50],
  'India': [106, 55], 'IN': [106, 55],
  'Brazil': [95, 62], 'BR': [95, 62],
  'Canada': [86, 22], 'CA': [86, 22],
  'Australia': [112, 44], 'AU': [112, 44],
  'China': [108, 46], 'CN': [108, 46],
  'Russia': [105, 22], 'RU': [105, 22],
  'Spain': [86, 48], 'ES': [86, 48],
  'Italy': [100, 48], 'IT': [100, 48],
  'South Korea': [110, 34], 'KR': [110, 34],
  'Netherlands': [90, 20], 'NL': [90, 20],
  'Sweden': [95, 20], 'SE': [95, 20],
  'Poland': [105, 20], 'PL': [105, 20],
  'Turkey': [110, 32], 'TR': [110, 32],
  'Nigeria': [88, 56], 'NG': [88, 56],
  'South Africa': [108, 68], 'ZA': [108, 68],
  'Argentina': [93, 68], 'AR': [93, 68],
  'Mexico': [86, 38], 'MX': [86, 38],
  'Colombia': [92, 54], 'CO': [92, 54],
  'Egypt': [108, 38], 'EG': [108, 38],
  'Indonesia': [112, 56], 'ID': [112, 56],
  'Ukraine': [110, 26], 'UA': [110, 26],
}

function buildMap(): Array<{ x: number; y: number; v: number }> {
  const land = new Set<string>()
  for (const [y, x1, x2] of SPANS)
    for (let x = x1; x <= x2; x++) land.add(`${x},${y}`)

  const cells: Array<{ x: number; y: number; v: number }> = []
  for (const key of land) {
    const [x, y] = key.split(',').map(Number)
    let coastal = false
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]] as const) {
      if (!land.has(`${x!+dx},${y!+dy}`)) { coastal = true; break }
    }
    cells.push({ x: x!, y: y!, v: coastal ? 1 : 2 })
  }
  return cells
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const cells = useMemo(buildMap, [])

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
            <rect key={`${x},${y}`} x={x*PX} y={y*PX} width={PX+0.5} height={PX+0.5}
              fill={v === 2 ? '#1E1E38' : '#161630'} />
          ))}
          {Object.entries(dotCells).map(([k, dot]) => {
            const [x, y] = k.split(',').map(Number)
            const cx = x!*PX+PX/2, cy = y!*PX+PX/2
            const isH = hovered === k
            return (
              <g key={k} onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)} style={{cursor:'default'}}>
                <circle cx={cx} cy={cy} r={12} fill="#E8572A" opacity={0.08} className="wm-p1" shapeRendering="auto" />
                <circle cx={cx} cy={cy} r={8} fill="#E8572A" opacity={0.15} className="wm-p2" shapeRendering="auto" />
                <circle cx={cx} cy={cy} r={4} fill="#E8572A" filter="url(#glow)" shapeRendering="auto" />
                {isH && (
                  <g shapeRendering="auto">
                    <rect x={cx-30} y={cy-16} width={60} height={12*dot.names.length+4} fill="#0D0D1A" stroke="#E8572A" strokeWidth="0.5" rx="1" />
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
