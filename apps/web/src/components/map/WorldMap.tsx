'use client'

import { useEffect, useState, useMemo } from 'react'
import { WORLD_BITMAP, BITMAP_W, BITMAP_H } from './world-data'

const PX = 5

// Country → [col, row] in the 200x100 grid
// x = (lon+180)/1.8, y = (90-lat)/1.8
const DOT: Record<string, [number, number]> = {
  'Austria': [109,23], 'AT': [109,23],
  'Germany': [105,21], 'DE': [105,21],
  'Switzerland': [104,23], 'CH': [104,23],
  'United States': [47,28], 'US': [47,28], 'USA': [47,28],
  'United Kingdom': [100,22], 'UK': [100,22], 'GB': [100,22],
  'France': [101,23], 'FR': [101,23],
  'Netherlands': [103,21], 'NL': [103,21],
  'Japan': [178,30], 'JP': [178,30],
  'India': [143,40], 'IN': [143,40],
  'Brazil': [73,61], 'BR': [73,61],
  'Canada': [46,20], 'CA': [46,20],
  'Australia': [183,69], 'AU': [183,69],
  'Sweden': [110,15], 'SE': [110,15],
  'Norway': [106,14], 'NO': [106,14],
  'Finland': [114,14], 'FI': [114,14],
  'Denmark': [106,19], 'DK': [106,19],
  'Poland': [111,21], 'PL': [111,21],
  'Spain': [98,27], 'ES': [98,27],
  'Italy': [107,26], 'IT': [107,26],
  'Portugal': [95,27], 'PT': [95,27],
  'Ireland': [95,21], 'IE': [95,21],
  'South Korea': [171,28], 'KR': [171,28],
  'Singapore': [158,50], 'SG': [158,50],
  'Israel': [119,33], 'IL': [119,33],
  'China': [162,28], 'CN': [162,28],
  'Mexico': [45,38], 'MX': [45,38],
  'Argentina': [64,69], 'AR': [64,69],
  'Colombia': [58,47], 'CO': [58,47],
  'Romania': [114,24], 'RO': [114,24],
  'Ukraine': [117,21], 'UA': [117,21],
  'Turkey': [118,27], 'TR': [118,27],
  'New Zealand': [197,74], 'NZ': [197,74],
  'South Africa': [114,68], 'ZA': [114,68],
  'Nigeria': [104,45], 'NG': [104,45],
  'Kenya': [121,49], 'KE': [121,49],
  'Indonesia': [171,54], 'ID': [171,54],
  'Philippines': [168,43], 'PH': [168,43],
  'Thailand': [156,42], 'TH': [156,42],
  'Vietnam': [162,42], 'VN': [162,42],
  'Taiwan': [168,37], 'TW': [168,37],
  'Russia': [149,17], 'RU': [149,17],
  'Egypt': [117,33], 'EG': [117,33],
  'Pakistan': [138,33], 'PK': [138,33],
  'UAE': [131,36], 'AE': [131,36],
  'Chile': [61,71], 'CL': [61,71],
  'Peru': [57,56], 'PE': [57,56],
  'Morocco': [97,31], 'MA': [97,31],
}

function getCell(x: number, y: number): number {
  if (x < 0 || x >= BITMAP_W || y < 0 || y >= BITMAP_H) return 0
  return parseInt(WORLD_BITMAP[y * BITMAP_W + x] ?? '0')
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  // Build list of visible cells
  const cells = useMemo(() => {
    const result: Array<{ x: number; y: number; v: number }> = []
    for (let y = 0; y < BITMAP_H; y++)
      for (let x = 0; x < BITMAP_W; x++) {
        const v = getCell(x, y)
        if (v > 0) result.push({ x, y, v })
      }
    return result
  }, [])

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
  const dotCells: Record<string, { n: number; names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const c = DOT[country]
    if (!c) continue
    const k = `${c[0]},${c[1]}`
    if (!dotCells[k]) dotCells[k] = { n: 0, names: [] }
    dotCells[k].n += count
    dotCells[k].names.push(`${country} · ${count}`)
  }

  const svgW = BITMAP_W * PX
  const svgH = BITMAP_H * PX

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>world</span>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>
      <div className="wm-wrap">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="wm-svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Land cells */}
          {cells.map(({ x, y, v }) => (
            <rect
              key={`${x},${y}`}
              x={x * PX}
              y={y * PX}
              width={PX}
              height={PX}
              fill={v === 2 ? '#1E1E38' : '#161630'}
            />
          ))}

          {/* Dots */}
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
                <circle cx={cx} cy={cy} r={12} fill="#E8572A" opacity={0.08} className="wm-p1" />
                <circle cx={cx} cy={cy} r={8} fill="#E8572A" opacity={0.15} className="wm-p2" />
                <circle cx={cx} cy={cy} r={4} fill="#E8572A" filter="url(#glow)" />
                {dot.n > 1 && (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#0D0D1A" fontSize="5" fontWeight="bold" fontFamily="monospace">{dot.n}</text>
                )}
                {isH && (
                  <g>
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
