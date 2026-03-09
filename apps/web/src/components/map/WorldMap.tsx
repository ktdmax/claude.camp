'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Pixel size for the fire sprite
const S = 4

// Fire sprite — each frame is a 11×14 pixel art grid
// 0=transparent, 1=dark red, 2=red, 3=orange, 4=yellow, 5=bright yellow, 6=brown (logs)
const FIRE_FRAMES: number[][][] = [
  [
    [0,0,0,0,0,5,0,0,0,0,0],
    [0,0,0,0,5,4,0,0,0,0,0],
    [0,0,0,0,4,4,5,0,0,0,0],
    [0,0,0,4,4,5,4,0,0,0,0],
    [0,0,0,4,3,4,4,4,0,0,0],
    [0,0,4,3,3,3,4,4,0,0,0],
    [0,0,3,3,3,3,3,3,0,0,0],
    [0,3,3,2,3,3,2,3,3,0,0],
    [0,3,2,2,2,2,2,2,3,0,0],
    [0,2,2,1,2,2,1,2,2,0,0],
    [0,2,1,1,1,1,1,1,2,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,6,6,6,6,6,6,6,6,0,0],
    [6,6,6,6,6,6,6,6,6,6,0],
  ],
  [
    [0,0,0,0,0,0,5,0,0,0,0],
    [0,0,0,0,0,5,4,0,0,0,0],
    [0,0,0,0,4,5,4,0,0,0,0],
    [0,0,0,0,4,4,5,4,0,0,0],
    [0,0,0,4,4,3,4,4,0,0,0],
    [0,0,3,4,3,3,3,4,0,0,0],
    [0,0,3,3,3,3,3,3,0,0,0],
    [0,3,3,3,2,3,3,2,3,0,0],
    [0,3,2,2,2,2,2,2,3,0,0],
    [0,2,2,1,2,2,1,2,2,0,0],
    [0,2,1,1,1,1,1,1,2,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,6,6,6,6,6,6,6,6,0,0],
    [6,6,6,6,6,6,6,6,6,6,0],
  ],
  [
    [0,0,0,0,5,0,0,0,0,0,0],
    [0,0,0,5,4,5,0,0,0,0,0],
    [0,0,0,4,5,4,0,0,0,0,0],
    [0,0,0,4,4,4,4,0,0,0,0],
    [0,0,4,3,4,4,3,4,0,0,0],
    [0,0,4,3,3,3,3,4,0,0,0],
    [0,0,3,3,3,3,3,3,0,0,0],
    [0,3,2,3,3,2,3,3,3,0,0],
    [0,3,2,2,2,2,2,2,3,0,0],
    [0,2,1,2,2,2,2,1,2,0,0],
    [0,2,1,1,1,1,1,1,2,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,6,6,6,6,6,6,6,6,0,0],
    [6,6,6,6,6,6,6,6,6,6,0],
  ],
]

const FIRE_COLORS: Record<number, string> = {
  1: '#6B1010',  // dark red / ember
  2: '#C83218',  // red
  3: '#E8572A',  // orange (accent color)
  4: '#FF9933',  // yellow-orange
  5: '#FFD466',  // bright yellow
  6: '#3D2817',  // brown logs
}

// Simulated ~1000 agents
const SIM_COUNTRIES: Record<string, number> = {
  'United States': 287, 'United Kingdom': 82, 'Germany': 68, 'Canada': 52,
  'France': 42, 'India': 38, 'Australia': 32, 'Netherlands': 26,
  'Japan': 24, 'Brazil': 22, 'Sweden': 18, 'Poland': 17,
  'Spain': 16, 'Italy': 15, 'South Korea': 14, 'Switzerland': 13,
  'Austria': 12, 'China': 14, 'Ireland': 11, 'Belgium': 10,
  'Denmark': 9, 'Norway': 9, 'Finland': 8, 'Czech Republic': 7,
  'Portugal': 7, 'Ukraine': 7, 'Romania': 6, 'Turkey': 6,
  'Israel': 8, 'Singapore': 7, 'Taiwan': 6, 'Thailand': 5,
  'Vietnam': 4, 'Indonesia': 5, 'Philippines': 4, 'Mexico': 7,
  'Argentina': 5, 'Colombia': 4, 'Nigeria': 3, 'Kenya': 3,
  'South Africa': 5, 'New Zealand': 6, 'Malaysia': 4, 'Hungary': 4,
  'Croatia': 3, 'Morocco': 2, 'Egypt': 3, 'UAE': 5,
  'Pakistan': 3, 'Chile': 3, 'Peru': 2, 'Russia': 5,
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number // 0=red, 1=orange, 2=yellow
}

function createSpark(cx: number, cy: number): Spark {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8  // mostly upward, wide spread
  const speed = 0.3 + Math.random() * 0.8
  const maxLife = 120 + Math.random() * 200
  return {
    x: cx + (Math.random() - 0.5) * 20,
    y: cy - 10 + Math.random() * 6,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: Math.random() * maxLife,  // stagger initial spawns
    maxLife,
    size: Math.random() > 0.7 ? 2 : 1,
    hue: Math.floor(Math.random() * 3),
  }
}

export function WorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [total, setTotal] = useState(0)
  const sparksRef = useRef<Spark[]>([])
  const frameRef = useRef(0)
  const targetCountRef = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isSim = params.has('sim')

    if (isSim) {
      const t = Object.values(SIM_COUNTRIES).reduce((a, b) => a + b, 0)
      setTotal(t)
      targetCountRef.current = t
    } else {
      fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
        .then(r => r.json())
        .then((d: { countries: Record<string, number> }) => {
          const t = Object.values(d.countries).reduce((a, b) => a + b, 0)
          setTotal(t)
          targetCountRef.current = Math.max(t, 1)
        })
        .catch(() => { targetCountRef.current = 1; setTotal(1) })
    }
  }, [])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const fireCx = w / 2
    const fireCy = h * 0.55

    // Clear
    ctx.fillStyle = '#0D0D1A'
    ctx.fillRect(0, 0, w, h)

    // Draw fire sprite
    const frame = FIRE_FRAMES[Math.floor(frameRef.current / 8) % FIRE_FRAMES.length]!
    const fireW = frame[0]!.length
    const fireH = frame.length
    const fireX = Math.floor(fireCx - (fireW * S) / 2)
    const fireY = Math.floor(fireCy - (fireH * S) / 2)

    for (let fy = 0; fy < fireH; fy++) {
      for (let fx = 0; fx < fireW; fx++) {
        const v = frame[fy]![fx]!
        if (v === 0) continue
        // Add subtle flicker to flame pixels (not logs)
        let color = FIRE_COLORS[v]!
        if (v >= 3 && v <= 5 && Math.random() < 0.15) {
          // Random brightness flicker
          const brighter = FIRE_COLORS[Math.min(5, v + 1)]!
          color = brighter
        }
        ctx.fillStyle = color
        ctx.fillRect(fireX + fx * S, fireY + fy * S, S, S)
      }
    }

    // Draw subtle ground glow under fire
    ctx.fillStyle = 'rgba(232, 87, 42, 0.03)'
    ctx.fillRect(fireCx - 80, fireCy + fireH * S / 2 - 4, 160, 8)
    ctx.fillStyle = 'rgba(232, 87, 42, 0.015)'
    ctx.fillRect(fireCx - 120, fireCy + fireH * S / 2 + 4, 240, 6)

    // Manage sparks — target count
    const target = targetCountRef.current
    while (sparksRef.current.length < target) {
      sparksRef.current.push(createSpark(fireCx, fireCy))
    }
    // Trim excess if needed
    if (sparksRef.current.length > target) {
      sparksRef.current.length = target
    }

    // Update & draw sparks
    const sparkColors = [
      ['#FF4422', '#CC2211', '#881100'],  // red
      ['#FF8833', '#E8572A', '#AA3318'],  // orange
      ['#FFCC44', '#FFAA22', '#CC7711'],  // yellow
    ]

    for (const spark of sparksRef.current) {
      spark.life++
      if (spark.life >= spark.maxLife) {
        // Respawn
        Object.assign(spark, createSpark(fireCx, fireCy))
        spark.life = 0
      }

      // Physics: drift up, slow down, slight wobble
      spark.x += spark.vx + (Math.random() - 0.5) * 0.15
      spark.y += spark.vy
      spark.vy *= 0.998 // slight deceleration
      spark.vx *= 0.995

      // Fade: bright at start, dim at end
      const t = spark.life / spark.maxLife
      const alpha = t < 0.1 ? t * 10 : t > 0.7 ? (1 - t) / 0.3 : 1

      if (alpha <= 0.02) continue

      // Color based on life phase: yellow → orange → red → fade
      const colors = sparkColors[spark.hue]!
      const colorIdx = t < 0.3 ? 0 : t < 0.6 ? 1 : 2
      ctx.globalAlpha = alpha * (0.6 + Math.random() * 0.4) // flicker
      ctx.fillStyle = colors[colorIdx]!
      ctx.fillRect(
        Math.floor(spark.x),
        Math.floor(spark.y),
        spark.size,
        spark.size,
      )
    }

    ctx.globalAlpha = 1

    frameRef.current++
    requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight - 40
    }
    resize()
    window.addEventListener('resize', resize)

    const raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [animate])

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>sparks</span>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>
      <canvas ref={canvasRef} className="wm-canvas" />
      <style>{`
        .wm{height:100vh;display:flex;flex-direction:column;background:#0D0D1A;overflow:hidden}
        .wm-bar{display:flex;align-items:center;gap:1.5rem;padding:.75rem 1.5rem;border-bottom:1px solid #1A1A2E;font-size:.8rem;flex-shrink:0;z-index:1}
        .wm-bar a{color:#8A8A9A;text-decoration:none}.wm-bar a:hover{color:#F5F0E8}
        .wm-bar span{color:#F5F0E8;text-transform:uppercase;letter-spacing:.15em;font-size:.75rem}
        .wm-n{color:#8A8A9A!important;margin-left:auto;font-size:.7rem!important;text-transform:none!important}
        .wm-canvas{flex:1;display:block;image-rendering:pixelated}
      `}</style>
    </div>
  )
}
