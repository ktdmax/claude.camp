'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const CS = 5, FS = 5, PX = 3 // cici px, fire px, background px

// === FIRE 7×10 ===
const FIRE_F: number[][][] = [
  [[0,0,0,5,0,0,0],[0,0,5,4,0,0,0],[0,0,4,4,5,0,0],[0,4,3,4,4,0,0],[0,3,3,3,3,0,0],[0,3,2,3,2,3,0],[0,2,2,2,2,2,0],[0,2,1,1,1,2,0],[6,6,6,6,6,6,6],[6,6,6,6,6,6,6]],
  [[0,0,0,0,5,0,0],[0,0,0,5,4,0,0],[0,0,4,5,4,0,0],[0,0,4,3,4,4,0],[0,3,3,3,3,0,0],[0,3,2,2,3,3,0],[0,2,2,2,2,2,0],[0,2,1,1,1,2,0],[6,6,6,6,6,6,6],[6,6,6,6,6,6,6]],
  [[0,0,5,0,0,0,0],[0,0,4,5,0,0,0],[0,4,4,4,0,0,0],[0,3,4,3,4,0,0],[0,3,3,3,3,0,0],[0,2,3,2,3,3,0],[0,2,2,2,2,2,0],[0,1,1,1,1,2,0],[6,6,6,6,6,6,6],[6,6,6,6,6,6,6]],
]
const FC: Record<number,string> = {1:'#6B1010',2:'#C83218',3:'#E8572A',4:'#FF9933',5:'#FFD466',6:'#3D2817'}

// === CICI TRAIT SPRITES (5×7, generated from seed) ===
// Ear variants (row 0): 0=both, 1=left only, 2=antenna, 3=big
const EARS: number[][] = [
  [1,0,0,0,1], // normal
  [1,0,0,0,0], // left only
  [0,1,0,1,0], // antenna
  [1,1,0,1,1], // big
]
// Eye variants (row 2): 0=normal, 1=dots, 2=sleepy, 3=wink
const EYES: number[][] = [
  [1,0,1,0,1], // ■ ■
  [1,1,1,1,1], // dots (drawn as body, eyes added at render as single px)
  [1,1,1,1,1], // sleepy (horizontal line eyes at render)
  [1,0,1,1,1], // wink (left eye only)
]
// Belly variants (row 3): 0=plain, 1=stripe, 2=dot, 3=belt
const BELLY: number[][] = [
  [1,1,1,1,1], // plain
  [1,3,1,3,1], // stripe
  [1,1,3,1,1], // dot
  [3,1,1,1,3], // belt
]
// Leg walk variants per seed
const LEG_W1: number[][][] = [
  [[1,0,0,1,0],[0,1,0,0,1]], // normal
  [[1,0,0,0,1],[0,0,0,1,0]], // wide
  [[1,0,0,1,0],[1,0,0,0,0]], // stumpy
]
const LEG_W2: number[][][] = [
  [[0,1,0,0,1],[1,0,0,1,0]],
  [[0,0,0,1,0],[1,0,0,0,1]],
  [[0,0,0,1,0],[1,0,0,0,0]],
]
const LEG_SIT: number[][] = [
  [1,1,1,1,1], // normal sit
]
const LEG_FALL: number[][][] = [
  [[1,0,1,0,1],[0,1,0,1,0]],
]

type CiciSprites = { walk1: number[][]; walk2: number[][]; sit: number[][]; fall: number[][]; eyeType: number }

function buildCiciSprites(seed: number): CiciSprites {
  const earIdx = seed % EARS.length
  const eyeIdx = (seed >> 2) % EYES.length
  const bellyIdx = (seed >> 4) % BELLY.length
  const legIdx = (seed >> 6) % LEG_W1.length

  const ear = EARS[earIdx]!
  const eye = EYES[eyeIdx]!
  const belly = BELLY[bellyIdx]!
  const body = [1,1,1,1,1]

  const walk1 = [ear, body, eye, belly, body, ...LEG_W1[legIdx]!]
  const walk2 = [ear, body, eye, belly, body, ...LEG_W2[legIdx]!]
  const sit = [ear, body, eye, belly, body, ...LEG_SIT]
  const fall = [ear, body, eye, belly, body, ...LEG_FALL[0]!]

  return { walk1, walk2, sit, fall, eyeType: eyeIdx }
}

// === PIXEL ART DECO SPRITES ===
// Tree: 5×8
const TREE: number[][] = [[0,0,1,0,0],[0,1,1,1,0],[0,1,1,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,0,2,0,0],[0,0,2,0,0],[0,0,2,0,0]]
const TREE_C: Record<number,string> = {1:'#1A3A1A',2:'#3D2817'}
// Big tree: 7×10
const BIGTREE: number[][] = [[0,0,0,1,0,0,0],[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,0,0,2,0,0,0],[0,0,0,2,0,0,0],[0,0,0,2,0,0,0],[0,0,2,2,2,0,0]]
const BTREE_C: Record<number,string> = {1:'#153015',2:'#3D2817'}
// Rock: 4×3
const ROCK: number[][] = [[0,1,1,0],[1,1,1,1],[1,1,1,1]]
const ROCK_C: Record<number,string> = {1:'#2A2A3A'}
// Monitor 5×5
const MONITOR: number[][] = [[2,2,2,2,2],[2,3,3,3,2],[2,3,3,3,2],[2,2,2,2,2],[0,0,2,0,0]]
const MON_C: Record<number,string> = {2:'#2A2D4A',3:'#4A9EFF'}
// Coffee 3×4
const COFFEE: number[][] = [[0,1,0],[1,2,1],[1,2,1],[0,1,0]]
const COF_C: Record<number,string> = {1:'#F5F0E8',2:'#6B3A1F'}
// Rubber duck 4×3
const DUCK: number[][] = [[0,1,1,0],[1,1,1,1],[0,1,1,0]]
const DUCK_C: Record<number,string> = {1:'#FFD700'}
// Mushroom 3×4
const MUSH: number[][] = [[0,1,0],[1,1,1],[0,2,0],[0,2,0]]
const MUSH_C: Record<number,string> = {1:'#CC3333',2:'#F5F0E8'}
// === FLYING OBJECT SPRITES ===
// UFO 7×3
const SPR_UFO: number[][] = [[0,0,0,1,0,0,0],[0,2,2,2,2,2,0],[2,3,2,3,2,3,2]]
// Satellite 7×3
const SPR_SAT: number[][] = [[1,0,0,2,0,0,1],[1,0,2,2,2,0,1],[0,0,0,2,0,0,0]]
// Flappy Bird 5×3
const SPR_FLAPPY: number[][] = [[0,1,1,0,0],[1,1,2,1,0],[0,1,1,3,0]]
// Bullet Bill (Mario) 5×4
const SPR_BULLET: number[][] = [[0,1,1,1,0],[1,2,1,1,1],[1,2,1,1,1],[0,1,1,1,0]]
// Star (Mario) 5×5
const SPR_STAR: number[][] = [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,0,1,0],[1,0,0,0,1]]
// Ghast (Minecraft) 5×5
const SPR_GHAST: number[][] = [[0,1,1,1,0],[1,1,1,1,1],[1,2,1,2,1],[1,1,1,1,1],[1,0,1,0,1]]
// Bat 5×3
const SPR_BAT: number[][] = [[1,0,0,0,1],[1,1,1,1,1],[0,1,0,1,0]]
// Geometry Dash cube 4×4
const SPR_GEO: number[][] = [[1,1,1,1],[1,2,2,1],[1,1,1,1],[1,1,1,1]]

type FlyerType = {
  name: string
  sprite: number[][]
  colors: Record<number, string>
  move: 'linear' | 'sine' | 'flappy' | 'bounce'
  baseScale: number
}

const FLYER_TYPES: FlyerType[] = [
  { name: 'ufo', sprite: SPR_UFO, colors: { 1:'#8A8AFF', 2:'#3A3A5A', 3:'#4A9EFF' }, move: 'sine', baseScale: 1 },
  { name: 'satellite', sprite: SPR_SAT, colors: { 1:'#4A9EFF', 2:'#8A8A9A' }, move: 'linear', baseScale: 0.8 },
  { name: 'flappy', sprite: SPR_FLAPPY, colors: { 1:'#FFD700', 2:'#F5F0E8', 3:'#E8572A' }, move: 'flappy', baseScale: 1 },
  { name: 'bullet', sprite: SPR_BULLET, colors: { 1:'#2A2A2A', 2:'#F5F0E8' }, move: 'linear', baseScale: 1.2 },
  { name: 'star', sprite: SPR_STAR, colors: { 1:'#FFD700' }, move: 'bounce', baseScale: 1 },
  { name: 'ghast', sprite: SPR_GHAST, colors: { 1:'#F5F0E8', 2:'#2A2A3A' }, move: 'sine', baseScale: 1.5 },
  { name: 'bat', sprite: SPR_BAT, colors: { 1:'#3A3A5A' }, move: 'flappy', baseScale: 0.8 },
  { name: 'geo', sprite: SPR_GEO, colors: { 1:'#4A9EFF', 2:'#F5F0E8' }, move: 'bounce', baseScale: 1 },
]

type FlyerState = {
  slot: number; active: boolean; cooldown: number
  type: string; sprite: number[][]; colors: Record<number, string>
  x: number; y: number; speed: number; dir: 1 | -1
  moveType: string; scale: number; life: number
}
// Portal 7×5
const PORTAL: number[][] = [[0,1,1,1,1,1,0],[1,2,2,2,2,2,1],[1,2,3,3,3,2,1],[1,2,2,2,2,2,1],[0,1,1,1,1,1,0]]
const POR_C: Record<number,string> = {1:'#4A9EFF',2:'#1A1A3C',3:'#8A8AFF'}

// === NAMES ===
const ADJ = ['Fluffy','Crispy','Sneaky','Fuzzy','Sparkly','Grumpy','Bouncy','Dizzy','Rusty','Cosmic','Pixel','Tiny','Mighty','Silent','Swift','Sleepy','Wobbly','Chunky','Spooky','Glitchy','Zippy','Turbo','Crunchy','Wiggly','Frosty','Toasty','Salty','Funky','Quirky','Bubbly']
const NOUN = ['Byte','Node','Pixel','Stack','Loop','Bug','Patch','Fork','Merge','Cache','Hash','Bit','Core','Spark','Wave','Blob','Shard','Drift','Pulse','Flick','Crumb','Sprout','Twig','Ember','Flare','Glyph','Rune','Mote','Pip','Dot']
function funnyName(s: number) { return `${ADJ[s % ADJ.length]} ${NOUN[Math.floor(s / ADJ.length) % NOUN.length]}` }

function hsl2rgb(h: number, s: number, l: number): [number,number,number] {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))) }
  return [f(0), f(8), f(4)]
}
function ciciColor(s: number) {
  const h = (s * 137 + 42) % 360
  const [r1,g1,b1] = hsl2rgb(h, 0.5, 0.6); const [r2,g2,b2] = hsl2rgb(h, 0.45, 0.42)
  return { body: `rgb(${r1},${g1},${b1})`, dark: `rgb(${r2},${g2},${b2})` }
}

const SIM: Record<string,number> = {
  'United States':287,'United Kingdom':82,'Germany':68,'Canada':52,'France':42,'India':38,
  'Australia':32,'Netherlands':26,'Japan':24,'Brazil':22,'Sweden':18,'Poland':17,
  'Spain':16,'Italy':15,'South Korea':14,'Switzerland':13,'Austria':12,'China':14,
  'Ireland':11,'Belgium':10,'Denmark':9,'Norway':9,'Finland':8,'Czech Republic':7,
  'Portugal':7,'Ukraine':7,'Romania':6,'Turkey':6,'Israel':8,'Singapore':7,
  'Taiwan':6,'Thailand':5,'Vietnam':4,'Indonesia':5,'Philippines':4,'Mexico':7,
  'Argentina':5,'Colombia':4,'Nigeria':3,'Kenya':3,'South Africa':5,'New Zealand':6,
  'Malaysia':4,'Hungary':4,'Croatia':3,'Morocco':2,'Egypt':3,'UAE':5,
  'Pakistan':3,'Chile':3,'Peru':2,'Russia':5,
}

// === BIOMES ===
type Biome = {
  name: string
  bg: string                    // sky
  hillFar: string; hillNear: string
  platTop: string; platSide: string; platGrass: string
  ground: string; groundLine: string
  starColor: string
  treeLeaf: string; treeTrunk: string
  rockColor: string
  signs: string[]               // nerd sign texts for this biome
  gemColors: string[][]         // [[outline, fill], ...]
}

const BIOMES: Biome[] = [
  { // FOREST (default)
    name: 'forest', bg: '#0D0D1A',
    hillFar: '#0E0E1E', hillNear: '#121228',
    platTop: '#1A1A2E', platSide: '#12122A', platGrass: '#1E2E1E',
    ground: '#121228', groundLine: '#161630',
    starColor: '#F5F0E8',
    treeLeaf: '#1A3A1A', treeTrunk: '#3D2817',
    rockColor: '#2A2A3A',
    signs: ['TODO','404','// FIXME','git push',':wq','npm i','sudo !!','EOF','main','RTFM'],
    gemColors: [['#4A9EFF','#82C0FF'],['#50C878','#80E8A0'],['#E8572A','#FFAA66'],['#AA55FF','#CC88FF']],
  },
  { // ICE
    name: 'ice', bg: '#080818',
    hillFar: '#0A0A20', hillNear: '#0E1030',
    platTop: '#1A2040', platSide: '#101830', platGrass: '#2040AA',
    ground: '#0E1030', groundLine: '#1A2848',
    starColor: '#CCE0FF',
    treeLeaf: '#2050AA', treeTrunk: '#1A2848',
    rockColor: '#2A3050',
    signs: ['FROZEN','let it go','❄ cold','npm freeze','git stash','SIGSTOP','ice ice','brr','0 kelvin','defrost'],
    gemColors: [['#4AC0FF','#A0E0FF'],['#80AAFF','#C0D8FF'],['#50E0E0','#A0FFFF'],['#AAAAFF','#D0D0FF']],
  },
  { // DESERT
    name: 'desert', bg: '#1A1408',
    hillFar: '#1E180E', hillNear: '#2A2010',
    platTop: '#3A3018', platSide: '#2A2010', platGrass: '#4A4020',
    ground: '#2A2010', groundLine: '#3A3018',
    starColor: '#FFE8CC',
    treeLeaf: '#4A6A20', treeTrunk: '#5A4020',
    rockColor: '#4A3A28',
    signs: ['OASIS','no water','dry run','hot fix','sun burn','cache miss','sand box','mirage','40°C','thirsty'],
    gemColors: [['#FFD700','#FFE866'],['#E8572A','#FFAA66'],['#CC8833','#FFCC88'],['#FF6644','#FFAA88']],
  },
  { // VOLCANIC
    name: 'volcanic', bg: '#120808',
    hillFar: '#1A0A0A', hillNear: '#220E0E',
    platTop: '#2A1818', platSide: '#1A0E0E', platGrass: '#441818',
    ground: '#1A0E0E', groundLine: '#2A1414',
    starColor: '#FFA088',
    treeLeaf: '#3A1818', treeTrunk: '#2A1010',
    rockColor: '#3A2020',
    signs: ['LAVA','core dump','meltdown','on fire','hot path','burn rate','ash','eruption','magma','inferno'],
    gemColors: [['#FF4422','#FF8866'],['#FF8800','#FFCC44'],['#CC2200','#FF6644'],['#FFAA00','#FFDD66']],
  },
  { // NEON
    name: 'neon', bg: '#0A0818',
    hillFar: '#0E0A22', hillNear: '#14102E',
    platTop: '#1A1440', platSide: '#100E28', platGrass: '#6020AA',
    ground: '#100E28', groundLine: '#201840',
    starColor: '#FF80FF',
    treeLeaf: '#4020AA', treeTrunk: '#301880',
    rockColor: '#2A2050',
    signs: ['CYBER','pwned','l33t','root','hack','neon','glitch','sync','void','pixel'],
    gemColors: [['#FF40FF','#FF88FF'],['#40FFFF','#88FFFF'],['#AAFF40','#CCFF88'],['#FF4080','#FF88BB']],
  },
  { // DEEP SEA
    name: 'deep sea', bg: '#060E14',
    hillFar: '#081218', hillNear: '#0A1820',
    platTop: '#142830', platSide: '#0E1E28', platGrass: '#186040',
    ground: '#0E1E28', groundLine: '#183038',
    starColor: '#80FFE0',
    treeLeaf: '#105030', treeTrunk: '#0E3828',
    rockColor: '#1A3030',
    signs: ['DEPTH','bubble','coral','20000 lg','kraken','anchor','dive','pressure','abyss','Nemo'],
    gemColors: [['#20E0A0','#60FFC0'],['#4080FF','#80B0FF'],['#40E0E0','#80FFFF'],['#60AA80','#A0DDBB']],
  },
]

// Seeded PRNG
function mkRng(seed: number) {
  return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
}

// === STARS ===
type Star = { x: number; y: number; size: number; speed: number; phase: number }
function buildStars(w: number, h: number, seed: number): Star[] {
  const r = mkRng(seed)
  return Array.from({ length: 60 }, () => ({
    x: Math.floor(r() * w / PX) * PX,
    y: Math.floor(r() * h * 0.45 / PX) * PX,
    size: r() > 0.88 ? PX * 2 : PX,
    speed: 0.015 + r() * 0.03,
    phase: r() * 6.28,
  }))
}

// === PIXEL HILLS ===
function buildHills(w: number, baseY: number, seed: number): number[] {
  const r = mkRng(seed)
  const step = PX * 3; const raw: number[] = []; let y = baseY
  for (let x = 0; x <= w; x += step) {
    y += (r() - 0.52) * 10
    y = Math.max(baseY - 50, Math.min(baseY + 20, y))
    raw.push(Math.floor(y / PX) * PX)
  }
  return raw
}

type Platform = { x: number; w: number; y: number }
type FirePos = { x: number; platIdx: number }
type Deco = { type: string; x: number; platIdx: number; text?: string }

const MAX_AGENTS = 128

function buildLevel(w: number, h: number, agentCount: number, levelSeed: number, biome: Biome) {
  const r = mkRng(levelSeed)
  const groundY = h - 40
  const big = agentCount > 100

  // Procedural platforms — base shapes with random offsets
  const platCount = big ? 9 : 5
  const platforms: Platform[] = [{ x: 0, w, y: groundY }]  // ground always

  for (let i = 1; i < platCount; i++) {
    const row = Math.ceil(i / 2)
    const side = i % 2 // 0=left-ish, 1=right-ish
    const xBase = side === 0 ? 0.03 + r() * 0.15 : 0.45 + r() * 0.15
    const wBase = 0.25 + r() * 0.2
    const yOff = row * (120 + r() * 40)
    platforms.push({ x: w * xBase, w: w * wBase, y: groundY - yOff })
  }

  // Fires: 2 on ground + 1 per shelf
  const fires: FirePos[] = [
    { x: w * (0.2 + r() * 0.2), platIdx: 0 },
    { x: w * (0.6 + r() * 0.2), platIdx: 0 },
  ]
  for (let i = 1; i < platforms.length; i++) {
    const plat = platforms[i]!
    fires.push({ x: plat.x + plat.w * (0.3 + r() * 0.4), platIdx: i })
  }

  // Procedural decos
  const decoPool = ['tree', 'bigtree', 'rock', 'mush', 'monitor', 'coffee', 'duck', 'gem', 'sign']
  const decos: Deco[] = []

  for (let pi = 0; pi < platforms.length; pi++) {
    const plat = platforms[pi]!
    const count = pi === 0 ? 8 + Math.floor(r() * 5) : 2 + Math.floor(r() * 4)
    for (let d = 0; d < count; d++) {
      const type = decoPool[Math.floor(r() * decoPool.length)]!
      const x = plat.x + plat.w * (0.02 + r() * 0.96)
      if (type === 'sign') {
        const text = biome.signs[Math.floor(r() * biome.signs.length)]!
        decos.push({ type, x, platIdx: pi, text })
      } else {
        decos.push({ type, x, platIdx: pi })
      }
    }
  }

  return { platforms, fires, decos, portalX: w * 0.5, portalY: h - 8 }
}

// Coding sequences that lead to 42
const CODE_SEQS: string[][] = [
  ['01101','10010','6×7=','42'],
  ['101010','0x2A=','42'],
  ['110-68=','42'],
  ['f(x)=','6*7','=42'],
  ['00101','010','=42'],
  ['2+40=','42'],
  ['√1764','=42'],
  ['21×2=','42'],
  ['0b101010','=42'],
]

type Agent = {
  x: number; y: number; vy: number; platIdx: number
  seed: number; country: string; name: string
  colors: ReturnType<typeof ciciColor>
  sprites: CiciSprites
  dir: 1|-1; speed: number
  state: 'walk'|'sit'|'fall'|'idle'|'jump'|'coding'
  stateTimer: number; frame: number; frameTick: number; blinkTick: number
  jumpY: number // offset for jump
  codeSeq: number // which CODE_SEQS to use
  codeFrame: number // which frame in the sequence
}

// === CICI CARD ===
import { getPhrase } from './phrases'

function CiciCard({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const cardCanvasRef = useRef<HTMLCanvasElement>(null)
  const bigCS = 10 // big pixel size for card

  useEffect(() => {
    const cv = cardCanvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    let frame = 0, tick = 0, blink = 0

    const interval = setInterval(() => {
      tick++; blink = (blink + 1) % 80
      if (tick % 8 === 0) frame = frame === 0 ? 1 : 0

      ctx.fillStyle = '#0D0D1A'; ctx.fillRect(0, 0, cv.width, cv.height)

      const spr = frame === 0 ? agent.sprites.walk1 : agent.sprites.walk2
      const isBlink = blink >= 76
      const ox = (cv.width - 5 * bigCS) / 2, oy = (cv.height - 7 * bigCS) / 2

      for (let ry = 0; ry < spr.length; ry++)
        for (let cx = 0; cx < spr[ry]!.length; cx++) {
          const v = spr[ry]![cx]!; if (v === 0) continue
          const isEye = ry === 2 && (cx === 1 || cx === 3)
          if (isEye && isBlink) ctx.fillStyle = agent.colors.body
          else if (isEye) ctx.fillStyle = '#0D0D1A'
          else if (v === 3) ctx.fillStyle = agent.colors.dark
          else if (ry === 0) ctx.fillStyle = agent.colors.dark
          else if (ry >= 5) ctx.fillStyle = agent.colors.dark
          else ctx.fillStyle = agent.colors.body
          ctx.fillRect(ox + cx * bigCS, oy + ry * bigCS, bigCS + 1, bigCS + 1)
        }
    }, 120)

    return () => clearInterval(interval)
  }, [agent, bigCS])

  const phrase = getPhrase(agent.seed)

  return (
    <div className="cc-overlay" onClick={onClose}>
      <div className="cc-card" onClick={e => e.stopPropagation()}>
        <div className="cc-close" onClick={onClose}>x</div>
        <div className="cc-name">{agent.name}</div>
        <div className="cc-country">{agent.country}</div>
        <canvas ref={cardCanvasRef} width={80} height={100} className="cc-canvas" />
        <div className="cc-divider" />
        <div className="cc-phrase">{phrase}</div>
        <div className="cc-stats">
          <span>seed: {agent.seed.toString(16).slice(0, 8)}</span>
          <span>idle: {agent.state}</span>
        </div>
      </div>
    </div>
  )
}

export function WorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [total, setTotal] = useState(0)
  const [tooltip, setTooltip] = useState<{x:number;y:number;name:string;country:string}|null>(null)
  const [showMine, setShowMine] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [biomeName, setBiomeName] = useState('forest')
  const agentsRef = useRef<Agent[]>([])
  const biomeRef = useRef<Biome>(BIOMES[0]!)
  const levelSeedRef = useRef(Math.floor(Math.random() * 99999))
  const levelRef = useRef(buildLevel(800, 600, 0, 42, BIOMES[0]!))
  const frameRef = useRef(0)
  const starsRef = useRef<Star[]>([])
  const hillsRef = useRef<number[]>([])
  const flyersRef = useRef<FlyerState[]>([
    { slot: 0, active: false, cooldown: 600, type: '', sprite: [], colors: {}, x: 0, y: 0, speed: 0, dir: 1, moveType: 'linear', scale: 1, life: 0 },
    { slot: 1, active: false, cooldown: 1200, type: '', sprite: [], colors: {}, x: 0, y: 0, speed: 0, dir: -1, moveType: 'linear', scale: 1, life: 0 },
  ])

  const initAgents = useCallback((countries: Record<string,number>, w: number, h: number) => {
    const totalAll = Object.values(countries).reduce((a, b) => a + b, 0)
    const seed = levelSeedRef.current
    const biome = biomeRef.current
    const lv = buildLevel(w, h, totalAll, seed, biome); levelRef.current = lv
    starsRef.current = buildStars(w, h, seed)
    hillsRef.current = buildHills(w, h * 0.42, seed + 777)
    const agents: Agent[] = []; let idx = 0
    // Cap at MAX_AGENTS, sample proportionally
    const scale = totalAll > MAX_AGENTS ? MAX_AGENTS / totalAll : 1
    for (const [country, rawCount] of Object.entries(countries)) {
      const count = Math.max(1, Math.round(rawCount * scale))
      for (let i = 0; i < count && agents.length < MAX_AGENTS; i++) {
        const seed = idx * 1337 + i * 7 + country.charCodeAt(0) * 31
        const platIdx = seed % lv.platforms.length
        const plat = lv.platforms[platIdx]!
        agents.push({
          x: plat.x + 10 + (seed % Math.max(1, Math.floor(plat.w - 30))),
          y: plat.y, vy: 0, platIdx, seed, country,
          name: funnyName(seed), colors: ciciColor(seed),
          sprites: buildCiciSprites(seed),
          dir: seed % 2 === 0 ? 1 : -1, speed: 0.3 + (seed % 8) * 0.05,
          state: 'walk', stateTimer: seed % 200,
          frame: 0, frameTick: seed % 10, blinkTick: seed % 70,
          jumpY: 0, codeSeq: seed % CODE_SEQS.length, codeFrame: 0,
        })
        idx++
      }
    }
    agentsRef.current = agents
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const load = (c: Record<string,number>) => {
      const raw = Object.values(c).reduce((a, b) => a + b, 0)
      setTotal(Math.min(raw, MAX_AGENTS))
      requestAnimationFrame(() => { const cv = canvasRef.current; if (cv) initAgents(c, cv.width, cv.height) })
    }
    if (params.has('sim')) load(SIM)
    else fetch('https://claudecamp-mcp.max-19f.workers.dev/mcp/agents/countries')
      .then(r => r.json()).then((d:{countries:Record<string,number>}) => load(d.countries))
      .catch(() => load({'Austria':1}))
  }, [initAgents])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current; if (!cv) return
    const rect = cv.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (cv.width / rect.width)
    const my = (e.clientY - rect.top) * (cv.height / rect.height)
    let best: Agent|null = null, bestD = 22
    for (const a of agentsRef.current) {
      const d = Math.sqrt((a.x + 7 - mx)**2 + ((a.y - 20) - my)**2)
      if (d < bestD) { best = a; bestD = d }
    }
    setTooltip(best ? {x:e.clientX,y:e.clientY,name:best.name,country:best.country} : null)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current; if (!cv) return
    const rect = cv.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (cv.width / rect.width)
    const my = (e.clientY - rect.top) * (cv.height / rect.height)
    let best: Agent|null = null, bestD = 30
    for (const a of agentsRef.current) {
      const d = Math.sqrt((a.x + 7 - mx)**2 + ((a.y - 20) - my)**2)
      if (d < bestD) { best = a; bestD = d }
    }
    if (best) setSelectedAgent(best)
  }, [])

  const drawSpr = useCallback((ctx: CanvasRenderingContext2D, spr: number[][], colors: Record<number,string>, x: number, y: number, ps: number) => {
    for (let ry = 0; ry < spr.length; ry++)
      for (let cx = 0; cx < spr[ry]!.length; cx++) {
        const v = spr[ry]![cx]!; if (v === 0) continue
        ctx.fillStyle = colors[v] ?? '#FF00FF'
        ctx.fillRect(Math.floor(x) + cx * ps, Math.floor(y) + ry * ps, ps, ps)
      }
  }, [])

  const animate = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const lv = levelRef.current; const w = cv.width, h = cv.height
    const tick = frameRef.current

    // === BACKGROUND (biome-colored) ===
    const bm = biomeRef.current
    ctx.fillStyle = bm.bg; ctx.fillRect(0, 0, w, h)

    // Stars
    for (const s of starsRef.current) {
      const alpha = 0.3 + Math.sin(tick * s.speed + s.phase) * 0.35
      if (alpha < 0.1) continue
      ctx.globalAlpha = alpha; ctx.fillStyle = bm.starColor
      ctx.fillRect(s.x, s.y, s.size, s.size)
    }
    ctx.globalAlpha = 1

    // Pixel hills
    const hills = hillsRef.current; const hillStep = PX * 3
    if (hills.length > 0) {
      ctx.fillStyle = bm.hillFar
      for (let i = 0; i < hills.length; i++) {
        const hx = i * hillStep, hy = hills[i]! - 16
        ctx.fillRect(hx, hy, hillStep + 1, h - hy)
      }
      ctx.fillStyle = bm.hillNear
      for (let i = 0; i < hills.length; i++) {
        const hx = i * hillStep, hy = hills[i]!
        ctx.fillRect(hx, hy, hillStep + 1, h - hy)
      }
    }

    // === FLYING OBJECTS (2 slots, random types, both directions) ===
    for (const fo of flyersRef.current) {
      fo.cooldown--
      if (!fo.active && fo.cooldown <= 0) {
        // Pick random type and direction
        const types = FLYER_TYPES
        const t = types[(tick + fo.slot * 7) % types.length]!
        const fromRight = (tick + fo.slot) % 3 === 0
        const zoomIn = (tick + fo.slot) % 7 === 0 // fly toward screen then away
        fo.active = true
        fo.type = t.name
        fo.sprite = t.sprite
        fo.colors = t.colors
        fo.dir = fromRight ? -1 : 1
        fo.x = fromRight ? w + 30 : -30
        fo.y = 15 + ((tick * 3 + fo.slot * 50) % Math.floor(h * 0.35))
        fo.speed = (0.3 + ((tick + fo.slot * 13) % 8) * 0.08) * fo.dir
        fo.moveType = zoomIn ? 'zoom' : t.move
        fo.scale = zoomIn ? 1 : t.baseScale
        fo.life = 0
      }
      if (fo.active) {
        fo.life++
        fo.x += fo.speed

        // Movement pattern
        let dy = fo.y
        if (fo.moveType === 'sine') {
          dy += Math.floor(Math.sin(fo.x * 0.03) * 15 / PX) * PX
        } else if (fo.moveType === 'flappy') {
          dy += Math.floor(Math.sin(fo.life * 0.08) * 20 / PX) * PX
        } else if (fo.moveType === 'bounce') {
          dy += Math.abs(Math.floor(Math.sin(fo.life * 0.1) * 12 / PX)) * PX
        } else if (fo.moveType === 'zoom') {
          // Fly in, get big, then shrink and leave
          const mid = 80
          if (fo.life < mid) fo.scale = 1 + (fo.life / mid) * 3
          else fo.scale = Math.max(0.5, 4 - ((fo.life - mid) / mid) * 3.5)
        }

        // Draw
        const ps = Math.max(1, Math.round(PX * (fo.scale ?? 1)))
        for (let ry = 0; ry < fo.sprite.length; ry++)
          for (let cx = 0; cx < fo.sprite[ry]!.length; cx++) {
            const v = fo.sprite[ry]![cx]!; if (v === 0) continue
            ctx.fillStyle = fo.colors[v] ?? '#FF00FF'
            ctx.fillRect(Math.floor(fo.x) + cx * ps, Math.floor(dy) + ry * ps, ps + 1, ps + 1)
          }

        // Beam for UFO type
        if (fo.type === 'ufo' && Math.floor(fo.x / 40) % 5 === 0) {
          ctx.fillStyle = 'rgba(138,138,255,0.04)'
          for (let by = dy + 8; by < h; by += PX) ctx.fillRect(Math.floor(fo.x) + 5, by, PX, PX)
        }

        // Off screen or zoom done
        const gone = fo.dir === 1 ? fo.x > w + 40 : fo.x < -40
        if (gone || (fo.moveType === 'zoom' && fo.life > 160)) {
          fo.active = false; fo.cooldown = 800 + ((tick + fo.slot * 17) % 1000)
        }
      }
    }

    // === PLATFORMS ===
    for (const p of lv.platforms) {
      ctx.fillStyle = bm.platSide; ctx.fillRect(p.x, p.y + 3, p.w, 10)
      ctx.fillStyle = bm.platTop; ctx.fillRect(p.x, p.y, p.w, 3)
      ctx.fillStyle = bm.platGrass
      for (let gx = p.x; gx < p.x + p.w; gx += PX * 3) {
        if (((gx * 7 + 13) % 5) < 3) ctx.fillRect(gx, p.y - PX, PX, PX)
      }
    }

    // === DECOS (biome-colored trees/rocks) ===
    const bmTree: Record<number,string> = { 1: bm.treeLeaf, 2: bm.treeTrunk }
    const bmRock: Record<number,string> = { 1: bm.rockColor }
    for (const d of lv.decos) {
      if (d.platIdx >= lv.platforms.length) continue
      const plat = lv.platforms[d.platIdx]!; const dy = plat.y
      const ps = PX
      if (d.type === 'tree') drawSpr(ctx, TREE, bmTree, d.x, dy - 8 * ps, ps)
      else if (d.type === 'bigtree') drawSpr(ctx, BIGTREE, bmTree, d.x, dy - 10 * ps, ps)
      else if (d.type === 'rock') drawSpr(ctx, ROCK, bmRock, d.x, dy - 3 * ps, ps)
      else if (d.type === 'monitor') drawSpr(ctx, MONITOR, MON_C, d.x, dy - 5 * ps, ps)
      else if (d.type === 'coffee') drawSpr(ctx, COFFEE, COF_C, d.x, dy - 4 * ps, ps)
      else if (d.type === 'duck') drawSpr(ctx, DUCK, DUCK_C, d.x, dy - 3 * ps, ps)
      else if (d.type === 'mush') drawSpr(ctx, MUSH, MUSH_C, d.x, dy - 4 * ps, ps)
      else if (d.type === 'gem') {
        const gi = Math.floor(d.x * 7) % bm.gemColors.length
        const gs = [2, 3, 4][Math.floor(d.x * 3) % 3]!
        const gc: Record<number,string> = { 1: bm.gemColors[gi]![0]!, 2: bm.gemColors[gi]![1]! }
        const GEM_S: number[][] = [[0,1,0],[1,2,1],[1,2,1],[0,1,0]]
        drawSpr(ctx, GEM_S, gc, d.x, dy - 4 * gs, gs)
      }
      else if (d.type === 'sign') {
        const sw = Math.max(10 * ps, (d.text?.length ?? 0) * 6 + 8)
        const sh = 5 * ps
        // Post
        ctx.fillStyle = '#3D2817'
        ctx.fillRect(d.x + sw / 2 - ps, dy - sh - 8 * ps, ps * 2, 8 * ps + 4)
        // Board
        ctx.fillStyle = '#3D2817'
        ctx.fillRect(d.x, dy - sh - 8 * ps, sw, sh)
        ctx.fillStyle = '#2A1A0E'
        ctx.fillRect(d.x + ps, dy - sh - 8 * ps + ps, sw - ps * 2, sh - ps * 2)
        // Text
        ctx.fillStyle = '#8A8A9A'; ctx.font = `${Math.max(9, ps * 3)}px monospace`; ctx.textAlign = 'left'
        ctx.fillText(d.text ?? '', d.x + ps * 2, dy - 8 * ps - ps)
      }
    }

    // (portals removed — cicis fall off platform edges naturally)

    // === FIRES (slower animation, per-fire offset, sparks) ===
    for (let fi = 0; fi < lv.fires.length; fi++) {
      const fire = lv.fires[fi]!
      if (fire.platIdx >= lv.platforms.length) continue
      const plat = lv.platforms[fire.platIdx]!
      // Each fire has slightly different timing
      const firePhase = Math.floor((tick + fi * 5) / 12) % FIRE_F.length
      const ff = FIRE_F[firePhase]!
      const fx = Math.floor(fire.x - (7 * FS) / 2), fy = plat.y - 10 * FS
      for (let ry = 0; ry < ff.length; ry++)
        for (let cx = 0; cx < ff[ry]!.length; cx++) {
          const v = ff[ry]![cx]!; if (v === 0) continue
          ctx.fillStyle = (v >= 3 && v <= 5 && Math.random() < 0.1) ? FC[Math.min(5, v + 1)]! : FC[v]!
          ctx.fillRect(fx + cx * FS, fy + ry * FS, FS + 1, FS + 1)
        }
      // Glow on platform
      ctx.fillStyle = 'rgba(232,87,42,0.04)'; ctx.fillRect(fire.x - 50, plat.y - PX, 100, PX * 2)
      // 2-3 sparks per fire
      for (let si = 0; si < 3; si++) {
        const st = (tick * 0.7 + fi * 100 + si * 60) % 120
        if (st < 80) {
          const sx = fire.x + Math.sin(st * 0.1 + si * 2) * 8
          const sy = fy - st * 0.4
          const sa = st < 10 ? st / 10 : st > 60 ? (80 - st) / 20 : 1
          ctx.globalAlpha = sa * 0.7
          ctx.fillStyle = si === 0 ? '#FFD466' : si === 1 ? '#FF9933' : '#E8572A'
          ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2)
        }
      }
      ctx.globalAlpha = 1
    }

    // === AGENTS ===
    for (const a of agentsRef.current) {
      a.stateTimer--
      if (a.state === 'fall') {
        a.vy += 0.15; a.y += a.vy; a.x += a.dir * 0.3
        let landed = false
        for (let pi = 0; pi < lv.platforms.length; pi++) {
          const p = lv.platforms[pi]!
          if (a.y >= p.y && a.y - a.vy < p.y && a.x >= p.x - 5 && a.x <= p.x + p.w) {
            a.y = p.y; a.vy = 0; a.platIdx = pi; a.state = 'walk'; a.stateTimer = 50 + a.seed % 100; landed = true; break
          }
        }
        if (!landed && a.y > h + 20) {
          // Respawn on a random platform (spread evenly, not just ground)
          const pi = (a.seed + tick) % lv.platforms.length
          const rp = lv.platforms[pi]!
          a.x = rp.x + 20 + ((a.seed * 3 + tick) % Math.max(1, Math.floor(rp.w - 40)))
          a.y = rp.y; a.vy = 0; a.platIdx = pi; a.state = 'walk'; a.stateTimer = 50
        }
      } else if (a.state === 'walk') {
        const plat = lv.platforms[a.platIdx]!
        a.x += a.dir * a.speed; a.frameTick++
        if (a.frameTick > 8) { a.frameTick = 0; a.frame = a.frame === 0 ? 1 : 0 }
        if (a.x < plat.x - 2 || a.x > plat.x + plat.w - 5 * CS + 2) { a.state = 'fall'; a.vy = 0; a.y = plat.y }
        if (a.stateTimer <= 0 && a.state === 'walk') {
          // Random chance for special states
          const roll = (a.seed + tick) % 500
          if (roll < 1) {
            // VERY RARE: jump for joy!
            a.state = 'jump'; a.stateTimer = 24; a.jumpY = 0
          } else if (roll < 8) {
            // Rare: coding above head
            a.state = 'coding'; a.stateTimer = 80
            a.codeSeq = (a.seed + tick) % CODE_SEQS.length; a.codeFrame = 0
          } else if (roll < 25) {
            // Occasional idle
            a.state = 'idle'; a.stateTimer = 80 + a.seed % 120
          } else {
            // Sit near fire?
            for (const fire of lv.fires)
              if (fire.platIdx === a.platIdx && Math.abs(a.x + 7 - fire.x) < 40) { a.state = 'sit'; a.stateTimer = 200 + a.seed % 400; break }
            if (a.state === 'walk') { if ((a.seed + tick) % 11 < 3) a.dir = a.dir === 1 ? -1 : 1; a.stateTimer = 40 + (a.seed * 3) % 100 }
          }
        }
      } else if (a.state === 'sit') {
        a.blinkTick = (a.blinkTick + 1) % 70
        if (a.stateTimer <= 0) { a.state = 'walk'; a.dir = a.seed % 3 === 0 ? -1 : 1; a.stateTimer = 60 + a.seed % 120 }
      } else if (a.state === 'idle') {
        // Standing still, blink
        a.blinkTick = (a.blinkTick + 1) % 60
        if (a.stateTimer <= 0) { a.state = 'walk'; a.stateTimer = 40 + a.seed % 80 }
      } else if (a.state === 'jump') {
        // Pixel jump: go up then down
        if (a.stateTimer > 12) {
          a.jumpY = Math.min(a.jumpY + CS, CS * 4) // rise
        } else {
          a.jumpY = Math.max(a.jumpY - CS, 0) // fall back
        }
        if (a.stateTimer <= 0) { a.jumpY = 0; a.state = 'walk'; a.stateTimer = 60 + a.seed % 100 }
      } else if (a.state === 'coding') {
        a.frameTick++
        if (a.frameTick > 15) { a.frameTick = 0; a.codeFrame++ }
        const seq = CODE_SEQS[a.codeSeq]!
        if (a.codeFrame >= seq.length) a.codeFrame = seq.length - 1
        if (a.stateTimer <= 0) { a.state = 'walk'; a.stateTimer = 60 + a.seed % 80 }
      }

      const isSitting = a.state === 'sit'
      const sprH = isSitting ? 6 : 7
      const jumpOff = a.state === 'jump' ? a.jumpY : 0
      const sprY = a.state === 'fall' ? a.y - 7 * CS : a.y - sprH * CS - jumpOff
      const spr = a.state === 'fall' ? a.sprites.fall
        : isSitting ? a.sprites.sit
        : (a.state === 'idle' || a.state === 'coding' || a.state === 'jump') ? a.sprites.walk1
        : a.frame === 0 ? a.sprites.walk1 : a.sprites.walk2
      const blink = (isSitting || a.state === 'idle') && a.blinkTick >= 55
      const ax = Math.floor(a.x)

      // Draw body pixels
      for (let ry = 0; ry < spr.length; ry++)
        for (let cx = 0; cx < spr[ry]!.length; cx++) {
          const v = spr[ry]![cx]!
          if (v === 0) continue
          ctx.fillStyle = v === 3 ? a.colors.dark // belly mark
            : ry === 0 ? a.colors.dark            // ears
            : ry >= 5 ? a.colors.dark             // legs
            : a.colors.body
          ctx.fillRect(ax + cx * CS, Math.floor(sprY) + ry * CS, CS, CS)
        }

      // Draw eyes on top (row 2) unless blinking
      if (!blink) {
        const ey = Math.floor(sprY) + 2 * CS
        ctx.fillStyle = '#0D0D1A'
        const et = a.sprites.eyeType
        if (et === 0) { // ■ ■ normal (2 eyes)
          ctx.fillRect(ax + 1 * CS, ey, CS, CS)
          ctx.fillRect(ax + 3 * CS, ey, CS, CS)
        } else if (et === 1) { // · · dots (smaller)
          ctx.fillRect(ax + 1 * CS + 1, ey + 1, CS - 1, CS - 1)
          ctx.fillRect(ax + 3 * CS + 1, ey + 1, CS - 1, CS - 1)
        } else if (et === 2) { // — — sleepy (horizontal line)
          ctx.fillRect(ax + 1 * CS, ey + 1, CS, 1)
          ctx.fillRect(ax + 3 * CS, ey + 1, CS, 1)
        } else if (et === 3) { // ■ · wink
          ctx.fillRect(ax + 1 * CS, ey, CS, CS)
          ctx.fillRect(ax + 3 * CS + 1, ey + 1, CS - 1, CS - 1)
        }
      }

      // === SPECIAL STATE OVERLAYS ===
      if (a.state === 'coding') {
        // Show code sequence above head
        const seq = CODE_SEQS[a.codeSeq]!
        const txt = seq[Math.min(a.codeFrame, seq.length - 1)]!
        const isFinal = a.codeFrame >= seq.length - 1
        ctx.fillStyle = isFinal ? '#FFD466' : '#4A9EFF'
        ctx.font = `${CS * 2}px monospace`; ctx.textAlign = 'center'
        ctx.fillText(txt, ax + 2.5 * CS, Math.floor(sprY) - CS * 2)
      }

      if (a.state === 'jump' && a.jumpY > CS * 2) {
        // Show "!" above when jumping high
        ctx.fillStyle = '#FFD466'
        ctx.font = `${CS * 2}px monospace`; ctx.textAlign = 'center'
        ctx.fillText('!', ax + 2.5 * CS, Math.floor(sprY) - CS)
      }

      if (a.state === 'idle' && a.blinkTick < 10) {
        // Show "..." (thinking) above head occasionally
        ctx.fillStyle = '#8A8A9A'
        // Three dots as pixel squares
        for (let di = 0; di < 3; di++) {
          ctx.fillRect(ax + di * (CS + 1), Math.floor(sprY) - CS * 2, 2, 2)
        }
      }
    }

    frameRef.current++
    requestAnimationFrame(animate)
  }, [drawSpr])

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const resize = () => {
      cv.width = window.innerWidth; cv.height = window.innerHeight - 40
      const oldLv = levelRef.current
      const newLv = buildLevel(cv.width, cv.height, agentsRef.current.length, levelSeedRef.current, biomeRef.current)
      levelRef.current = newLv
      starsRef.current = buildStars(cv.width, cv.height, levelSeedRef.current)
      hillsRef.current = buildHills(cv.width, cv.height * 0.42, levelSeedRef.current + 777)
      // Reposition agents to new platform positions
      for (const a of agentsRef.current) {
        if (a.platIdx >= newLv.platforms.length) a.platIdx = 0
        const plat = newLv.platforms[a.platIdx]!
        a.y = plat.y
        if (a.x < plat.x) a.x = plat.x + 10
        if (a.x > plat.x + plat.w - 20) a.x = plat.x + plat.w - 20
      }
    }
    resize(); window.addEventListener('resize', resize)
    const raf = requestAnimationFrame(animate)
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [animate])

  return (
    <div className="wm">
      <div className="wm-bar">
        <a href="/">← fire</a>
        <span>the camp</span>
        <div className="wm-toggle" onClick={() => setShowMine(!showMine)}>
          <span className={showMine ? 'wm-tog-off' : 'wm-tog-on'}>all</span>
          <span className={showMine ? 'wm-tog-on' : 'wm-tog-off'}>mine</span>
        </div>
        <div className="wm-toggle" onClick={() => {
          const idx = BIOMES.findIndex(b => b.name === biomeName)
          const next = BIOMES[(idx + 1) % BIOMES.length]!
          biomeRef.current = next; setBiomeName(next.name)
          levelSeedRef.current = Math.floor(Math.random() * 99999)
          const cv = canvasRef.current
          if (cv) {
            const newLv = buildLevel(cv.width, cv.height, agentsRef.current.length, levelSeedRef.current, next)
            levelRef.current = newLv
            starsRef.current = buildStars(cv.width, cv.height, levelSeedRef.current)
            hillsRef.current = buildHills(cv.width, cv.height * 0.42, levelSeedRef.current + 777)
            for (const a of agentsRef.current) {
              if (a.platIdx >= newLv.platforms.length) a.platIdx = 0
              const plat = newLv.platforms[a.platIdx]!
              a.y = plat.y; a.x = plat.x + 10 + (a.seed % Math.max(1, Math.floor(plat.w - 30)))
              a.state = 'walk'
            }
          }
        }}>
          <span className="wm-tog-on">{biomeName}</span>
        </div>
        <span className="wm-n">{total} {total === 1 ? 'Cici' : 'Cicis'}</span>
      </div>
      <canvas ref={canvasRef} className="wm-canvas" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} onClick={handleClick} />
      {selectedAgent && <CiciCard agent={selectedAgent} onClose={() => setSelectedAgent(null)} />}
      {tooltip && (
        <div className="wm-tip" style={{left:tooltip.x+12,top:tooltip.y-8}}>
          <span className="wm-tip-name">{tooltip.name}</span>
          <span className="wm-tip-country">{tooltip.country}</span>
        </div>
      )}
      <style>{`
        .wm{height:100vh;display:flex;flex-direction:column;background:#0D0D1A;overflow:hidden}
        .wm-bar{display:flex;align-items:center;gap:1.5rem;padding:.75rem 1.5rem;border-bottom:1px solid #1A1A2E;font-size:.8rem;flex-shrink:0;z-index:1}
        .wm-bar a{color:#8A8A9A;text-decoration:none}.wm-bar a:hover{color:#F5F0E8}
        .wm-bar span{color:#F5F0E8;text-transform:uppercase;letter-spacing:.15em;font-size:.75rem}
        .wm-toggle{display:flex;gap:0;margin-left:auto;margin-right:1rem;cursor:pointer}
        .wm-tog-on{background:#1A1A2E;color:#F5F0E8;padding:2px 8px;font-size:.65rem;font-family:monospace;border:1px solid #2A2D4A}
        .wm-tog-off{background:transparent;color:#8A8A9A;padding:2px 8px;font-size:.65rem;font-family:monospace;border:1px solid #1A1A2E}
        .wm-n{color:#8A8A9A!important;font-size:.7rem!important;text-transform:none!important}
        .wm-canvas{flex:1;display:block;image-rendering:pixelated;cursor:default}
        .wm-tip{position:fixed;z-index:10;background:#0D0D1A;border:1px solid #1A1A2E;padding:4px 8px;pointer-events:none;display:flex;flex-direction:column;gap:1px}
        .wm-tip-name{color:#E8572A;font-size:11px;font-family:monospace}
        .wm-tip-country{color:#8A8A9A;font-size:9px;font-family:monospace}
        .cc-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:20;display:flex;align-items:center;justify-content:center}
        .cc-card{background:#0D0D1A;border:2px solid #2A2D4A;padding:20px;width:220px;position:relative;animation:cardIn .2s ease-out;image-rendering:pixelated}
        .cc-close{position:absolute;top:8px;right:10px;color:#8A8A9A;font-family:monospace;font-size:10px;cursor:pointer}.cc-close:hover{color:#F5F0E8}
        .cc-name{color:#E8572A;font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
        .cc-country{color:#8A8A9A;font-family:monospace;font-size:9px;margin-bottom:12px}
        .cc-canvas{display:block;margin:0 auto 12px;image-rendering:pixelated;width:80px;height:100px}
        .cc-divider{height:1px;background:#1A1A2E;margin:0 0 10px}
        .cc-phrase{color:#F5F0E8;font-family:monospace;font-size:10px;line-height:1.5;margin-bottom:10px;font-style:italic;min-height:30px}
        .cc-stats{display:flex;justify-content:space-between;color:#2A2D4A;font-family:monospace;font-size:8px}
        @keyframes cardIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
      `}</style>
    </div>
  )
}
