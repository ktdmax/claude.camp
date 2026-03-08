'use client'

import { useEffect, useState } from 'react'

// Country → approximate [x%, y%] position on equirectangular projection
const COUNTRY_POS: Record<string, [number, number]> = {
  'Austria': [53.5, 32.5], 'AT': [53.5, 32.5],
  'Germany': [52, 31], 'DE': [52, 31],
  'Switzerland': [51.5, 32.5], 'CH': [51.5, 32.5],
  'United States': [22, 38], 'US': [22, 38], 'USA': [22, 38],
  'United Kingdom': [49.5, 28.5], 'UK': [49.5, 28.5], 'GB': [49.5, 28.5],
  'France': [50.5, 31.5], 'FR': [50.5, 31.5],
  'Netherlands': [51.5, 30], 'NL': [51.5, 30],
  'Japan': [86, 36], 'JP': [86, 36],
  'India': [75, 45], 'IN': [75, 45],
  'Brazil': [35, 58], 'BR': [35, 58],
  'Canada': [20, 30], 'CA': [20, 30],
  'Australia': [84, 65], 'AU': [84, 65],
  'Sweden': [53, 24], 'SE': [53, 24],
  'Norway': [52, 22], 'NO': [52, 22],
  'Finland': [55, 23], 'FI': [55, 23],
  'Denmark': [52.5, 27.5], 'DK': [52.5, 27.5],
  'Poland': [55, 30], 'PL': [55, 30],
  'Spain': [48.5, 35], 'ES': [48.5, 35],
  'Italy': [53, 34], 'IT': [53, 34],
  'Portugal': [47, 35.5], 'PT': [47, 35.5],
  'Belgium': [51, 30.5], 'BE': [51, 30.5],
  'Czech Republic': [54, 31], 'CZ': [54, 31], 'Czechia': [54, 31],
  'Ireland': [48, 29], 'IE': [48, 29],
  'South Korea': [84, 38], 'KR': [84, 38],
  'Singapore': [79, 52], 'SG': [79, 52],
  'Israel': [62, 39], 'IL': [62, 39],
  'China': [80, 38], 'CN': [80, 38],
  'Mexico': [17, 44], 'MX': [17, 44],
  'Argentina': [30, 68], 'AR': [30, 68],
  'Colombia': [26, 52], 'CO': [26, 52],
  'Romania': [56, 32], 'RO': [56, 32],
  'Ukraine': [58, 30], 'UA': [58, 30],
  'Turkey': [61, 34], 'TR': [61, 34],
  'New Zealand': [92, 68], 'NZ': [92, 68],
  'South Africa': [57, 66], 'ZA': [57, 66],
  'Nigeria': [52, 50], 'NG': [52, 50],
  'Kenya': [60, 52], 'KE': [60, 52],
  'Indonesia': [81, 53], 'ID': [81, 53],
  'Philippines': [83, 48], 'PH': [83, 48],
  'Thailand': [79, 47], 'TH': [79, 47],
  'Vietnam': [80, 47], 'VN': [80, 47],
  'Taiwan': [83, 42], 'TW': [83, 42],
  'Russia': [70, 25], 'RU': [70, 25],
  'Estonia': [55, 26], 'EE': [55, 26],
  'Latvia': [55, 27], 'LV': [55, 27],
  'Lithuania': [55, 28], 'LT': [55, 28],
  'Hungary': [55, 32], 'HU': [55, 32],
  'Croatia': [54, 33], 'HR': [54, 33],
  'Chile': [28, 66], 'CL': [28, 66],
  'Peru': [25, 57], 'PE': [25, 57],
  'Egypt': [59, 42], 'EG': [59, 42],
  'Morocco': [48, 39], 'MA': [48, 39],
  'Pakistan': [72, 41], 'PK': [72, 41],
  'Bangladesh': [77, 43], 'BD': [77, 43],
  'Malaysia': [79, 52], 'MY': [79, 52],
  'UAE': [67, 43], 'AE': [67, 43],
}

// Simplified world landmass as pixel-grid paths (low-res silhouettes)
// Each continent is a set of filled rectangles on an 80x40 grid
const PIXEL_SIZE = 12
const GRID_W = 80
const GRID_H = 40

// Continents as arrays of [x, y] grid cells
const LANDMASS: Array<[number, number]> = [
  // North America
  ...[
    [12,6],[13,6],[14,6],[15,6],[16,6],[17,6],
    [10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],[18,7],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],[18,8],[19,8],
    [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],
    [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
    [10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
    [11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
    [12,13],[13,13],[14,13],[15,13],
    [13,14],[14,14],[15,14],
    [13,15],[14,15],
  ] as Array<[number, number]>,
  // South America
  ...[
    [20,18],[21,18],[22,18],[23,18],
    [19,19],[20,19],[21,19],[22,19],[23,19],[24,19],
    [19,20],[20,20],[21,20],[22,20],[23,20],[24,20],
    [19,21],[20,21],[21,21],[22,21],[23,21],[24,21],[25,21],
    [20,22],[21,22],[22,22],[23,22],[24,22],[25,22],
    [20,23],[21,23],[22,23],[23,23],[24,23],
    [21,24],[22,24],[23,24],[24,24],
    [22,25],[23,25],[24,25],
    [22,26],[23,26],
    [22,27],[23,27],
    [23,28],
  ] as Array<[number, number]>,
  // Europe
  ...[
    [37,7],[38,7],[39,7],[40,7],[41,7],
    [36,8],[37,8],[38,8],[39,8],[40,8],[41,8],[42,8],
    [37,9],[38,9],[39,9],[40,9],[41,9],[42,9],[43,9],
    [37,10],[38,10],[39,10],[40,10],[41,10],[42,10],[43,10],[44,10],
    [38,11],[39,11],[40,11],[41,11],[42,11],[43,11],
    [39,12],[40,12],[41,12],[42,12],
    [39,13],[40,13],[41,13],
  ] as Array<[number, number]>,
  // Africa
  ...[
    [38,14],[39,14],[40,14],[41,14],[42,14],[43,14],
    [37,15],[38,15],[39,15],[40,15],[41,15],[42,15],[43,15],[44,15],
    [37,16],[38,16],[39,16],[40,16],[41,16],[42,16],[43,16],[44,16],[45,16],
    [37,17],[38,17],[39,17],[40,17],[41,17],[42,17],[43,17],[44,17],[45,17],
    [38,18],[39,18],[40,18],[41,18],[42,18],[43,18],[44,18],[45,18],
    [38,19],[39,19],[40,19],[41,19],[42,19],[43,19],[44,19],
    [39,20],[40,20],[41,20],[42,20],[43,20],[44,20],
    [39,21],[40,21],[41,21],[42,21],[43,21],
    [40,22],[41,22],[42,22],[43,22],
    [40,23],[41,23],[42,23],
    [41,24],[42,24],
    [41,25],
  ] as Array<[number, number]>,
  // Asia
  ...[
    [43,6],[44,6],[45,6],[46,6],[47,6],[48,6],[49,6],[50,6],[51,6],[52,6],[53,6],[54,6],[55,6],[56,6],
    [42,7],[43,7],[44,7],[45,7],[46,7],[47,7],[48,7],[49,7],[50,7],[51,7],[52,7],[53,7],[54,7],[55,7],[56,7],[57,7],[58,7],
    [44,8],[45,8],[46,8],[47,8],[48,8],[49,8],[50,8],[51,8],[52,8],[53,8],[54,8],[55,8],[56,8],[57,8],[58,8],[59,8],[60,8],
    [44,9],[45,9],[46,9],[47,9],[48,9],[49,9],[50,9],[51,9],[52,9],[53,9],[54,9],[55,9],[56,9],[57,9],[58,9],[59,9],[60,9],[61,9],
    [45,10],[46,10],[47,10],[48,10],[49,10],[50,10],[51,10],[52,10],[53,10],[54,10],[55,10],[56,10],[57,10],[58,10],[59,10],[60,10],
    [46,11],[47,11],[48,11],[49,11],[50,11],[51,11],[52,11],[53,11],[54,11],[55,11],[56,11],[57,11],[58,11],[59,11],
    [48,12],[49,12],[50,12],[51,12],[52,12],[53,12],[54,12],[55,12],[56,12],[57,12],[58,12],
    [50,13],[51,13],[52,13],[53,13],[54,13],[55,13],[56,13],[57,13],[58,13],
    [52,14],[53,14],[54,14],[55,14],[56,14],[57,14],
    [54,15],[55,15],[56,15],[57,15],
    [55,16],[56,16],[57,16],
    [56,17],[57,17],[58,17],
    [57,18],[58,18],[59,18],
    [58,19],[59,19],[60,19],
  ] as Array<[number, number]>,
  // Australia
  ...[
    [61,21],[62,21],[63,21],[64,21],[65,21],
    [60,22],[61,22],[62,22],[63,22],[64,22],[65,22],[66,22],
    [60,23],[61,23],[62,23],[63,23],[64,23],[65,23],[66,23],
    [61,24],[62,24],[63,24],[64,24],[65,24],[66,24],
    [61,25],[62,25],[63,25],[64,25],[65,25],
    [62,26],[63,26],[64,26],
  ] as Array<[number, number]>,
]

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
        const data = await res.json() as { countries: Record<string, number> }
        setCountries(data.countries)
        setTotal(Object.values(data.countries).reduce((a, b) => a + b, 0))
      } catch { /* noop */ }
    }
    fetchCountries()
  }, [])

  const svgW = GRID_W * PIXEL_SIZE
  const svgH = GRID_H * PIXEL_SIZE

  return (
    <div className="world-map-page">
      <div className="map-header">
        <a href="/" className="back-link">← fire</a>
        <span className="map-title">world map</span>
        <span className="map-count">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>

      <div className="map-viewport">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="pixel-map"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid background — very subtle */}
          <defs>
            <pattern id="grid" width={PIXEL_SIZE} height={PIXEL_SIZE} patternUnits="userSpaceOnUse">
              <rect width={PIXEL_SIZE} height={PIXEL_SIZE} fill="none" stroke="#1A1A2E" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            {/* Glow filter for dots */}
            <filter id="dot-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Pulse animation */}
            <radialGradient id="pulse-grad">
              <stop offset="0%" stopColor="#E8572A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#E8572A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle grid */}
          <rect width={svgW} height={svgH} fill="url(#grid)" />

          {/* Landmass pixels */}
          {LANDMASS.map(([x, y], i) => (
            <rect
              key={`land-${i}`}
              x={x * PIXEL_SIZE}
              y={y * PIXEL_SIZE}
              width={PIXEL_SIZE}
              height={PIXEL_SIZE}
              fill="#1A1A2E"
              stroke="#252540"
              strokeWidth="0.5"
            />
          ))}

          {/* Country dots */}
          {Object.entries(countries).map(([country, count]) => {
            const pos = COUNTRY_POS[country]
            if (!pos) return null
            const cx = (pos[0] / 100) * svgW
            const cy = (pos[1] / 100) * svgH
            const r = Math.max(4, Math.min(12, 4 + count * 2))

            return (
              <g key={country}>
                {/* Pulse ring */}
                <circle cx={cx} cy={cy} r={r * 3} fill="url(#pulse-grad)" className="pulse-ring" />
                {/* Dot */}
                <circle cx={cx} cy={cy} r={r} fill="#E8572A" filter="url(#dot-glow)" />
                {/* Count */}
                {count > 1 && (
                  <text
                    x={cx}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#0D0D1A"
                    fontSize={r * 1.2}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {count}
                  </text>
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
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #1A1A2E;
          font-size: 0.8rem;
        }
        .back-link {
          color: #8A8A9A;
          text-decoration: none;
        }
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
          padding: 1rem;
        }
        .pixel-map {
          width: 100%;
          height: 100%;
          max-width: 1200px;
        }
        .pulse-ring {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform-origin: center; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
