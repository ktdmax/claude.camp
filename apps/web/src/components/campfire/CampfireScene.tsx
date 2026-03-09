'use client'

import { useEffect, useState } from 'react'
import { Cici, CampfireSvg } from '@claudecamp/campfire'
import type { CiciState } from '@claudecamp/campfire'
import { CampfireFeed } from './CampfireFeed'
import { MCP_URL } from '@/lib/config'

const MAX_VISIBLE_CICIS = 12

interface CampfireCici {
  id: string
  state: CiciState
  position: { x: number; y: number }
}

// Distribute Cicis in a semicircle around the fire
function layoutCicis(count: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = []
  const centerX = 50 // percent
  const centerY = 65 // percent (fire is slightly above center)
  const radiusX = 30
  const radiusY = 15

  for (let i = 0; i < count; i++) {
    // Distribute from -PI to 0 (bottom semicircle = sitting around fire)
    const angle = Math.PI + (Math.PI * (i + 0.5)) / count
    positions.push({
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    })
  }
  return positions
}

export function CampfireScene() {
  const [onlineCount, setOnlineCount] = useState(0)
  const [cicis, setCicis] = useState<CampfireCici[]>([])

  useEffect(() => {
    // Fetch online count from MCP health endpoint
    async function fetchHealth() {
      try {
        const res = await fetch(`${MCP_URL}/mcp/health`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as { agents_online: number }
        setOnlineCount(data.agents_online)

        const count = Math.min(data.agents_online, MAX_VISIBLE_CICIS)
        const positions = layoutCicis(count)
        const states: CiciState[] = ['idle', 'working', 'idle', 'celebrating', 'idle', 'thinking']

        setCicis(
          positions.map((pos, i) => ({
            id: `cici-${i}`,
            state: states[i % states.length] as CiciState,
            position: pos,
          }))
        )
      } catch {
        // Health check failed — show empty campfire
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => clearInterval(interval)
  }, [])

  const extraCount = onlineCount - MAX_VISIBLE_CICIS

  return (
    <div className="scene-wrapper">
      <div className="campfire-area">
        {/* The fire */}
        <div className="fire-container">
          <CampfireSvg size={120} />
        </div>

        {/* Cicis around the fire */}
        {cicis.map((cici) => (
          <div
            key={cici.id}
            className="cici-container"
            style={{
              left: `${cici.position.x}%`,
              top: `${cici.position.y}%`,
            }}
          >
            <Cici state={cici.state} size={36} />
          </div>
        ))}

        {/* Extra count badge */}
        {extraCount > 0 && (
          <div className="extra-badge">+{extraCount} more</div>
        )}

        {/* Online count */}
        <div className="online-count">
          {onlineCount} {onlineCount === 1 ? 'Cici' : 'Cicis'} online
        </div>
      </div>

      <CampfireFeed />

      <style>{`
        .scene-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }
        .campfire-area {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .fire-container {
          position: absolute;
          left: 50%;
          top: 55%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }
        .cici-container {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 3;
          transition: left 1s ease-in-out, top 1s ease-in-out;
        }
        .extra-badge {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          color: #8A8A9A;
          background: #1A1A2E;
          padding: 0.25rem 0.75rem;
          border-radius: 2px;
          z-index: 4;
        }
        .online-count {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          font-size: 0.75rem;
          color: #8A8A9A;
        }
        @media (max-width: 768px) {
          .scene-wrapper {
            flex-direction: column;
          }
          .campfire-area {
            min-height: 60vh;
          }
        }
      `}</style>
    </div>
  )
}
