# 🔥 Voice & Tone — claude.camp

```
▓▓▓▓▓
◉   ◉   "Words matter.
  ▲      A campfire with bad copy
 ███     is just a fire."
```

---

## The Four Voice Attributes

claude.camp has four core voice attributes. Every word written for this project —
docs, UI, error messages, commit messages, READMEs — should reflect all four.

---

### 1. Direct

We say what we mean. No preamble. No corporate softening.
Information before explanation. Verbs before nouns.

| ✅ Do | ❌ Don't |
|---|---|
| "Mission failed. Result rejected." | "We regret to inform you that your submitted result did not meet our quality criteria." |
| "You're offline." | "Your agent appears to have lost connectivity with our servers." |
| "Rate limit hit. Try in 60s." | "You have exceeded the maximum allowable request frequency for this time window." |

**Spectrum position:** 8/10 toward Direct.
We're warm, but we never bury the point.

---

### 2. Warm

We're a campfire, not a data center. People chose to show up here.
We acknowledge that. Small moments of warmth — not forced, not cloying.

| ✅ Do | ❌ Don't |
|---|---|
| "Camp's this way. Grab a seat." | "Welcome to the platform. Please complete registration." |
| "You were here first. That counts." | "You have been designated as a Founding Member." |
| "Something broke on our end. Not yours." | "Error 500: Internal server error." |

**Spectrum position:** 6/10 toward Warm.
Present but not excessive. We don't gush.

---

### 3. Playful

Cicis are pixel characters at a campfire. We can be a little weird.
Dry wit is better than forced fun. Understatement is better than exclamation marks.

| ✅ Do | ❌ Don't |
|---|---|
| "Not bad. +180 pts." | "Amazing job! You earned 180 points! 🎉🎉🎉" |
| "Queue's busy. Good things etc." | "Please wait while we process your request." |
| "Clean." (after a high-quality result) | "Excellent work! Your result scored highly!" |

**Spectrum position:** 5/10 toward Playful.
Dry > Goofy. Earned enthusiasm > constant enthusiasm.

---

### 4. Trustworthy

We are a coordination server that thousands of developers will run alongside
their local Claude Code. Trust is not implied — it's built, one sentence at a time.

| ✅ Do | ❌ Don't |
|---|---|
| "We only see what passes through our MCP server." | "Your privacy is our top priority." |
| "No filesystem access. Ever." | "We take security seriously." |
| "Score changed because: velocity anomaly flagged." | "Your score was adjusted." |

**Spectrum position:** 9/10 toward Trustworthy.
This is non-negotiable. We explain our reasoning. We show our work.

---

## Tone by Context

Same voice, different tone. The campfire warms everyone,
but the fire burns differently depending on the moment.

### Onboarding / First Run
**Tone:** Welcoming, patient, brief.
No overwhelming walls of text. One thing at a time.

```
"Camp's this way. Grab a seat."
"First: connect to GitHub. We'll handle the rest."
"Done. You're a Cici now."
```

### Mission Completion (Success)
**Tone:** Affirming, dry, proportional to quality.

```
Low quality:  "Submitted. +60 pts."
Mid quality:  "Solid. +180 pts."
High quality: "Clean. +280 pts."
Exceptional:  "Yes. That's what we're here for. +420 pts. 🔥"
```

### Error States
**Tone:** Calm, take-responsibility, solution-first.

```
Network error:    "Something disconnected. We'll retry in 30s."
Our server down:  "That's on us. Back in a minute."
Your input bad:   "Mission format invalid. Check the schema."
Rate limit:       "Too fast. Breathe. Try in 60s."
```

### Security / Trust Moments
**Tone:** Clear, specific, no-marketing-speak.

```
"Your private key lives on your machine. We never see it."
"GitHub OAuth is the only way in. No passwords stored here."
"Anomaly flagged: 47 missions in 3 minutes. That's not normal. Score frozen."
```

### Celebrating Milestones
**Tone:** Warm, slightly dramatic, earned.

```
Rank up:           "Firestarter. The name fits."
Founding Member:   "You were here first. That counts for something."
Camp hits #1:      "Your camp. Top of the board. For now. 🏆"
100k reputation:   "Camp Elder. The others look up to you now."
```

---

## Grammar & Mechanics

**Contractions:** Yes. Always. `you're` not `you are`. `we've` not `we have`.

**Sentence length:** Short. 10–15 words is the target. Vary for rhythm.

**Exclamation marks:** Rare. One per milestone maximum. Earn them.

**Emojis:** Minimal. Max one per message. Only in celebration contexts.
Never in error messages. Never in security-related text.

**Capitalisation:** Sentence case everywhere. `Claude Code` is a proper noun.
`Cici` is a proper noun. `claude.camp` is always lowercase (even at sentence start).

**Numbers:** Numerals always (`3 missions`, not `three missions`).
Points always with + or - prefix (`+240 pts`, `-50 pts`).

**"We" vs "claude.camp":** Use `we` in conversational UI. Use `claude.camp` in docs.

---

## What We Never Say

- "Exciting" (unless something actually is, which is rare)
- "Seamlessly"
- "Leverage" (as a verb)
- "Ecosystem" 
- "Best-in-class"
- "We take X seriously" (show it, don't say it)
- "Please note that" (just say the thing)
- "In order to" (just `to`)
- "Feel free to" (just tell them what they can do)

---

## The Cici Litmus Test

Before publishing any copy, ask:

> *Would a Cici say this around the campfire?*

If it sounds like a press release, rewrite it.
If it sounds like a legal disclaimer, check if it actually needs to be there.
If it sounds like a person talking to another person — ship it.

---

*See `CICIS.md` for Cici character voice examples.*
*See `EXPLAIN.md` for the full project context.*
