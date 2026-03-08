'use client'

import { useEffect, useState, useMemo } from 'react'

// 100 columns × 50 rows
// x = (lon+180)/3.6, y = (90-lat)/3.6
const W = 100, H = 50, PX = 10

// Land defined as horizontal spans: [row, colStart, colEnd]
const SPANS: Array<[number, number, number]> = [
  // Greenland
  [2,33,37],[3,32,38],[4,31,39],[5,31,38],[6,32,38],[7,33,37],[8,34,36],
  // Iceland
  [7,45,46],
  // Alaska
  [6,3,8],[7,2,10],[8,3,10],[9,5,8],
  // Canada (arctic archipelago)
  [4,14,16],[4,19,22],[4,26,30],
  [5,12,16],[5,18,23],[5,25,31],
  [6,11,17],[6,19,24],[6,25,32],
  // Canada mainland
  [7,10,31],[8,10,33],[9,11,33],[10,12,33],[11,14,33],
  // USA
  [12,16,32],[13,17,32],[14,17,31],[15,18,31],[16,18,30],[17,18,29],
  // Florida
  [18,27,29],
  // Mexico + Gulf coast
  [18,18,26],[19,19,24],[20,19,23],[21,20,23],[22,21,23],
  // Central America
  [23,22,24],[24,23,25],
  // Cuba + Caribbean
  [20,26,28],[21,27,28],
  // South America
  [23,26,31],[24,25,37],[25,25,39],[26,25,40],[27,26,40],[28,27,40],
  [29,27,40],[30,28,39],[31,29,39],[32,29,38],[33,30,38],[34,30,37],
  [35,30,36],[36,31,35],[37,31,34],[38,31,34],[39,32,33],
  // UK + Ireland
  [9,49,50],[10,48,50],[11,49,50],
  // Scandinavia
  [5,53,54],[6,52,55],[7,52,56],[8,52,56],[9,52,56],[10,53,55],
  // Western Europe (France, Benelux, Germany, Austria, Czech)
  [11,50,57],[12,50,58],[13,49,57],
  // Iberian Peninsula
  [14,48,51],[15,48,50],
  // Italy
  [14,53,54],[15,53,54],[16,54,54],
  // Balkans + Greece
  [14,55,57],[15,56,57],[16,56,57],
  // Eastern Europe
  [10,56,61],[11,57,63],[12,58,65],
  // Russia
  [3,80,88],[3,91,96],
  [4,60,62],[4,72,78],[4,80,97],
  [5,56,58],[5,60,98],
  [6,56,99],[7,56,99],[8,56,98],[9,57,97],[10,58,96],[11,60,93],[12,62,90],
  // Turkey
  [13,57,61],[14,58,61],
  // Middle East + Arabia
  [15,58,67],[16,59,67],[17,59,66],[18,60,66],[19,61,65],[20,62,65],
  // North Africa
  [15,48,58],[16,47,59],[17,47,60],[18,47,60],[19,47,60],
  // West Africa
  [20,46,57],[21,46,56],[22,47,56],[23,48,56],
  // Central + East Africa
  [24,50,61],[25,50,62],[26,51,62],[27,52,62],[28,53,61],
  [29,54,61],[30,54,61],
  // Southern Africa
  [31,55,60],[32,55,60],[33,55,59],[34,55,59],[35,56,58],
  // Madagascar
  [30,63,63],[31,63,64],[32,63,64],[33,63,63],
  // Central Asia
  [12,62,73],[13,60,75],
  // Pakistan + India
  [14,68,71],[15,68,73],[16,69,75],[17,69,76],[18,70,77],
  [19,70,77],[20,71,76],[21,72,76],[22,72,75],[23,73,75],[24,74,75],
  // Sri Lanka
  [25,75,76],
  // China + Mongolia
  [13,75,87],[14,73,88],[15,75,88],[16,76,87],[17,77,85],[18,78,83],
  // Korea
  [14,86,87],[15,86,87],
  // Japan
  [12,89,90],[13,89,90],[14,89,90],[15,89,90],[16,89,89],
  // SE Asia (Myanmar, Thailand, Vietnam, Laos, Cambodia)
  [19,77,81],[20,77,82],[21,78,82],[22,78,82],[23,79,81],
  // Malay Peninsula
  [24,79,80],[25,80,80],
  // Philippines
  [21,84,85],[22,84,85],[23,84,85],
  // Indonesia
  [25,81,83],[26,81,85],[27,82,88],[28,83,91],[29,87,93],
  // Australia
  [31,87,94],[32,86,95],[33,86,95],[34,86,95],[35,87,94],[36,88,94],[37,89,93],[38,90,92],
  // Papua New Guinea
  [29,93,96],[30,93,95],
  // New Zealand
  [37,97,98],[38,97,98],[39,97,97],
  // Taiwan
  [16,88,88],
]

// Country → grid cell [col, row]
// x = (lon+180)/3.6, y = (90-lat)/3.6
const DOT: Record<string, [number, number]> = {
  'Austria': [54,12], 'AT': [54,12],
  'Germany': [53,11], 'DE': [53,11],
  'Switzerland': [52,12], 'CH': [52,12],
  'United States': [24,14], 'US': [24,14], 'USA': [24,14],
  'United Kingdom': [50,11], 'UK': [50,11], 'GB': [50,11],
  'France': [51,12], 'FR': [51,12],
  'Netherlands': [52,11], 'NL': [52,11],
  'Japan': [89,14], 'JP': [89,14],
  'India': [72,19], 'IN': [72,19],
  'Brazil': [35,31], 'BR': [35,31],
  'Canada': [21,10], 'CA': [21,10],
  'Australia': [91,34], 'AU': [91,34],
  'Sweden': [54,7], 'SE': [54,7],
  'Norway': [53,7], 'NO': [53,7],
  'Finland': [55,7], 'FI': [55,7],
  'Denmark': [53,10], 'DK': [53,10],
  'Poland': [55,11], 'PL': [55,11],
  'Spain': [49,14], 'ES': [49,14],
  'Italy': [54,14], 'IT': [54,14],
  'Portugal': [48,14], 'PT': [48,14],
  'Ireland': [48,10], 'IE': [48,10],
  'South Korea': [86,15], 'KR': [86,15],
  'Singapore': [79,25], 'SG': [79,25],
  'Israel': [60,15], 'IL': [60,15],
  'China': [82,15], 'CN': [82,15],
  'Mexico': [22,20], 'MX': [22,20],
  'Argentina': [34,36], 'AR': [34,36],
  'Colombia': [29,24], 'CO': [29,24],
  'Romania': [57,13], 'RO': [57,13],
  'Ukraine': [59,11], 'UA': [59,11],
  'Turkey': [59,13], 'TR': [59,13],
  'New Zealand': [97,38], 'NZ': [97,38],
  'South Africa': [55,34], 'ZA': [55,34],
  'Nigeria': [51,22], 'NG': [51,22],
  'Kenya': [60,25], 'KE': [60,25],
  'Indonesia': [85,27], 'ID': [85,27],
  'Philippines': [84,22], 'PH': [84,22],
  'Thailand': [78,21], 'TH': [78,21],
  'Vietnam': [80,21], 'VN': [80,21],
  'Taiwan': [88,16], 'TW': [88,16],
  'Russia': [75,8], 'RU': [75,8],
  'Egypt': [59,16], 'EG': [59,16],
  'Pakistan': [69,17], 'PK': [69,17],
  'UAE': [65,17], 'AE': [65,17],
  'Chile': [31,37], 'CL': [31,37],
  'Peru': [28,30], 'PE': [28,30],
  'Morocco': [49,16], 'MA': [49,16],
}

function buildLand(): Set<string> {
  const s = new Set<string>()
  for (const [y, x1, x2] of SPANS)
    for (let x = x1; x <= x2; x++) s.add(`${x},${y}`)
  return s
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const land = useMemo(buildLand, [])

  useEffect(() => {
    fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
      .then(r => r.json())
      .then((d: { countries: Record<string, number> }) => {
        setCountries(d.countries)
        setTotal(Object.values(d.countries).reduce((a, b) => a + b, 0))
      })
      .catch(() => {})
  }, [])

  // Aggregate dots per cell
  const cells: Record<string, { n: number; names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const c = DOT[country]
    if (!c) continue
    const k = `${c[0]},${c[1]}`
    if (!cells[k]) cells[k] = { n: 0, names: [] }
    cells[k].n += count
    cells[k].names.push(`${country} · ${count}`)
  }

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>world</span>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>
      <div className="wm-wrap">
        <svg viewBox={`0 0 ${W * PX} ${H * PX}`} className="wm-svg">
          {/* Land cells */}
          {Array.from(land).map(k => {
            const [x, y] = k.split(',').map(Number)
            return <rect key={k} x={x! * PX} y={y! * PX} width={PX} height={PX} fill="#1C1C32" />
          })}
          {/* Dots */}
          {Object.entries(cells).map(([k, dot]) => {
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
                <circle cx={cx} cy={cy} r={16} fill="#E8572A" opacity={0.1} className="wm-p1" />
                <circle cx={cx} cy={cy} r={10} fill="#E8572A" opacity={0.2} className="wm-p2" />
                <circle cx={cx} cy={cy} r={5} fill="#E8572A" />
                <circle cx={cx} cy={cy} r={7} fill="none" stroke="#E8572A" strokeWidth={0.5} opacity={0.4} />
                {dot.n > 1 && (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#0D0D1A" fontSize="6" fontWeight="bold" fontFamily="monospace">{dot.n}</text>
                )}
                {isH && (
                  <g>
                    <rect x={cx - 35} y={cy - 20} width={70} height={14 * dot.names.length + 4} fill="#0D0D1A" stroke="#E8572A" strokeWidth="0.8" rx="1" />
                    {dot.names.map((n, i) => (
                      <text key={i} x={cx} y={cy - 12 + i * 14} textAnchor="middle" fill="#F5F0E8" fontSize="7" fontFamily="monospace">{n}</text>
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
        .wm-svg { width:100%; height:100%; max-width:1200px; }
        .wm-p1 { animation: p1 2.5s ease-in-out infinite; }
        .wm-p2 { animation: p2 2.5s ease-in-out infinite .3s; }
        @keyframes p1 { 0%,100%{opacity:.06;} 50%{opacity:.15;} }
        @keyframes p2 { 0%,100%{opacity:.12;} 50%{opacity:.3;} }
      `}</style>
    </div>
  )
}
