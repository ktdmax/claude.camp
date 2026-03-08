'use client'

import { useEffect, useState, useMemo } from 'react'

const W = 200, H = 100, PX = 5

// Claude Island — Cici lying on its side (head LEFT, feet RIGHT)
// Rotated 90° CCW from the standing version
const SPANS: Array<[number, number, number]> = [
  // === FLAME TIP (leftmost point) ===
  [47,12,17],[48,10,18],[49,10,18],[50,10,18],[51,10,18],[52,12,17],

  // === HEAD (left side, tall) ===
  [35,18,38],[36,17,39],[37,16,40],[38,15,40],[39,15,40],[40,15,40],
  [41,15,40],[42,15,40],[43,15,40],[44,15,40],[45,15,40],[46,15,40],
  [47,17,40],[48,18,40],[49,18,40],[50,18,40],[51,18,40],[52,17,40],
  [53,15,40],[54,15,40],[55,15,40],[56,15,40],[57,15,40],[58,15,40],
  [59,15,40],[60,15,40],[61,16,40],[62,17,39],[63,18,38],[64,18,37],

  // === EYE LAGOONS (water cutouts in head) ===
  // Upper eye: rows 38-43, x=28-35 → these rows get SPLIT
  // Lower eye: rows 56-61, x=28-35 → these rows get SPLIT

  // === FACE (with eye cutouts) ===
  [35,40,62],[36,40,62],[37,40,62],
  [38,40,62],
  [39,40,50],[39,56,62],  // upper eye gap y=39-43
  [40,40,50],[40,56,62],
  [41,40,50],[41,56,62],
  [42,40,50],[42,56,62],
  [43,40,50],[43,56,62],
  [44,40,62],
  [45,40,62],[46,40,62],[47,40,62],[48,40,62],[49,40,62],[50,40,62],
  [51,40,62],[52,40,62],[53,40,62],[54,40,62],[55,40,62],
  [56,40,50],[56,56,62],  // lower eye gap y=56-61
  [57,40,50],[57,56,62],
  [58,40,50],[58,56,62],
  [59,40,50],[59,56,62],
  [60,40,50],[60,56,62],
  [61,40,62],
  [62,40,62],[63,40,62],[64,40,61],

  // === NECK (narrow horizontal) ===
  [42,62,80],[43,62,80],[44,62,80],[45,62,80],[46,62,80],
  [47,62,80],[48,62,80],[49,62,80],[50,62,80],[51,62,80],
  [52,62,80],[53,62,80],[54,62,80],[55,62,80],[56,62,80],[57,62,80],

  // === BODY (wider again) ===
  [35,80,120],[36,80,120],[37,80,120],[38,80,120],[39,80,120],
  [40,80,120],[41,80,120],[42,80,120],[43,80,120],[44,80,120],
  [45,80,120],[46,80,120],[47,80,120],[48,80,120],[49,80,120],
  [50,80,120],[51,80,120],[52,80,120],[53,80,120],[54,80,120],
  [55,80,120],[56,80,120],[57,80,120],[58,80,120],[59,80,120],
  [60,80,120],[61,80,120],[62,80,120],[63,80,120],[64,80,119],

  // === HIPS (narrow) ===
  [42,120,142],[43,120,142],[44,120,142],[45,120,142],[46,120,142],
  [47,120,142],[48,120,142],[49,120,142],[50,120,142],[51,120,142],
  [52,120,142],[53,120,142],[54,120,142],[55,120,142],[56,120,142],[57,120,142],

  // === LEGS (two separate, upper + lower) ===
  // Upper leg
  [35,142,165],[36,142,165],[37,142,165],[38,142,165],[39,142,165],
  [40,142,165],[41,142,165],[42,142,165],[43,142,164],
  // Lower leg
  [56,142,165],[57,142,165],[58,142,165],[59,142,165],
  [60,142,165],[61,142,165],[62,142,165],[63,142,164],[64,142,163],

  // === FEET (offset outward) ===
  // Upper foot
  [32,165,180],[33,164,182],[34,164,182],[35,164,182],[36,165,181],
  [37,166,180],[38,167,178],
  // Lower foot
  [61,166,180],[62,165,182],[63,164,182],[64,164,182],[65,164,182],
  [66,165,181],[67,166,178],

  // === SMALL ISLANDS ===
  // North reef
  [28,55,59],[29,54,60],[30,55,59],
  // South reef
  [69,55,59],[70,54,60],[71,55,59],
  // East island
  [48,186,190],[49,185,191],[50,185,191],[51,186,190],
  // West tiny
  [49,4,7],[50,3,8],[51,4,7],
]

// Region grid on the island — countries and US states mapped to zones
const DOT: Record<string, [number, number]> = {
  // === HEAD (Europe) ===
  'Austria': [48, 45], 'AT': [48, 45],
  'Germany': [44, 40], 'DE': [44, 40],
  'France': [48, 38], 'FR': [48, 38],
  'Switzerland': [45, 43], 'CH': [45, 43],
  'United Kingdom': [35, 37], 'UK': [35, 37], 'GB': [35, 37],
  'Ireland': [30, 38], 'IE': [30, 38],
  'Spain': [55, 37], 'ES': [55, 37],
  'Italy': [52, 42], 'IT': [52, 42],
  'Netherlands': [38, 40], 'NL': [38, 40],
  'Belgium': [40, 42], 'BE': [40, 42],
  'Portugal': [58, 36], 'PT': [58, 36],
  'Poland': [36, 44], 'PL': [36, 44],
  'Sweden': [30, 42], 'SE': [30, 42],
  'Norway': [28, 40], 'NO': [28, 40],
  'Finland': [26, 44], 'FI': [26, 44],
  'Denmark': [33, 42], 'DK': [33, 42],
  'Czech Republic': [42, 44], 'CZ': [42, 44], 'Czechia': [42, 44],
  'Romania': [54, 44], 'RO': [54, 44],
  'Hungary': [50, 44], 'HU': [50, 44],
  'Croatia': [52, 46], 'HR': [52, 46],
  'Ukraine': [36, 48], 'UA': [36, 48],
  'Turkey': [56, 48], 'TR': [56, 48],
  'Greece': [58, 46], 'GR': [58, 46],

  // === NECK (Middle East / North Africa) ===
  'Israel': [48, 68], 'IL': [48, 68],
  'Egypt': [52, 66], 'EG': [52, 66],
  'UAE': [45, 72], 'AE': [45, 72],
  'Morocco': [55, 64], 'MA': [55, 64],
  'Russia': [44, 70], 'RU': [44, 70],

  // === BODY (Americas) ===
  // US States
  'California': [38, 84], 'CA-US': [38, 84],
  'New York': [40, 92], 'NY': [40, 92],
  'Texas': [52, 88], 'TX': [52, 88],
  'Florida': [56, 94], 'FL': [56, 94],
  'Washington': [36, 82], 'WA': [36, 82],
  'Illinois': [44, 90], 'IL-US': [44, 90],
  'Massachusetts': [38, 96], 'MA-US': [38, 96],
  'Colorado': [44, 86], 'CO-US': [44, 86],
  'Georgia': [54, 96], 'GA': [54, 96],
  'Oregon': [38, 82], 'OR': [38, 82],
  'Virginia': [48, 96], 'VA': [48, 96],
  'Pennsylvania': [42, 94], 'PA': [42, 94],
  'Ohio': [44, 94], 'OH': [44, 94],
  'Michigan': [40, 88], 'MI': [40, 88],
  'North Carolina': [52, 98], 'NC': [52, 98],
  // Countries in body
  'United States': [46, 90], 'US': [46, 90], 'USA': [46, 90],
  'Canada': [38, 100], 'CA': [38, 100],
  'Mexico': [56, 86], 'MX': [56, 86],
  'Brazil': [54, 104], 'BR': [54, 104],
  'Argentina': [60, 108], 'AR': [60, 108],
  'Colombia': [56, 100], 'CO': [56, 100],
  'Chile': [62, 106], 'CL': [62, 106],
  'Peru': [58, 102], 'PE': [58, 102],

  // === HIPS (Africa) ===
  'Nigeria': [48, 128], 'NG': [48, 128],
  'Kenya': [44, 134], 'KE': [44, 134],
  'South Africa': [54, 136], 'ZA': [54, 136],

  // === UPPER LEG (Asia) ===
  'India': [38, 150], 'IN': [38, 150],
  'China': [36, 155], 'CN': [36, 155],
  'Japan': [34, 160], 'JP': [34, 160],
  'South Korea': [36, 158], 'KR': [36, 158],
  'Taiwan': [38, 160], 'TW': [38, 160],
  'Pakistan': [40, 148], 'PK': [40, 148],

  // === LOWER LEG (Oceania / SE Asia) ===
  'Australia': [60, 155], 'AU': [60, 155],
  'New Zealand': [62, 162], 'NZ': [62, 162],
  'Indonesia': [58, 152], 'ID': [58, 152],
  'Thailand': [58, 148], 'TH': [58, 148],
  'Vietnam': [56, 150], 'VN': [56, 150],
  'Philippines': [56, 156], 'PH': [56, 156],
  'Singapore': [60, 148], 'SG': [60, 148],
  'Malaysia': [60, 150], 'MY': [60, 150],
}

function buildMap(): Array<{ x: number; y: number; v: number }> {
  const land = new Set<string>()
  for (const [y, x1, x2] of SPANS)
    for (let x = x1; x <= x2; x++) land.add(`${x},${y}`)

  const cells: Array<{ x: number; y: number; v: number }> = []
  for (const key of land) {
    const [x, y] = key.split(',').map(Number)
    let coastal = false
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]] as const)
      if (!land.has(`${x!+dx},${y!+dy}`)) { coastal = true; break }
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
            <rect key={`${x},${y}`} x={x*PX} y={y*PX} width={PX+.5} height={PX+.5}
              fill={v === 2 ? '#1E1E38' : '#161630'} />
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
