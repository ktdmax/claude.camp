'use client'

import { useEffect, useState, useMemo } from 'react'

const GRID_W = 120
const GRID_H = 60
const PX = 8 // pixel size in SVG units

// Country → [x%, y%] on the grid (0-100%)
const COUNTRY_POS: Record<string, [number, number]> = {
  'Austria': [54.2, 18.3], 'AT': [54.2, 18.3],
  'Germany': [53.3, 15.3], 'DE': [53.3, 15.3],
  'Switzerland': [52.5, 17.8], 'CH': [52.5, 17.8],
  'United States': [25, 25], 'US': [25, 25], 'USA': [25, 25],
  'United Kingdom': [50, 16], 'UK': [50, 16], 'GB': [50, 16],
  'France': [50.5, 19], 'FR': [50.5, 19],
  'Netherlands': [52, 14.5], 'NL': [52, 14.5],
  'Japan': [89, 25], 'JP': [89, 25],
  'India': [71, 40], 'IN': [71, 40],
  'Brazil': [37, 62], 'BR': [37, 62],
  'Canada': [22, 14], 'CA': [22, 14],
  'Australia': [91, 70], 'AU': [91, 70],
  'Sweden': [52, 9], 'SE': [52, 9],
  'Norway': [51, 7], 'NO': [51, 7],
  'Finland': [54, 7], 'FI': [54, 7],
  'Denmark': [52.5, 12.5], 'DK': [52.5, 12.5],
  'Poland': [55.5, 15], 'PL': [55.5, 15],
  'Spain': [49, 22], 'ES': [49, 22],
  'Italy': [52.5, 22], 'IT': [52.5, 22],
  'Portugal': [47, 22.5], 'PT': [47, 22.5],
  'Belgium': [51.5, 16.5], 'BE': [51.5, 16.5],
  'Czech Republic': [54.5, 16.5], 'CZ': [54.5, 16.5], 'Czechia': [54.5, 16.5],
  'Ireland': [48, 15], 'IE': [48, 15],
  'South Korea': [85.5, 24], 'KR': [85.5, 24],
  'Singapore': [79, 50.5], 'SG': [79, 50.5],
  'Israel': [59, 28], 'IL': [59, 28],
  'China': [82, 24], 'CN': [82, 24],
  'Mexico': [22, 36], 'MX': [22, 36],
  'Argentina': [35, 73], 'AR': [35, 73],
  'Colombia': [27, 48], 'CO': [27, 48],
  'Romania': [57, 17.5], 'RO': [57, 17.5],
  'Ukraine': [58, 14], 'UA': [58, 14],
  'Turkey': [59.5, 21], 'TR': [59.5, 21],
  'New Zealand': [97, 72], 'NZ': [97, 72],
  'South Africa': [56, 73], 'ZA': [56, 73],
  'Nigeria': [53, 46], 'NG': [53, 46],
  'Kenya': [60, 50], 'KE': [60, 50],
  'Indonesia': [82, 53], 'ID': [82, 53],
  'Philippines': [87, 42], 'PH': [87, 42],
  'Thailand': [79.5, 42], 'TH': [79.5, 42],
  'Vietnam': [81.5, 40], 'VN': [81.5, 40],
  'Taiwan': [87, 30], 'TW': [87, 30],
  'Russia': [72, 10], 'RU': [72, 10],
  'Estonia': [55, 10], 'EE': [55, 10],
  'Hungary': [55, 17.5], 'HU': [55, 17.5],
  'Croatia': [54.5, 19.5], 'HR': [54.5, 19.5],
  'Chile': [33, 68], 'CL': [33, 68],
  'Peru': [27, 56], 'PE': [27, 56],
  'Egypt': [59, 32], 'EG': [59, 32],
  'Pakistan': [73, 30], 'PK': [73, 30],
  'UAE': [67, 33], 'AE': [67, 33],
  'Malaysia': [79.5, 48], 'MY': [79.5, 48],
}

// Build the pixel map from geometric shapes
function generateLandmass(): Set<string> {
  const land = new Set<string>()

  function fill(x1: number, y1: number, x2: number, y2: number) {
    for (let y = Math.max(0, y1); y <= Math.min(GRID_H - 1, y2); y++)
      for (let x = Math.max(0, x1); x <= Math.min(GRID_W - 1, x2); x++)
        land.add(`${x},${y}`)
  }

  function ellipse(cx: number, cy: number, rx: number, ry: number) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry
        if (dx * dx + dy * dy <= 1.0) land.add(`${x},${y}`)
      }
  }

  function cut(x1: number, y1: number, x2: number, y2: number) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        land.delete(`${x},${y}`)
  }

  function cutEllipse(cx: number, cy: number, rx: number, ry: number) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry
        if (dx * dx + dy * dy <= 1.0) land.delete(`${x},${y}`)
      }
  }

  // === NORTH AMERICA ===
  fill(7, 4, 12, 8)       // Alaska
  ellipse(22, 8, 12, 5)   // Canada
  fill(14, 5, 34, 7)      // Northern Canada
  fill(10, 4, 18, 6)      // NW Territories
  ellipse(26, 14, 8, 4)   // USA main
  fill(17, 12, 33, 16)    // USA
  fill(18, 16, 30, 18)    // Southern US
  fill(28, 14, 33, 18)    // US East coast
  cut(31, 16, 34, 18)     // SE coast shape
  fill(17, 17, 23, 19)    // Texas/Gulf
  fill(18, 19, 22, 22)    // Mexico
  fill(19, 22, 22, 24)    // Central America
  fill(20, 24, 22, 26)    // Central America narrow
  cut(24, 8, 26, 10)      // Hudson Bay
  fill(35, 2, 40, 7)      // Greenland
  fill(36, 1, 39, 8)      // Greenland

  // === SOUTH AMERICA ===
  fill(27, 27, 37, 30)    // Northern SA / Venezuela
  fill(28, 30, 40, 33)    // Brazil north
  fill(30, 33, 42, 36)    // Brazil central
  fill(31, 36, 41, 38)    // Brazil south
  fill(30, 38, 39, 40)    // Paraguay/Uruguay area
  fill(29, 40, 37, 42)    // Argentina north
  fill(29, 42, 35, 44)    // Argentina
  fill(29, 44, 33, 46)    // Patagonia
  fill(29, 46, 31, 47)    // Patagonia tip
  cut(38, 27, 42, 30)     // Shape NE coast

  // === EUROPE ===
  fill(48, 9, 50, 12)     // UK/Ireland
  fill(51, 8, 53, 12)     // UK
  fill(52, 5, 54, 8)      // Norway/Sweden
  fill(54, 4, 56, 9)      // Scandinavia
  fill(57, 5, 59, 8)      // Finland
  fill(50, 12, 58, 14)    // Western Europe belt
  fill(55, 10, 62, 13)    // Central Europe
  fill(58, 9, 64, 12)     // Eastern Europe
  fill(64, 9, 68, 13)     // Eastern Europe / Baltics
  fill(49, 14, 52, 17)    // Iberian peninsula
  fill(53, 14, 57, 16)    // France south
  fill(57, 14, 60, 16)    // Alps / N. Italy
  fill(58, 16, 60, 19)    // Italy boot
  fill(60, 14, 64, 17)    // Balkans
  fill(61, 17, 63, 19)    // Greece
  fill(63, 18, 66, 20)    // Turkey west

  // === RUSSIA / CENTRAL ASIA ===
  fill(58, 5, 80, 9)      // Russia west
  fill(68, 4, 95, 8)      // Russia central
  fill(80, 3, 100, 7)     // Siberia
  fill(95, 4, 110, 8)     // Far east Russia
  fill(100, 5, 112, 9)    // Russian far east
  fill(68, 9, 90, 12)     // Russia south / Steppe
  fill(75, 12, 85, 14)    // Central Asia
  cut(108, 3, 115, 7)     // Shape far east coast
  cut(95, 8, 100, 10)     // Baikal area shaping

  // === MIDDLE EAST ===
  fill(66, 18, 76, 22)    // Middle East
  fill(68, 22, 74, 25)    // Arabian Peninsula
  fill(67, 20, 70, 24)    // Arabia west
  cut(71, 23, 73, 26)     // Persian Gulf
  cut(64, 20, 66, 22)     // Mediterranean east

  // === AFRICA ===
  fill(47, 19, 62, 22)    // North Africa
  fill(48, 22, 63, 26)    // Sahara/Sahel
  fill(49, 26, 64, 30)    // West/Central Africa
  fill(50, 30, 66, 34)    // Central Africa
  fill(52, 34, 67, 38)    // East Africa
  fill(54, 38, 66, 42)    // Southern Africa
  fill(55, 42, 65, 44)    // South Africa
  fill(57, 44, 63, 45)    // South Africa tip
  cut(47, 25, 49, 30)     // Gulf of Guinea shape
  fill(68, 34, 70, 38)    // Madagascar

  // === INDIA ===
  fill(76, 16, 80, 19)    // Pakistan/NW India
  fill(78, 19, 84, 23)    // Northern India
  fill(79, 23, 85, 27)    // Central India
  fill(80, 27, 84, 30)    // Southern India
  fill(81, 30, 83, 32)    // India tip
  fill(84, 31, 85, 32)    // Sri Lanka

  // === CHINA / EAST ASIA ===
  fill(85, 12, 100, 16)   // China north
  fill(83, 16, 100, 20)   // China central
  fill(86, 20, 98, 23)    // China south
  fill(90, 23, 96, 25)    // Southern China
  fill(100, 13, 102, 17)  // Korea
  fill(104, 12, 107, 16)  // Japan main
  fill(105, 16, 107, 18)  // Japan south
  fill(103, 10, 105, 13)  // Hokkaido

  // === SOUTHEAST ASIA ===
  fill(78, 25, 83, 28)    // Myanmar/Thailand
  fill(80, 28, 84, 32)    // Malaysia peninsula
  fill(82, 32, 84, 34)    // Malay tip
  fill(83, 25, 87, 30)    // Vietnam/Laos/Cambodia
  fill(86, 30, 89, 34)    // Philippines

  // === INDONESIA ===
  fill(80, 33, 86, 35)    // Sumatra
  fill(82, 35, 90, 37)    // Java/Borneo
  fill(87, 33, 94, 36)    // Borneo/Sulawesi
  fill(90, 36, 98, 38)    // Lesser Sunda/Papua west
  fill(96, 34, 102, 37)   // Papua

  // === AUSTRALIA ===
  fill(103, 38, 114, 42)  // Australia north
  fill(102, 42, 115, 45)  // Australia central
  fill(103, 45, 114, 47)  // Australia south
  fill(105, 47, 112, 48)  // Australia bottom
  cut(108, 38, 112, 40)   // Gulf of Carpentaria
  cut(102, 46, 104, 48)   // Great Australian Bight shape

  // === NEW ZEALAND ===
  fill(116, 43, 117, 45)  // North Island
  fill(115, 45, 117, 47)  // South Island

  return land
}

interface CountryData {
  countries: Record<string, number>
}

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)

  const landCells = useMemo(() => generateLandmass(), [])

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
        const data = await res.json() as CountryData
        setCountries(data.countries)
        setTotal(Object.values(data.countries).reduce((a, b) => a + b, 0))
      } catch { /* noop */ }
    }
    fetchCountries()
  }, [])

  const svgW = GRID_W * PX
  const svgH = GRID_H * PX

  return (
    <div className="world-map-page">
      <div className="map-header">
        <a href="/" className="back-link">← fire</a>
        <span className="map-title">world</span>
        <span className="map-count">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>

      <div className="map-viewport">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="pixel-map"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle grid */}
          <defs>
            <pattern id="grid" width={PX} height={PX} patternUnits="userSpaceOnUse">
              <rect width={PX} height={PX} fill="none" stroke="#141425" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width={svgW} height={svgH} fill="url(#grid)" />

          {/* Land pixels */}
          {Array.from(landCells).map((key) => {
            const [x, y] = key.split(',').map(Number)
            return (
              <rect
                key={key}
                x={x! * PX}
                y={y! * PX}
                width={PX}
                height={PX}
                fill="#1E1E35"
                stroke="#252545"
                strokeWidth="0.3"
              />
            )
          })}

          {/* Country dots */}
          {Object.entries(countries).map(([country, count]) => {
            const pos = COUNTRY_POS[country]
            if (!pos) return null
            const cx = (pos[0] / 100) * svgW
            const cy = (pos[1] / 100) * svgH
            const r = Math.max(5, Math.min(14, 5 + count * 2))
            const isHovered = hoveredCountry === country

            return (
              <g
                key={country}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{ cursor: 'default' }}
              >
                {/* Outer pulse ring */}
                <circle cx={cx} cy={cy} r={r * 3} fill="#E8572A" opacity={0.08} className="pulse-outer" />
                <circle cx={cx} cy={cy} r={r * 2} fill="#E8572A" opacity={0.15} className="pulse-inner" />
                {/* Dot */}
                <circle cx={cx} cy={cy} r={r} fill="#E8572A" filter="url(#glow)" />
                {/* Count inside dot */}
                {count > 1 && (
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#0D0D1A" fontSize={r * 1.1} fontWeight="bold" fontFamily="monospace">{count}</text>
                )}
                {/* Tooltip */}
                {isHovered && (
                  <g>
                    <rect x={cx - 40} y={cy - r - 22} width={80} height={18} fill="#0D0D1A" stroke="#E8572A" strokeWidth="1" />
                    <text x={cx} y={cy - r - 10} textAnchor="middle" fill="#F5F0E8" fontSize="9" fontFamily="monospace">
                      {country} · {count} {count === 1 ? 'Cici' : 'Cicis'}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <style>{`
        .world-map-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0D0D1A;
          overflow: hidden;
        }
        .map-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid #1A1A2E;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .back-link { color: #8A8A9A; text-decoration: none; }
        .back-link:hover { color: #F5F0E8; }
        .map-title {
          color: #F5F0E8;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.75rem;
        }
        .map-count {
          color: #8A8A9A;
          margin-left: auto;
          font-size: 0.7rem;
        }
        .map-viewport {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2rem;
        }
        .pixel-map {
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 50px);
        }
        .pulse-outer {
          animation: pulse-out 2.5s ease-in-out infinite;
        }
        .pulse-inner {
          animation: pulse-in 2.5s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        @keyframes pulse-out {
          0%, 100% { r: inherit; opacity: 0.05; }
          50% { opacity: 0.12; }
        }
        @keyframes pulse-in {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}
