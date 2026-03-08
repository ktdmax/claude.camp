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

// 40×25 pixel grid — Cici lying on side (head left, feet right)
// 0=water, 1=coast, 2=land, 3=highland
// Eye lagoons = 0 inside head. Irregular coasts, scattered islands.
/* eslint-disable */
const MAP: number[][] = [
//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 0
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0], // 1
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0], // 2
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,3,2,1,0,0,0,0,0,0], // 3
  [ 0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,2,3,3,3,2,1,1,0,0,0,0], // 4
  [ 0,0,0,0,1,2,3,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,3,3,2,1,0,0,0,0], // 5
  [ 0,0,0,1,2,3,3,3,3,2,1,0,0,0,0,0,0,0,0,0,1,2,2,1,1,2,3,3,3,3,3,3,3,3,2,1,0,1,0,0], // 6
  [ 0,0,0,1,2,3,3,0,3,3,2,1,1,2,2,2,2,1,0,1,2,3,3,2,2,3,3,3,3,3,3,3,3,2,2,1,0,0,0,0], // 7
  [ 0,0,1,2,3,3,0,0,0,3,3,2,2,3,3,3,3,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,0,0,0,0,0], // 8
  [ 0,1,2,3,3,3,3,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,0,0,0,0,0,0], // 9
  [ 0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 10
  [ 1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0], // 11
  [ 0,1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 12
  [ 0,1,2,3,3,3,3,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0,0,0], // 13
  [ 0,0,1,2,3,3,0,0,0,3,3,2,2,3,3,3,3,3,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,0,0,0,0,0], // 14
  [ 0,0,0,1,2,3,3,0,3,3,2,1,1,2,2,2,2,1,1,2,2,3,3,2,2,3,3,3,3,3,3,3,3,3,2,1,0,0,0,0], // 15
  [ 0,0,0,1,2,3,3,3,3,2,1,0,0,0,0,0,0,0,0,0,1,2,2,1,1,2,3,3,3,3,3,3,3,3,3,2,1,0,0,0], // 16
  [ 0,0,0,0,1,2,3,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,3,3,2,2,1,0,0,0], // 17
  [ 0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,2,3,3,3,2,1,1,0,0,0,0], // 18
  [ 0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,2,1,0,0,0,0,0,0], // 19
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0], // 20
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0], // 21
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 22
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 23
  [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 24
]
/* eslint-enable */

// Country → [col, row] on the 40×25 grid
// Placed on land pixels matching the Cici anatomy
const COUNTRY_POS: Record<string, [number, number]> = {
  // === HEAD (Europe) — cols 3-10, rows 5-18 ===
  'Austria':        [8, 11],
  'AT':             [8, 11],
  'Germany':        [7, 9],
  'DE':             [7, 9],
  'France':         [5, 11],
  'FR':             [5, 11],
  'United Kingdom': [5, 6],
  'UK':             [5, 6],
  'GB':             [5, 6],
  'Spain':          [5, 15],
  'ES':             [5, 15],
  'Italy':          [8, 14],
  'IT':             [8, 14],
  'Netherlands':    [6, 8],
  'NL':             [6, 8],
  'Poland':         [9, 9],
  'PL':             [9, 9],
  'Sweden':         [7, 6],
  'SE':             [7, 6],
  'Norway':         [6, 5],
  'NO':             [6, 5],
  'Switzerland':    [6, 10],
  'CH':             [6, 10],
  'Belgium':        [5, 9],
  'BE':             [5, 9],
  'Denmark':        [7, 7],
  'DK':             [7, 7],
  'Finland':        [9, 6],
  'FI':             [9, 6],
  'Ireland':        [4, 8],
  'IE':             [4, 8],
  'Czech Republic': [8, 9],
  'CZ':             [8, 9],
  'Czechia':        [8, 9],
  'Portugal':       [4, 16],
  'PT':             [4, 16],
  'Romania':        [10, 13],
  'RO':             [10, 13],
  'Hungary':        [9, 11],
  'HU':             [9, 11],
  'Croatia':        [8, 13],
  'HR':             [8, 13],
  'Ukraine':        [10, 9],
  'UA':             [10, 9],

  // === NECK (Middle East) — cols 11-16, rows 8-15 ===
  'Turkey':         [13, 9],
  'TR':             [13, 9],
  'Israel':         [12, 14],
  'IL':             [12, 14],
  'Egypt':          [13, 14],
  'EG':             [13, 14],
  'UAE':            [15, 14],
  'AE':             [15, 14],

  // === BODY (Americas / Central) — cols 17-25, rows 7-16 ===
  'United States':  [21, 9],
  'US':             [21, 9],
  'USA':            [21, 9],
  'Canada':         [20, 8],
  'CA':             [20, 8],
  'Mexico':         [19, 14],
  'MX':             [19, 14],
  'Brazil':         [22, 14],
  'BR':             [22, 14],
  'Argentina':      [23, 15],
  'AR':             [23, 15],
  'Colombia':       [20, 13],
  'CO':             [20, 13],
  'Russia':         [22, 8],
  'RU':             [22, 8],

  // === UPPER LEG (Asia) — cols 26-33, rows 4-9 ===
  'India':          [29, 7],
  'IN':             [29, 7],
  'China':          [30, 6],
  'CN':             [30, 6],
  'Japan':          [33, 5],
  'JP':             [33, 5],
  'South Korea':    [32, 6],
  'KR':             [32, 6],
  'Pakistan':       [28, 8],
  'PK':             [28, 8],
  'Thailand':       [30, 8],
  'TH':             [30, 8],
  'Vietnam':        [31, 7],
  'VN':             [31, 7],
  'Taiwan':         [33, 7],
  'TW':             [33, 7],

  // === LOWER LEG (Oceania / Africa) — cols 26-35, rows 13-19 ===
  'Nigeria':        [27, 14],
  'NG':             [27, 14],
  'Kenya':          [28, 15],
  'KE':             [28, 15],
  'South Africa':   [29, 17],
  'ZA':             [29, 17],
  'Australia':      [31, 16],
  'AU':             [31, 16],
  'New Zealand':    [34, 16],
  'NZ':             [34, 16],
  'Indonesia':      [30, 15],
  'ID':             [30, 15],
  'Philippines':    [32, 14],
  'PH':             [32, 14],
  'Singapore':      [29, 16],
  'SG':             [29, 16],
  'Malaysia':       [30, 16],
  'MY':             [30, 16],
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
                  fill={isActive ? ACTIVE : (FILL[cell] ?? FILL[2])}
                />
              )
            })
          )}

          {/* Agent dots — 3×3 pixel squares */}
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
