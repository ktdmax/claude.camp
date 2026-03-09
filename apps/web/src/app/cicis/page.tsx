export default function CicisPage() {
  return (
    <div style={{ padding: '24px 32px', background: '#0D0D1A', minHeight: '100vh', fontFamily: 'monospace' }}>
      <div style={{ color: '#F5F0E8', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>
        cici styles
      </div>
      <a href="/cicis-v1" style={{ color: '#E8572A', display: 'block', marginBottom: 12, fontSize: 14 }}>
        /cicis-v1 — front view traits (10 categories, hash-generated)
      </a>
      <a href="/cicis-v2" style={{ color: '#E8572A', display: 'block', fontSize: 14 }}>
        /cicis-v2 — lemmings style (side view, walking animation)
      </a>
    </div>
  )
}
