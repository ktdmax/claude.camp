// Deterministic owner name generator (Adjective + Animal)
// Different word lists than Cici names (which use Adjective + Tech-Noun)

const ADJ = [
  'Grumpy', 'Sleepy', 'Cosmic', 'Fuzzy', 'Mighty',
  'Silent', 'Brave', 'Lucky', 'Clever', 'Sneaky',
  'Rusty', 'Jolly', 'Swift', 'Gentle', 'Fierce',
  'Wild', 'Calm', 'Bold', 'Wise', 'Quirky',
]

const ANIMALS = [
  'Cat', 'Fox', 'Owl', 'Wolf', 'Bear',
  'Hawk', 'Deer', 'Crow', 'Lynx', 'Moth',
  'Seal', 'Hare', 'Wren', 'Newt', 'Toad',
  'Mole', 'Finch', 'Viper', 'Raven', 'Panda',
]

// Takes an owner_hash (hex string) and returns a deterministic name
// Uses first 4 bytes (8 hex chars) of the hash for index selection
export function ownerName(ownerHash: string): string {
  const hex = ownerHash.replace(/[^0-9a-fA-F]/g, '').slice(0, 8)
  const n = parseInt(hex, 16) || 0
  const adj = ADJ[n % ADJ.length]!
  const animal = ANIMALS[Math.floor(n / ADJ.length) % ANIMALS.length]!
  return `${adj} ${animal}`
}
