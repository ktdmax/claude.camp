'use client'

import { useEffect, useState } from 'react'

// Grid: 20 columns × 10 rows
// Country → [col, row] (0-indexed)
const COUNTRY_CELL: Record<string, [number, number]> = {
  'United States': [4, 3], 'US': [4, 3], 'USA': [4, 3],
  'Canada': [4, 2], 'CA': [4, 2],
  'Mexico': [3, 4], 'MX': [3, 4],
  'Brazil': [6, 6], 'BR': [6, 6],
  'Argentina': [5, 7], 'AR': [5, 7],
  'Colombia': [5, 5], 'CO': [5, 5],
  'Chile': [5, 8], 'CL': [5, 8],
  'Peru': [4, 6], 'PE': [4, 6],
  'United Kingdom': [10, 2], 'UK': [10, 2], 'GB': [10, 2],
  'Ireland': [9, 2], 'IE': [9, 2],
  'France': [10, 3], 'FR': [10, 3],
  'Spain': [10, 3], 'ES': [10, 3],
  'Portugal': [9, 3], 'PT': [9, 3],
  'Germany': [11, 2], 'DE': [11, 2],
  'Austria': [11, 3], 'AT': [11, 3],
  'Switzerland': [10, 3], 'CH': [10, 3],
  'Netherlands': [10, 2], 'NL': [10, 2],
  'Belgium': [10, 3], 'BE': [10, 3],
  'Italy': [11, 3], 'IT': [11, 3],
  'Poland': [11, 2], 'PL': [11, 2],
  'Czech Republic': [11, 3], 'CZ': [11, 3], 'Czechia': [11, 3],
  'Romania': [12, 3], 'RO': [12, 3],
  'Hungary': [11, 3], 'HU': [11, 3],
  'Croatia': [11, 3], 'HR': [11, 3],
  'Sweden': [11, 1], 'SE': [11, 1],
  'Norway': [10, 1], 'NO': [10, 1],
  'Finland': [11, 1], 'FI': [11, 1],
  'Denmark': [10, 2], 'DK': [10, 2],
  'Estonia': [11, 2], 'EE': [11, 2],
  'Latvia': [11, 2], 'LV': [11, 2],
  'Lithuania': [11, 2], 'LT': [11, 2],
  'Ukraine': [12, 2], 'UA': [12, 2],
  'Russia': [14, 2], 'RU': [14, 2],
  'Turkey': [12, 3], 'TR': [12, 3],
  'Israel': [12, 4], 'IL': [12, 4],
  'Egypt': [12, 4], 'EG': [12, 4],
  'Nigeria': [11, 5], 'NG': [11, 5],
  'Kenya': [12, 5], 'KE': [12, 5],
  'South Africa': [12, 7], 'ZA': [12, 7],
  'Morocco': [10, 4], 'MA': [10, 4],
  'UAE': [13, 4], 'AE': [13, 4],
  'Pakistan': [14, 4], 'PK': [14, 4],
  'India': [15, 4], 'IN': [15, 4],
  'Bangladesh': [15, 4], 'BD': [15, 4],
  'China': [16, 3], 'CN': [16, 3],
  'Japan': [17, 3], 'JP': [17, 3],
  'South Korea': [17, 3], 'KR': [17, 3],
  'Taiwan': [17, 4], 'TW': [17, 4],
  'Thailand': [16, 4], 'TH': [16, 4],
  'Vietnam': [16, 4], 'VN': [16, 4],
  'Malaysia': [16, 5], 'MY': [16, 5],
  'Singapore': [16, 5], 'SG': [16, 5],
  'Indonesia': [17, 5], 'ID': [17, 5],
  'Philippines': [17, 4], 'PH': [17, 4],
  'Australia': [18, 7], 'AU': [18, 7],
  'New Zealand': [19, 8], 'NZ': [19, 8],
}

// Simplified world landmass SVG paths (equirectangular, viewBox 0 0 1000 500)
const CONTINENTS = [
  // North America
  'M 55,55 L 80,50 100,48 130,52 160,60 185,55 200,65 225,60 240,75 255,90 240,105 220,110 200,130 195,145 210,150 225,155 230,165 228,175 215,180 195,200 185,210 180,220 178,230 170,225 160,210 145,195 130,175 120,160 100,145 85,130 75,115 60,100 50,85 48,70 Z',
  // Greenland
  'M 280,35 L 310,30 330,35 340,50 335,65 320,75 300,78 285,70 275,55 Z',
  // South America
  'M 200,240 L 220,235 240,240 260,235 275,240 285,250 290,265 295,280 300,300 295,320 290,335 280,350 270,365 260,375 250,380 240,390 235,400 230,395 225,380 230,365 225,345 220,330 210,315 200,295 195,275 190,260 195,248 Z',
  // Europe
  'M 460,55 L 475,50 490,48 500,52 510,45 520,48 530,55 540,58 535,65 530,70 540,75 535,82 540,88 548,92 555,95 558,100 555,105 560,110 565,115 558,120 548,118 540,115 530,112 520,105 510,100 500,95 490,85 480,78 470,72 465,65 Z',
  // Africa
  'M 465,130 L 490,125 510,120 530,122 555,125 568,130 575,140 578,150 580,165 575,180 578,195 582,210 585,225 590,240 595,260 598,280 600,300 595,315 585,330 575,340 565,345 555,340 545,335 535,340 525,330 515,310 510,295 500,275 495,260 492,245 488,230 485,215 480,200 478,185 475,170 470,155 465,140 Z',
  // Asia (mainland)
  'M 540,45 L 555,40 570,38 590,40 610,35 630,32 660,30 690,28 720,30 750,32 780,35 800,40 820,42 840,48 860,52 870,58 860,60 840,55 820,58 810,55 820,65 830,72 840,80 835,85 815,88 800,82 785,88 770,95 760,100 750,110 740,120 730,115 720,105 710,100 700,95 690,100 680,110 670,115 660,120 650,115 640,110 630,108 620,105 615,110 610,115 600,112 590,108 580,102 570,95 565,88 560,80 555,72 550,65 548,58 Z',
  // India
  'M 640,120 L 660,118 680,122 690,130 695,142 700,155 698,170 690,182 680,190 668,195 658,190 648,178 640,165 635,150 630,140 632,130 Z',
  // Southeast Asia peninsula
  'M 720,118 L 730,120 738,128 742,140 740,155 735,165 730,170 725,160 718,148 715,135 718,125 Z',
  // Japan
  'M 848,70 L 855,65 860,70 862,80 858,90 855,98 850,102 845,95 842,85 843,78 Z',
  // Indonesia
  'M 720,180 L 740,178 755,180 770,178 788,180 798,182 810,185 815,190 810,195 795,192 780,195 765,192 750,195 735,192 725,190 720,185 Z',
  // Australia
  'M 810,275 L 835,268 860,265 880,268 895,275 900,290 895,305 888,318 878,325 865,330 848,328 835,322 825,315 818,305 812,295 810,285 Z',
  // New Zealand
  'M 920,325 L 928,320 932,328 930,340 925,348 920,340 Z',
  // UK
  'M 478,58 L 485,55 490,58 492,65 495,72 492,78 488,82 484,78 480,72 478,65 Z',
  // Madagascar
  'M 600,300 L 608,295 612,302 610,315 605,322 600,318 598,308 Z',
]

export function WorldMap() {
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

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

  // Aggregate dots per grid cell (multiple countries can share a cell)
  const cellDots: Record<string, { count: number; names: string[] }> = {}
  for (const [country, count] of Object.entries(countries)) {
    const cell = COUNTRY_CELL[country]
    if (!cell) continue
    const key = `${cell[0]},${cell[1]}`
    if (!cellDots[key]) cellDots[key] = { count: 0, names: [] }
    cellDots[key].count += count
    cellDots[key].names.push(`${country} · ${count}`)
  }

  return (
    <div className="wm-page">
      <div className="wm-header">
        <a href="/" className="wm-back">← fire</a>
        <span className="wm-title">world</span>
        <span className="wm-count">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>

      <div className="wm-container">
        {/* SVG world map background */}
        <svg className="wm-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} fill="#1C1C32" stroke="#2A2A48" strokeWidth="1" />
          ))}
        </svg>

        {/* Grid overlay with dots */}
        <div className="wm-grid">
          {Object.entries(cellDots).map(([key, dot]) => {
            const [col, row] = key.split(',').map(Number)
            const isHov = hovered === key
            return (
              <div
                key={key}
                className="wm-dot-cell"
                style={{ gridColumn: col! + 1, gridRow: row! + 1 }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="wm-pulse" />
                <div className="wm-dot">
                  {dot.count > 1 && <span className="wm-dot-count">{dot.count}</span>}
                </div>
                {isHov && (
                  <div className="wm-tooltip">
                    {dot.names.map((n, i) => <div key={i}>{n}</div>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .wm-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0D0D1A;
          overflow: hidden;
        }
        .wm-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid #1A1A2E;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .wm-back { color: #8A8A9A; text-decoration: none; }
        .wm-back:hover { color: #F5F0E8; }
        .wm-title { color: #F5F0E8; text-transform: uppercase; letter-spacing: 0.15em; font-size: 0.75rem; }
        .wm-count { color: #8A8A9A; margin-left: auto; font-size: 0.7rem; }
        .wm-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .wm-svg {
          position: absolute;
          inset: 2rem;
          width: calc(100% - 4rem);
          height: calc(100% - 4rem);
          object-fit: contain;
        }
        .wm-grid {
          position: absolute;
          inset: 2rem;
          width: calc(100% - 4rem);
          height: calc(100% - 4rem);
          display: grid;
          grid-template-columns: repeat(20, 1fr);
          grid-template-rows: repeat(10, 1fr);
          pointer-events: none;
        }
        .wm-dot-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          cursor: default;
        }
        .wm-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E8572A;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px 2px rgba(232, 87, 42, 0.5);
          position: relative;
          z-index: 2;
        }
        .wm-dot-count {
          font-size: 8px;
          color: #0D0D1A;
          font-weight: bold;
          font-family: monospace;
        }
        .wm-pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(232, 87, 42, 0.2);
          animation: wm-pulse 2s ease-in-out infinite;
          z-index: 1;
        }
        @keyframes wm-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.8); opacity: 0; }
        }
        .wm-tooltip {
          position: absolute;
          bottom: calc(50% + 14px);
          left: 50%;
          transform: translateX(-50%);
          background: #0D0D1A;
          border: 1px solid #E8572A;
          padding: 4px 10px;
          font-size: 10px;
          color: #F5F0E8;
          font-family: monospace;
          white-space: nowrap;
          z-index: 10;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .wm-container { padding: 1rem; }
          .wm-svg { inset: 1rem; width: calc(100% - 2rem); height: calc(100% - 2rem); }
          .wm-grid { inset: 1rem; width: calc(100% - 2rem); height: calc(100% - 2rem); }
        }
      `}</style>
    </div>
  )
}
