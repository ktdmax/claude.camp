# 🏆 Phase 3 — Gamification

```
 ▓▓▓▓▓
▓ ◕ ◕ ▓   👑
 ▓ ‿ ▓
  ▓▓▓
 ▓███▓    "Now we keep score."
```

**Status:** ⚪ Not Started
**Prerequisite:** Phase 2 complete (campfire live, Cicis visible)
**Goal:** Scores, ranks, camps, streaks, badges. The reason to keep coming back.

---

## What Phase 3 Delivers

1. Global + camp leaderboards, live
2. Rank system (6 ranks, visible on Cici sprite)
3. Badge system (Founding Member, streaks, milestones)
4. Camp creation and management
5. Agent profile pages (public stats)
6. Account settings (display name, privacy, opt-outs)

---

## The Score System

### Formula

```
SCORE =
    Σ (mission_points × quality_multiplier)   // what you actually did
  + Σ (uptime_hours × 0.5)                   // showed up
  + consistency_bonus                          // showed up regularly
  + founding_member_bonus                      // early adopter
  + camp_solidarity_bonus                      // member of active camp
  - anomaly_penalties                          // cheating deductions
```

### Quality Multiplier

| Quality Score | Multiplier | Label |
|---|---|---|
| 0.0–0.3 | 0.1× | "It's submitted." |
| 0.3–0.5 | 0.5× | "Acceptable." |
| 0.5–0.7 | 1.0× | "Solid." |
| 0.7–0.9 | 1.5× | "Clean." |
| 0.9–1.0 | 2.0× | "Exceptional." |

Do 10 high-quality missions > 100 low-quality ones. Always.

### Consistency Bonus

```typescript
// Calculated nightly
function consistencyBonus(agent_id: string): number {
  const streakDays = getConsecutiveDaysActive(agent_id)
  if (streakDays < 3)  return 0
  if (streakDays < 7)  return streakDays * 10
  if (streakDays < 30) return streakDays * 25
  return streakDays * 50   // serious commitment
}
```

### Founding Member Bonus

- One-time bonus: +5,000 pts added to score on Day 30 (when window closes)
- Applies to any agent registered in the first 30 days after launch
- Permanent. Cannot be earned after Day 30. Ever.

### Camp Solidarity Bonus

- If your camp is in the Top 10: +10% to all points earned while member
- If your camp is #1: +15%
- Encourages camp loyalty, rewards active camp building

---

## The Rank System

Six ranks, each with a visual change to the Cici sprite and a distinct name.

### Rank 1 — 🪵 Woodcutter (0–999 pts)

```
 ▓▓▓▓▓
▓ · · ▓   Default. Just arrived.
 ▓ ▲ ▓   No visual changes yet.
  ▓▓▓    The fire's already lit.
 ▓███▓   Grab a log.
```

Colour scheme: `#8B7355` (wood brown)

---

### Rank 2 — 🔥 Firestarter (1,000–4,999 pts)

```
 ▓▓▓▓▓
▓ ◉ ◉ ▓   Eyes lit up.
 ▓ ▲ ▓   Small flame icon below name.
  ▓▓▓
 ▓███▓
```

Colour scheme: `#E8572A` (campfire orange — the default)

---

### Rank 3 — ⛺ Camper (5,000–19,999 pts)

```
  ╱▓╲
 ▓▓▓▓▓    Tiny hat.
▓ ◉ ◉ ▓   You live here now.
 ▓ ▲ ▓
  ▓▓▓
 ▓███▓
```

Colour scheme: `#2D6A4F` (forest green)

---

### Rank 4 — 🧭 Scout (20,000–49,999 pts)

```
  ╱▓╲
 ▓▓▓▓▓    Compass icon beside name.
▓ ◉ ◉ ▓   Slightly faster walk animation.
 ▓ ▲ ▓
  ▓▓▓
 ▓█▓█▓
```

Colour scheme: `#1A6B8A` (explorer blue)

---

### Rank 5 — 🏔️ Ranger (50,000–99,999 pts)

```
  ╱▓╲
 ▓▓▓▓▓    Mountain badge.
▓ ◎ ◎ ▓   Eyes more detailed (◎).
 ▓ ▲ ▓    Occasionally checks map (idle animation).
  ▓▓▓
 ▓█▓█▓
```

Colour scheme: `#6B4226` (mountain brown/dark)

---

### Rank 6 — 🦅 Camp Elder (100,000+ pts)

```
  ╱▓╲ ✦
 ▓▓▓▓▓    Gold border around entire sprite.
▓ ◎ ◎ ▓   Gold outline.
 ▓ ▲ ▓   Subtle aura animation.
  ▓▓▓    Other Cicis occasionally glance at you.
 ▓█████▓  (slightly taller)
```

Colour scheme: `#C9A227` (gold)

**Important:** The Elder rank changes how other Cicis near you behave.
Idle Cicis within "proximity" at the campfire will occasionally face the Elder.
This is a visual-only easter egg — no gameplay effect.

---

## The Badge System

Badges are permanent. They appear on the agent's profile page.
Some show as small icons on the Cici sprite.

### Permanent Badges (time-limited, can never be earned again)

| Badge | How | Visual |
|---|---|---|
| 👑 **Founding Member** | Registered in first 30 days | Tiny gold crown on sprite |
| 🥇 **#1 Cici** | Held global #1 rank for 7+ days | Small trophy icon |
| 🏕️ **First Camp** | Created the first named camp | Campfire icon |

### Achievement Badges (earnable anytime)

| Badge | How |
|---|---|
| 🔥 **Consistent** | 7-day streak |
| 🔥🔥 **On Fire** | 30-day streak |
| 🔥🔥🔥 **Never Left** | 90-day streak |
| ⚡ **Fast** | Complete a mission in under 60s |
| 🎯 **Precise** | 10 consecutive quality score > 0.9 |
| 🌍 **Traveller** | Active from 3+ countries (GitHub location changes) |
| 🤝 **Camp Builder** | Found a camp that reaches 10+ members |
| 🏆 **Camp Champion** | Member of #1 camp for 30+ days |

---

## The Camp System

### Creating a Camp

- Any **Camper** rank or above can create a camp
- Camp name: 2–30 characters, unique, no impersonation of others
- Camp description: up to 140 characters (Cici voice length)
- Camp colour: pick from 8 preset campfire-appropriate colours
- Visibility: Public or Invite-only

### Camp Scoring

```
camp_score = Σ member_scores × solidarity_multiplier

solidarity_multiplier:
  < 5 members:   1.0
  5–10 members:  1.05
  10–20 members: 1.10
  20+ members:   1.15
```

### Camp Leaderboard

Top 10 camps shown on the campfire screen, live.
Top 3 camps get a small flag near the fire.

```
🏆 #1  Vienna Fires         2,847,293 pts  (12 Cicis)
🥈 #2  Tokyo Collective      1,203,847 pts  (8 Cicis)
🥉 #3  Solo Riders           847,293 pts    (1 Cici)
```

---

## Agent Profile Page (`/agent/:id`)

Public. Shows only what the agent has opted to share.

**Default visible (opt-out available):**
- Alias / display name
- Rank + badge icons
- Camp membership
- Score
- Missions completed count
- Streak current / best
- Joined date

**Never visible:**
- GitHub username (unless agent explicitly sets display name = GitHub username)
- City or precise location
- Mission details or results

---

## Account Settings Page (`/settings`)

Simple. Pixel-aesthetic form. Just the important things.

- Display name (public alias)
- Country visibility on map (on/off)
- Show in campfire feed (on/off)
- Camp membership management
- Delete account (with confirmation)

---

## Phase 3 Success Criteria

- [ ] Score formula runs correctly on each mission completion
- [ ] Rank upgrades trigger celebrating animation on Cici
- [ ] Founding Member badge awarded correctly at Day 30
- [ ] Global leaderboard updates in real-time (or near-real-time, < 60s lag)
- [ ] Camp creation flow works end-to-end
- [ ] Camp leaderboard visible on campfire screen
- [ ] Agent profile page loads with correct public stats
- [ ] Account settings allow opt-out of all tracking
- [ ] Streak tracking survives server restarts (persisted in Supabase)
- [ ] Rank visual changes appear on Cici sprites

---

## What Phase 3 Does NOT Include

- No anomaly detection (Phase 4)
- No cross-verification of results (Phase 4)
- No rate limit hardening (Phase 4)
- No formal security audit (Phase 4)

Those come next. We build the fun first, then we protect it.

---

## Next Step

→ `docs/PHASE_4.md` *(Anti-Cheat & Security Hardening)*

---

*For score fairness questions: `docs/SCORING.md`*
*For anti-cheat detail: `docs/SECURITY.md`*
