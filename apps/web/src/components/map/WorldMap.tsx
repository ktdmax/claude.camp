'use client'

import { useEffect, useState } from 'react'

const COLS = 40
const ROWS = 25
const PX = 12

const BG = '#0D0D1A'
const LAND = '#1E2035'
const ACTIVE = '#2A2D4A'
const DOT = '#E8572A'

// 40×25 pixel grid — 1 = land, 0 = water
// Roughly a horizontal continental landmass (Europe → Asia shape)
/* eslint-disable */
const MAP: number[][] = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 0
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 1
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0], // 2
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0], // 3
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // 4
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0], // 5
  [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // 6
  [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // 7
  [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // 8
  [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // 9
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // 10
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // 11
  [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0], // 12
  [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // 13
  [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0], // 14
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0], // 15
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0], // 16
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 17
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 18
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 19
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 20
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 21
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 22
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 23
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 24
]
/* eslint-enable */

// Country → [col, row] on the 40×25 grid
// Placed roughly to match real-world positions on the landmass
const COUNTRY_POS: Record<string, [number, number]> = {
  // Europe (left cluster)
  'Austria':        [18, 10],
  'AT':             [18, 10],
  'Germany':        [17, 8],
  'DE':             [17, 8],
  'France':         [14, 10],
  'FR':             [14, 10],
  'United Kingdom': [12, 7],
  'UK':             [12, 7],
  'GB':             [12, 7],
  'Spain':          [12, 12],
  'ES':             [12, 12],
  'Italy':          [17, 12],
  'IT':             [17, 12],
  'Netherlands':    [15, 7],
  'NL':             [15, 7],
  'Poland':         [19, 8],
  'PL':             [19, 8],
  'Sweden':         [17, 5],
  'SE':             [17, 5],
  'Norway':         [15, 5],
  'NO':             [15, 5],
  'Switzerland':    [16, 10],
  'CH':             [16, 10],
  'Belgium':        [14, 8],
  'BE':             [14, 8],
  'Denmark':        [16, 6],
  'DK':             [16, 6],
  'Finland':        [20, 5],
  'FI':             [20, 5],
  'Ireland':        [10, 8],
  'IE':             [10, 8],
  'Czech Republic': [18, 9],
  'CZ':             [18, 9],
  'Czechia':        [18, 9],
  'Portugal':       [10, 12],
  'PT':             [10, 12],
  'Romania':        [20, 11],
  'RO':             [20, 11],
  'Hungary':        [19, 10],
  'HU':             [19, 10],
  'Croatia':        [18, 11],
  'HR':             [18, 11],
  'Ukraine':        [21, 9],
  'UA':             [21, 9],
  // Middle East / Central
  'Turkey':         [22, 11],
  'TR':             [22, 11],
  'Israel':         [22, 13],
  'IL':             [22, 13],
  // Russia / Central Asia
  'Russia':         [28, 6],
  'RU':             [28, 6],
  // Asia
  'India':          [30, 12],
  'IN':             [30, 12],
  'China':          [32, 8],
  'CN':             [32, 8],
  'Japan':          [36, 7],
  'JP':             [36, 7],
  'South Korea':    [35, 8],
  'KR':             [35, 8],
  'Pakistan':       [28, 11],
  'PK':             [28, 11],
  'Thailand':       [32, 12],
  'TH':             [32, 12],
  'Vietnam':        [33, 12],
  'VN':             [33, 12],
  'Indonesia':      [33, 14],
  'ID':             [33, 14],
  'Philippines':    [35, 12],
  'PH':             [35, 12],
  'Singapore':      [32, 14],
  'SG':             [32, 14],
  'Malaysia':       [32, 13],
  'MY':             [32, 13],
  'Taiwan':         [35, 10],
  'TW':             [35, 10],
  // Americas (mapped onto the lower-left bulge)
  'United States':  [13, 14],
  'US':             [13, 14],
  'USA':            [13, 14],
  'Canada':         [11, 13],
  'CA':             [11, 13],
  'Mexico':         [12, 16],
  'MX':             [12, 16],
  'Brazil':         [14, 17],
  'BR':             [14, 17],
  // Africa (center-bottom)
  'Nigeria':        [20, 14],
  'NG':             [20, 14],
  'Kenya':          [23, 14],
  'KE':             [23, 14],
  'South Africa':   [21, 16],
  'ZA':             [21, 16],
  'Egypt':          [22, 12],
  'EG':             [22, 12],
  // Oceania
  'Australia':      [35, 14],
  'AU':             [35, 14],
  'New Zealand':    [37, 15],
  'NZ':             [37, 15],
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

  // Build set of active grid positions (where agents are)
  const activeSet = new Set<string>()
  const dotCells: Record<string, { names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const pos = COUNTRY_POS[country]
    if (!pos) continue
    const k = `${pos[0]},${pos[1]}`
    activeSet.add(k)
    // Also mark surrounding pixels as active
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
        <span>world</span>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>

      <div className="wm-wrap">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="wm-svg"
          shapeRendering="crispEdges"
        >
          {/* Background */}
          <rect x={0} y={0} width={svgW} height={svgH} fill={BG} />

          {/* Land pixels */}
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
                  fill={isActive ? ACTIVE : LAND}
                />
              )
            })
          )}

          {/* Agent dots — 3×3 pixel squares */}
          {Object.entries(dotCells).map(([k, dot]) => {
            const [cx, cy] = k.split(',').map(Number)
            const isH = hovered === k
            // Center the 3×3 dot on the grid cell
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
                  fill={DOT}
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
