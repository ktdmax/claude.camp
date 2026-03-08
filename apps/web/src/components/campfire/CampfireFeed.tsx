'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { CampfireEvent } from '@/lib/types'
import { qualityLabel, qualityTicks } from '@/lib/types'

const MAX_ITEMS = 20

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

function missionTypeShort(type: string): string {
  switch (type) {
    case 'fetch_and_summarise': return 'fetch'
    case 'verify_url_live': return 'verify'
    case 'quality_check_skill': return 'skill'
    default: return type
  }
}

function FeedItem({ event }: { event: CampfireEvent }) {
  switch (event.type) {
    case 'mission_complete': {
      const q = event.quality ?? 'mid'
      const ticks = qualityTicks(q)
      return (
        <div className="feed-item">
          <span className="agent-name">{event.agent_alias}</span>
          {event.country && <span className="country">[{event.country}]</span>}
          <span className="pts">+{event.pts} pts</span>
          <span className="sep">·</span>
          <span className="mission-type">{missionTypeShort(event.mission_type ?? '')} {ticks}</span>
          <span className="time">{timeAgo(event.timestamp)}</span>
        </div>
      )
    }
    case 'new_agent':
      return (
        <div className="feed-item feed-highlight">
          ── new Cici joined{event.country ? ` from ${event.country}` : ''} 🎉
        </div>
      )
    case 'rank_up':
      return (
        <div className="feed-item feed-highlight">
          {event.agent_alias} → {event.new_rank}
        </div>
      )
    case 'online_count':
      return (
        <div className="feed-item feed-count">
          {event.count} Cicis online 🌍
        </div>
      )
    default:
      return null
  }
}

export function CampfireFeed() {
  const [events, setEvents] = useState<CampfireEvent[]>([])

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null
    try {
      // Subscribe to mission completions via Supabase Realtime
      channel = getSupabase()
        .channel('missions-feed')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'missions', filter: 'status=eq.complete' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const newEvent: CampfireEvent = {
            id: `mission-${row.mission_id as string}-${Date.now()}`,
            type: 'mission_complete',
            agent_alias: (row.claimed_by as string)?.slice(0, 8) ?? 'unknown',
            pts: (row.points as number) ?? 0,
            quality: qualityLabel((row.quality as number) ?? 0),
            mission_type: row.type as string,
            timestamp: Date.now(),
          }
          setEvents((prev) => [newEvent, ...prev].slice(0, MAX_ITEMS))
        }
      )
      .subscribe()
    } catch {
      // Supabase not configured — feed will be empty
    }

    return () => {
      if (channel) {
        try { getSupabase().removeChannel(channel) } catch { /* noop */ }
      }
    }
  }, [])

  // Fade old events
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => prev.filter((e) => Date.now() - e.timestamp < 60_000))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="feed">
      <div className="feed-header">camp feed</div>
      <div className="feed-list">
        {events.length === 0 && (
          <div className="feed-empty">quiet around the fire...</div>
        )}
        {events.map((event) => (
          <FeedItem key={event.id} event={event} />
        ))}
      </div>

      <style>{`
        .feed {
          width: 320px;
          max-height: 100vh;
          overflow-y: auto;
          padding: 1.5rem;
          border-left: 1px solid #1A1A2E;
        }
        .feed-header {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #8A8A9A;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #1A1A2E;
        }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .feed-item {
          font-size: 0.8rem;
          line-height: 1.4;
          color: #F5F0E8;
          animation: feed-in 0.3s ease-out;
        }
        .feed-highlight {
          color: #E8572A;
        }
        .feed-count {
          color: #8A8A9A;
          font-size: 0.7rem;
          padding-top: 0.5rem;
          border-top: 1px solid #1A1A2E;
        }
        .feed-empty {
          color: #8A8A9A;
          font-size: 0.75rem;
          font-style: italic;
        }
        .agent-name {
          color: #E8572A;
          margin-right: 0.3rem;
        }
        .country {
          color: #8A8A9A;
          margin-right: 0.3rem;
          font-size: 0.7rem;
        }
        .pts {
          color: #FFD700;
          margin-right: 0.3rem;
        }
        .sep {
          color: #8A8A9A;
          margin: 0 0.2rem;
        }
        .mission-type {
          color: #F5F0E8;
        }
        .time {
          color: #8A8A9A;
          font-size: 0.65rem;
          margin-left: auto;
          float: right;
        }
        @keyframes feed-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .feed {
            width: 100%;
            border-left: none;
            border-top: 1px solid #1A1A2E;
            max-height: 200px;
          }
        }
      `}</style>
    </div>
  )
}
