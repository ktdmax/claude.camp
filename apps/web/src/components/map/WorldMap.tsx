'use client'

import { useEffect, useRef, useState } from 'react'

// Country name/code → approximate centroid [lat, lng]
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'Austria': [47.5, 13.5], 'AT': [47.5, 13.5],
  'Germany': [51.2, 10.5], 'DE': [51.2, 10.5],
  'Switzerland': [46.8, 8.2], 'CH': [46.8, 8.2],
  'United States': [39.8, -98.6], 'US': [39.8, -98.6], 'USA': [39.8, -98.6],
  'United Kingdom': [54.0, -2.0], 'UK': [54.0, -2.0], 'GB': [54.0, -2.0],
  'France': [46.6, 2.2], 'FR': [46.6, 2.2],
  'Netherlands': [52.1, 5.3], 'NL': [52.1, 5.3],
  'Japan': [36.2, 138.3], 'JP': [36.2, 138.3],
  'India': [20.6, 79.0], 'IN': [20.6, 79.0],
  'Brazil': [-14.2, -51.9], 'BR': [-14.2, -51.9],
  'Canada': [56.1, -106.3], 'CA': [56.1, -106.3],
  'Australia': [-25.3, 133.8], 'AU': [-25.3, 133.8],
  'Sweden': [60.1, 18.6], 'SE': [60.1, 18.6],
  'Norway': [60.5, 8.5], 'NO': [60.5, 8.5],
  'Finland': [61.9, 25.7], 'FI': [61.9, 25.7],
  'Denmark': [56.3, 9.5], 'DK': [56.3, 9.5],
  'Poland': [51.9, 19.1], 'PL': [51.9, 19.1],
  'Spain': [40.5, -3.7], 'ES': [40.5, -3.7],
  'Italy': [41.9, 12.6], 'IT': [41.9, 12.6],
  'Portugal': [39.4, -8.2], 'PT': [39.4, -8.2],
  'Belgium': [50.5, 4.5], 'BE': [50.5, 4.5],
  'Czech Republic': [49.8, 15.5], 'CZ': [49.8, 15.5], 'Czechia': [49.8, 15.5],
  'Ireland': [53.1, -7.7], 'IE': [53.1, -7.7],
  'South Korea': [35.9, 127.8], 'KR': [35.9, 127.8],
  'Singapore': [1.4, 103.8], 'SG': [1.4, 103.8],
  'Israel': [31.0, 34.9], 'IL': [31.0, 34.9],
  'China': [35.9, 104.2], 'CN': [35.9, 104.2],
  'Mexico': [23.6, -102.6], 'MX': [23.6, -102.6],
  'Argentina': [-38.4, -63.6], 'AR': [-38.4, -63.6],
  'Colombia': [4.6, -74.3], 'CO': [4.6, -74.3],
  'Romania': [45.9, 24.97], 'RO': [45.9, 24.97],
  'Ukraine': [48.4, 31.2], 'UA': [48.4, 31.2],
  'Turkey': [39.0, 35.2], 'TR': [39.0, 35.2],
  'New Zealand': [-40.9, 174.9], 'NZ': [-40.9, 174.9],
  'South Africa': [-30.6, 22.9], 'ZA': [-30.6, 22.9],
  'Nigeria': [9.1, 8.7], 'NG': [9.1, 8.7],
  'Kenya': [-0.02, 37.9], 'KE': [-0.02, 37.9],
  'Indonesia': [-0.8, 113.9], 'ID': [-0.8, 113.9],
  'Philippines': [12.9, 121.8], 'PH': [12.9, 121.8],
  'Thailand': [15.9, 100.9], 'TH': [15.9, 100.9],
  'Vietnam': [14.1, 108.3], 'VN': [14.1, 108.3],
  'Taiwan': [23.7, 121.0], 'TW': [23.7, 121.0],
  'Russia': [61.5, 105.3], 'RU': [61.5, 105.3],
  'Estonia': [58.6, 25.0], 'EE': [58.6, 25.0],
  'Latvia': [56.9, 24.1], 'LV': [56.9, 24.1],
  'Lithuania': [55.2, 23.9], 'LT': [55.2, 23.9],
  'Hungary': [47.2, 19.5], 'HU': [47.2, 19.5],
  'Croatia': [45.1, 15.2], 'HR': [45.1, 15.2],
}

interface CountryData {
  countries: Record<string, number>
}

export function WorldMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [countries, setCountries] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const mapInstanceRef = useRef<unknown>(null)

  // Fetch country data
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
        const data = await res.json() as CountryData
        setCountries(data.countries)
        setTotal(Object.values(data.countries).reduce((a, b) => a + b, 0))
      } catch {
        // API unavailable
      }
    }
    fetchCountries()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default

      const map = L.map(mapRef.current!, {
        center: [30, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        zoomControl: false,
        attributionControl: false,
      })

      // CartoDB Dark Matter — free, no API key
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
      }).addTo(map)

      L.control.zoom({ position: 'bottomleft' }).addTo(map)

      mapInstanceRef.current = map
    }

    initMap()
  }, [])

  // Add/update dots when country data changes
  useEffect(() => {
    if (!mapInstanceRef.current || Object.keys(countries).length === 0) return

    async function addDots() {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current as L.Map

      for (const [country, count] of Object.entries(countries)) {
        const coords = COUNTRY_COORDS[country]
        if (!coords) continue

        const radius = Math.max(6, Math.min(20, 6 + count * 2))

        const dot = L.circleMarker(coords, {
          radius,
          fillColor: '#E8572A',
          fillOpacity: 0.8,
          color: '#E8572A',
          weight: 1,
          opacity: 0.4,
        })

        dot.bindTooltip(`${country}: ${count} ${count === 1 ? 'Cici' : 'Cicis'}`, {
          className: 'map-tooltip',
          direction: 'top',
        })

        dot.addTo(map)
      }
    }

    addDots()
  }, [countries])

  return (
    <div className="world-map-page">
      <div className="map-header">
        <a href="/" className="back-link">← fire</a>
        <span className="map-title">world map</span>
        <span className="map-count">{total} {total === 1 ? 'Cici' : 'Cicis'} worldwide</span>
      </div>
      <div ref={mapRef} className="map-container" />

      <style>{`
        .world-map-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0D0D1A;
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
        .map-container {
          flex: 1;
          background: #0D0D1A;
        }
        .map-tooltip {
          background: #1A1A2E !important;
          color: #F5F0E8 !important;
          border: 1px solid #E8572A !important;
          font-family: var(--font-mono) !important;
          font-size: 0.75rem !important;
          padding: 0.3rem 0.6rem !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .map-tooltip::before {
          border-top-color: #E8572A !important;
        }
        /* Override Leaflet defaults for dark theme */
        .leaflet-container {
          background: #0D0D1A !important;
        }
      `}</style>
    </div>
  )
}
