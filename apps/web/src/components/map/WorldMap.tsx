'use client'

import { useEffect, useState, useMemo } from 'react'

const W = 200, H = 100, PX = 5

// Claude Island — hand-crafted pixel art island
const SPANS: Array<[number, number, number]> = [
  // Northern archipelago
  [18,85,89],[18,93,95],
  [19,84,91],[19,93,96],
  [20,83,92],[20,94,97],
  [21,82,93],[21,95,98],
  [22,81,99],

  // Main island — northern coast
  [24,72,74],[24,78,80],
  [25,70,76],[25,78,82],
  [26,68,84],
  [27,66,86],
  [28,64,88],
  [29,62,90],
  [30,60,92],

  // Main body — widest part
  [31,58,96],
  [32,56,98],
  [33,54,100],
  [34,53,102],
  [35,52,104],
  [36,51,106],
  [37,50,108],
  [38,49,110],
  [39,48,112],
  [40,47,114],
  [41,47,116],
  [42,46,118],
  [43,46,119],
  [44,46,120],
  [45,46,121],
  [46,46,122],

  // Central — with bay on east side
  [47,46,108],[47,112,123],
  [48,46,106],[48,114,124],
  [49,46,104],[49,116,124],
  [50,47,102],[50,117,124],

  // Southern bulk
  [51,47,100],[51,116,125],
  [52,48,99],[52,114,126],
  [53,48,98],[53,112,126],
  [54,49,127],
  [55,50,128],
  [56,50,128],
  [57,51,128],
  [58,52,127],
  [59,52,126],
  [60,53,126],
  [61,54,125],
  [62,54,124],
  [63,55,124],
  [64,56,123],
  [65,56,122],
  [66,57,120],
  [67,58,118],
  [68,59,116],
  [69,60,114],
  [70,62,112],
  [71,64,110],
  [72,66,108],
  [73,68,106],
  [74,70,104],
  [75,72,102],
  [76,75,100],
  [77,78,98],
  [78,80,96],
  [79,82,94],
  [80,84,92],

  // Southern small islands
  [82,88,91],
  [83,87,90],
  [84,88,90],

  // Western small island
  [52,38,42],
  [53,37,43],
  [54,36,44],
  [55,36,44],
  [56,37,43],
  [57,38,42],

  // Eastern reef islands
  [38,118,121],
  [39,117,122],
  [40,118,123],
  [41,119,122],

  [60,130,133],
  [61,129,134],
  [62,129,134],
  [63,130,133],

  // Northern tiny island
  [15,90,92],
  [16,89,93],
  [17,90,92],
]

// Coast cells: land cells with at least one water neighbor
function buildMap(): Array<{ x: number; y: number; v: number }> {
  const land = new Set<string>()
  for (const [y, x1, x2] of SPANS)
    for (let x = x1; x <= x2; x++) land.add(`${x},${y}`)

  const cells: Array<{ x: number; y: number; v: number }> = []
  for (const key of land) {
    const [x, y] = key.split(',').map(Number)
    // Check if coastal (has water neighbor)
    let coastal = false
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      if (!land.has(`${x!+dx!},${y!+dy!}`)) { coastal = true; break }
    }
    cells.push({ x: x!, y: y!, v: coastal ? 1 : 2 })
  }
  return cells
}

// Named locations on the island
const DOT: Record<string, [number, number]> = {
  'Austria': [85, 45], 'AT': [85, 45],
  'Germany': [78, 42], 'DE': [78, 42],
  'Switzerland': [75, 46], 'CH': [75, 46],
  'United States': [58, 38], 'US': [58, 38], 'USA': [58, 38],
  'United Kingdom': [65, 34], 'UK': [65, 34], 'GB': [65, 34],
  'France': [70, 44], 'FR': [70, 44],
  'Japan': [110, 52], 'JP': [110, 52],
  'India': [100, 58], 'IN': [100, 58],
  'Brazil': [80, 65], 'BR': [80, 65],
  'Canada': [55, 33], 'CA': [55, 33],
  'Australia': [115, 62], 'AU': [115, 62],
  'China': [105, 44], 'CN': [105, 44],
  'Russia': [95, 35], 'RU': [95, 35],
  'Spain': [62, 50], 'ES': [62, 50],
  'Italy': [88, 52], 'IT': [88, 52],
  'South Korea': [108, 48], 'KR': [108, 48],
  'Netherlands': [72, 38], 'NL': [72, 38],
  'Sweden': [80, 33], 'SE': [80, 33],
  'Poland': [88, 38], 'PL': [88, 38],
  'Turkey': [95, 50], 'TR': [95, 50],
  'Nigeria': [70, 58], 'NG': [70, 58],
  'South Africa': [90, 70], 'ZA': [90, 70],
  'Argentina': [65, 68], 'AR': [65, 68],
  'Mexico': [55, 48], 'MX': [55, 48],
  'Colombia': [58, 55], 'CO': [58, 55],
  'Egypt': [92, 55], 'EG': [92, 55],
  'Indonesia': [112, 56], 'ID': [112, 56],
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

  const svgW = W * PX
  const svgH = H * PX

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
