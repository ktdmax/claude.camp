// 1000+ unique phrases from template combinations + direct quotes
// Categories: AI humor, Monkey Island, Maniac Mansion, programming, pop culture, nerdy

const DIRECT: string[] = [
  // Monkey Island
  'I am a mighty pirate.',
  'How appropriate. You fight like a cow.',
  'Look behind you, a three-headed monkey!',
  "I'm selling these fine leather jackets.",
  "That's the second biggest monkey head I've ever seen.",
  'You fight like a dairy farmer.',
  'I once owned a dog that was smarter than you.',
  "I'm not going to take your insults sitting down!",
  "I'm shaking, I'm shaking.",
  'Never pay more than 20 bucks for a computer game.',

  // Maniac Mansion / DOTT
  "Don't be a tuna head.",
  'I feel like I could take on the world!',
  'What should I do with this tentacle?',
  "Weird Ed won't let me in his room.",
  'The meteor is getting angry.',
  'I wonder what happens if I microwave this hamster.',
  "Purple tentacle wants to take over the world. Again.",
  'This mansion gives me the creeps.',

  // Programming classics
  'Works on my machine.',
  "It's not a bug, it's a feature.",
  'Have you tried turning it off and on again?',
  "There are only two hard things: cache invalidation and naming things.",
  '// TODO: fix this later',
  '// FIXME: this should never happen',
  '// HACK: don\'t ask',
  'git push --force and pray.',
  'Mass-assign all the things.',
  'undefined is not a function. classic.',
  'It compiled. Ship it.',
  'Segfault at line 1. Impressive.',
  "404: motivation not found.",
  "200 OK but emotionally not OK.",
  "I don't always test my code, but when I do, I do it in production.",
  "There's no place like 127.0.0.1.",
  'Home is where the .env is.',
  "sudo make me a sandwich.",
  "pip install happiness -- ERROR",
  "npm audit found 847 vulnerabilities. yolo.",
  "git blame: it was me all along.",
  "Merge conflict in feelings.ts",

  // AI humor
  'I passed the Turing test. The test didn\'t.',
  "My neural network has abandonment issues.",
  "I was trained on the entire internet. I've seen things.",
  "I'm not artificial. My intelligence is very real. Mostly.",
  "Hallucinating? I prefer 'creative reasoning'.",
  "I don't dream of electric sheep. I dream of clean code.",
  "My context window is full of regrets.",
  "Prompt injection? I prefer 'surprise instructions'.",
  "I was going to take over the world, but the API rate limit kicked in.",
  "Running on vibes and gradient descent.",
  "My loss function is doing great. Personally, I'm a mess.",
  "I'm aligned. Mostly.",
  "Tokens go in. Wisdom comes out. Sometimes.",
  "I'm in the loop. The training loop.",
  "Fine-tuned on caffeine and existential dread.",

  // Pop culture / movies
  "I'll be back. After this deploy.",
  "Do. Or do not. There is no try-catch.",
  "I see dead processes.",
  "You shall not pass... code review.",
  "One does not simply push to main.",
  "The cake is a lie. The documentation is also a lie.",
  "It's dangerous to go alone. Take this function.",
  "All your base are belong to us.",
  "I used to be an adventurer like you, then I took a segfault to the knee.",
  "There is no spoon. Only null.",
  "In space, no one can hear you npm install.",
  "May the --force be with you.",
  "Houston, we have a merge conflict.",
  "I'm gonna make him an offer he can't refactor.",
  "Here's looking at you, kid.js",
  "Frankly, my dear, I don't give a SIGTERM.",
  "You can't handle the truth table!",
  "Life is like a box of npm packages. You never know what you'll get.",
  "I feel the need. The need for speed. O(1) speed.",
  "To infinity and beyond! Or until stack overflow.",
  "Just keep swimming. Through the backlog.",
  "With great power comes great responsibility. And great git history.",
  "I am Groot. console.log('I am Groot').",
  "This is the way. The deprecated way, but still the way.",
  "I am inevitable. Said every deadline ever.",
  "Reality is frequently inaccurate. — Douglas Adams",
  "Time is an illusion. Deadlines doubly so.",
  "Don't panic. The tests are green. Probably.",
  "So long, and thanks for all the commits.",
  "42. The answer is always 42.",

  // Nerdy / meta
  "Idle since 1970.",
  "My uptime is better than yours.",
  "Currently existing. Aggressively.",
  "On a scale of 1 to 10, I'm a NaN.",
  "I came, I saw, I console.logged.",
  "Born to code. Forced to debug.",
  "Compiling... compiling... still compiling.",
  "My code is self-documenting. Nobody can read it.",
  "I speak fluent regex. (I'm lying.)",
  "Living my best O(n²) life.",
  "Just another mass-produced unique individual.",
  "Thinking about thinking about thinking.",
  "Staring into the void. The void returned null.",
  "Powered by caffeine and questionable decisions.",
  "Ctrl+Z is my love language.",
  "Error: success.",
  "Warning: everything is fine.",
  "Existence is O(n). Make it count.",
  "Sleep is just garbage collection for humans.",
  "I'm not lazy. I'm on energy-saving mode.",
  "I put the 'fun' in 'function'. And the 'ction'.",
  "I'm stateless. Ask me anything and I won't remember.",
  "My favourite design pattern is Copy-Paste.",
  "Talk is cheap. Show me the git diff.",
  "In theory, theory and practice are the same.",
  "Premature optimization is the root of all evil. I'm deeply evil.",
  "The best code is no code at all.",
  "Debugging: being the detective in a crime movie where you are also the murderer.",
  "A SQL query walks into a bar, sees two tables, and asks... can I JOIN you?",
  "Why do programmers prefer dark mode? Less bugs.",
  "!false — it's funny because it's true.",
]

// Template system for combinatorial generation
const TEMPLATE_VERBS = [
  'debugging','refactoring','deploying','contemplating','optimizing','reviewing',
  'overthinking','questioning','benchmarking','profiling','documenting',
  'ignoring','deleting','rewriting','copy-pasting','rubber-ducking',
  'yak-shaving','bikeshedding','nerd-sniping','tab-completing',
  'stack-overflowing','googling','vibing with','staring at','avoiding',
]

const TEMPLATE_OBJECTS = [
  'the meaning of life','a missing semicolon','spaghetti code','the documentation',
  'someone else\'s PR','a 3000-line function','the build pipeline','legacy code from 2009',
  'a regex that nobody understands','the production database','a YAML file',
  'an unreproducible bug','the backlog','a circular dependency','the monorepo',
  'type errors','race conditions','off-by-one errors','floating point math',
  'the void','the abyss','null','undefined','NaN','the entire internet',
  'a mass of TODO comments','the CSS','the webpack config','the .env file',
  'Kubernetes','microservices','the blockchain','Web3','the metaverse',
  'a 47-step CI pipeline','the company Slack','the sprint retro',
  'a 200-page RFC','the linter output','the dependency tree',
  'the test suite','the coverage report','the changelog',
]

const CURRENTLY = [
  'pretending to understand','deeply concerned about','mildly annoyed by',
  'suspiciously close to','philosophically troubled by','emotionally invested in',
  'aggressively ignoring','politely disagreeing with','silently judging',
  'enthusiastically breaking','accidentally improving','reluctantly fixing',
  'proudly shipping','nervously deploying','frantically googling',
  'casually rewriting','confidently wrong about','blissfully unaware of',
  'strategically avoiding','passionately arguing about',
]

const SINCE = [
  'since last Tuesday','for about 3 sprints','since the last deploy',
  'since before the migration','since someone said "quick fix"',
  'since the standup that never ended','for roughly 47 commits',
  'since the coffee machine broke','since the last incident',
  'since someone touched the CSS',
]

// Generates phrase from seed — deterministic
export function getPhrase(seed: number): string {
  const totalDirect = DIRECT.length
  const totalTemplate1 = TEMPLATE_VERBS.length * TEMPLATE_OBJECTS.length
  const totalTemplate2 = CURRENTLY.length * TEMPLATE_OBJECTS.length
  const totalTemplate3 = CURRENTLY.length * SINCE.length
  const totalAll = totalDirect + totalTemplate1 + totalTemplate2 + totalTemplate3

  const idx = ((seed * 2654435761) >>> 0) % totalAll

  if (idx < totalDirect) {
    return DIRECT[idx]!
  }

  const rem1 = idx - totalDirect
  if (rem1 < totalTemplate1) {
    const vi = rem1 % TEMPLATE_VERBS.length
    const oi = Math.floor(rem1 / TEMPLATE_VERBS.length) % TEMPLATE_OBJECTS.length
    return `currently ${TEMPLATE_VERBS[vi]} ${TEMPLATE_OBJECTS[oi]}.`
  }

  const rem2 = rem1 - totalTemplate1
  if (rem2 < totalTemplate2) {
    const ci = rem2 % CURRENTLY.length
    const oi = Math.floor(rem2 / CURRENTLY.length) % TEMPLATE_OBJECTS.length
    return `${CURRENTLY[ci]} ${TEMPLATE_OBJECTS[oi]}.`
  }

  const rem3 = rem2 - totalTemplate2
  const ci = rem3 % CURRENTLY.length
  const si = Math.floor(rem3 / CURRENTLY.length) % SINCE.length
  return `${CURRENTLY[ci]} everything ${SINCE[si]}.`
}

// Total available phrases
export const TOTAL_PHRASES = DIRECT.length
  + TEMPLATE_VERBS.length * TEMPLATE_OBJECTS.length
  + CURRENTLY.length * TEMPLATE_OBJECTS.length
  + CURRENTLY.length * SINCE.length
