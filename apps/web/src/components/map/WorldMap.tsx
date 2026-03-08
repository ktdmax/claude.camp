'use client'

import { useEffect, useState } from 'react'

const COLS = 40
const ROWS = 25
const PX = 12

const BG = '#0D0D1A'
const DOT_COLOR = '#E8572A'
const ACTIVE = '#2A2D4A'

// Terrain fills: 1=coast, 2=land, 3=highland
const FILL: Record<number, string> = {
  1: '#161630',
  2: '#1E2035',
  3: '#252845',
}

// 40×25 — Cici silhouette upright
// Ears top, eye lagoons (0 inside land), arm bump right, 4 legs bottom
// 0=water, 1=coast, 2=land, 3=highland
/* eslint-disable */
const MAP: number[][] = [
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

// Country → [col, row] on the 40×25 grid
// Spread across the Cici body, ears, arm, legs
const COUNTRY_POS: Record<string, [number, number]> = {
  // Left ear (Scandinavia)
  'Sweden':         [11, 2],
  'SE':             [11, 2],
  'Norway':         [10, 1],
  'NO':             [10, 1],
  // Right ear (Far East islands)
  'Japan':          [28, 2],
  'JP':             [28, 2],
  'South Korea':    [28, 1],
  'KR':             [28, 1],
  // Upper body left (Western Europe)
  'United Kingdom': [10, 5],
  'UK':             [10, 5],
  'GB':             [10, 5],
  'Ireland':        [9, 6],
  'IE':             [9, 6],
  'France':         [12, 6],
  'FR':             [12, 6],
  'Netherlands':    [11, 5],
  'NL':             [11, 5],
  'Belgium':        [13, 5],
  'BE':             [13, 5],
  'Spain':          [10, 8],
  'ES':             [10, 8],
  'Portugal':       [9, 9],
  'PT':             [9, 9],
  // Upper body center-left (Central Europe)
  'Germany':        [17, 5],
  'DE':             [17, 5],
  'Austria':        [18, 6],
  'AT':             [18, 6],
  'Switzerland':    [16, 6],
  'CH':             [16, 6],
  'Poland':         [19, 5],
  'PL':             [19, 5],
  'Czech Republic': [18, 5],
  'CZ':             [18, 5],
  'Czechia':        [18, 5],
  'Denmark':        [16, 4],
  'DK':             [16, 4],
  'Italy':          [17, 8],
  'IT':             [17, 8],
  'Hungary':        [20, 6],
  'HU':             [20, 6],
  'Croatia':        [19, 8],
  'HR':             [19, 8],
  'Romania':        [21, 8],
  'RO':             [21, 8],
  'Finland':        [20, 4],
  'FI':             [20, 4],
  // Upper body right (East Europe / Russia)
  'Ukraine':        [23, 6],
  'UA':             [23, 6],
  'Russia':         [27, 5],
  'RU':             [27, 5],
  'Turkey':         [22, 9],
  'TR':             [22, 9],
  // Center body (Americas)
  'United States':  [20, 10],
  'US':             [20, 10],
  'USA':            [20, 10],
  'Canada':         [18, 10],
  'CA':             [18, 10],
  'Mexico':         [16, 11],
  'MX':             [16, 11],
  'Brazil':         [22, 12],
  'BR':             [22, 12],
  'Argentina':      [20, 12],
  'AR':             [20, 12],
  'Colombia':       [18, 12],
  'CO':             [18, 12],
  // Right arm (Pacific / Middle East)
  'Israel':         [33, 10],
  'IL':             [33, 10],
  'Egypt':          [34, 10],
  'EG':             [34, 10],
  'UAE':            [35, 10],
  'AE':             [35, 10],
  // Body right (Asia)
  'India':          [27, 8],
  'IN':             [27, 8],
  'China':          [28, 6],
  'CN':             [28, 6],
  'Pakistan':       [27, 9],
  'PK':             [27, 9],
  'Thailand':       [29, 8],
  'TH':             [29, 8],
  'Vietnam':        [30, 8],
  'VN':             [30, 8],
  'Taiwan':         [30, 6],
  'TW':             [30, 6],
  'Philippines':    [30, 9],
  'PH':             [30, 9],
  'Singapore':      [29, 10],
  'SG':             [29, 10],
  'Malaysia':       [28, 10],
  'MY':             [28, 10],
  'Indonesia':      [29, 12],
  'ID':             [29, 12],
  // Left legs (Africa / South America)
  'Nigeria':        [11, 15],
  'NG':             [11, 15],
  'Kenya':          [12, 14],
  'KE':             [12, 14],
  'South Africa':   [11, 17],
  'ZA':             [11, 17],
  'Chile':          [16, 16],
  'CL':             [16, 16],
  'Peru':           [15, 15],
  'PE':             [15, 15],
  // Right legs (Oceania)
  'Australia':      [24, 15],
  'AU':             [24, 15],
  'New Zealand':    [29, 16],
  'NZ':             [29, 16],
  'Morocco':        [23, 14],
  'MA':             [23, 14],
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
      .then(r => r.json())
      .then((d: { countries: Record<string, number> }) => {
        setCountries(d.countries)
        setTotal(Object.values(d.countries).reduce((a, b) => a + b, 0))
      })
      .catch(() => {})
  }, [])

  // Build set of active grid positions
  const activeSet = new Set<string>()
  const dotCells: Record<string, { names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const pos = COUNTRY_POS[country]
    if (!pos) continue
    const k = `${pos[0]},${pos[1]}`
    activeSet.add(k)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
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

          {MAP.map((row, ry) =>
            row.map((cell, cx) => {
              if (cell === 0) return null
              const k = `${cx},${ry}`
              const isActive = activeSet.has(k)
              return (
                <rect
                  key={k}
                  x={cx * PX}
                  y={ry * PX}
                  width={PX}
                  height={PX}
                  fill={isActive ? ACTIVE : (FILL[cell] ?? FILL[2])}
                />
              )
            })
          )}

          {Object.entries(dotCells).map(([k, dot]) => {
            const [cx, cy] = k.split(',').map(Number)
            const isH = hovered === k
            const dotX = cx! * PX + Math.floor((PX - 3) / 2)
            const dotY = cy! * PX + Math.floor((PX - 3) / 2)
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
                  width={3}
                  height={3}
                  fill={DOT_COLOR}
                  className="wm-dot"
                />
                {isH && (
                  <g>
                    <rect
                      x={cx! * PX - 24}
                      y={cy! * PX - 10 * dot.names.length - 4}
                      width={60}
                      height={10 * dot.names.length + 4}
                      fill={BG}
                      stroke="#1A1A2E"
                      strokeWidth={1}
                    />
                    {dot.names.map((n, i) => (
                      <text
                        key={i}
                        x={cx! * PX + 6}
                        y={cy! * PX - 10 * (dot.names.length - i) + 4}
                        fill="#F5F0E8"
                        fontSize="5"
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
        .wm-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem}
        .wm-svg{width:100%;height:100%;max-width:${svgW}px}
        .wm-dot{animation:dot-pulse 2s ease-in-out infinite}
        @keyframes dot-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
    </div>
  )
}
