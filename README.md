# Bounsight

A minimalist, cross-platform bounce game that reveals insightful messages one word per bounce. Players draw temporary spring lines, and a bouncing ball character speaks each word on impact with synchronized audio and haptics.

Built by two brothers as a playful vehicle to share messages through gameplay.

---

## What is Bounsight?

Bounsight is a game where **repetition via play helps a message "settle in."** The loop is meditative and affirmative without feeling like a lecture. It's a tiny stage for words wrapped in fun, simple gameplay—the medium we enjoy building.

### Core Loop

1. The mascot (ball with a face) falls under gravity
2. The player draws a short line (swipe or drag)
3. That line becomes a springboard
4. On contact, the mascot bounces and **speaks the next word** of the message
5. After the final word, the message repeats word-by-word on subsequent bounces

Height is a side effect; the message is the point.

---

## Quick Start

```bash
npm install
npm run web         # Start web dev (http://localhost:8081)
npm run ios         # Start iOS (requires Xcode)
npm run android     # Start Android (requires Android Studio)
```

**Admin Portal:** Open the app → Press 'a' key → Click admin button (top-right) to schedule messages and record audio

---

## How the Game Works

### Controls

**Create springboard (line):**
- **Swipe:** Swipe in any direction to instantly create a straight line
- **Draw:** Touch and drag to draw; preview follows finger, final line is always straight

The line has a maximum length—if your finger exceeds it, the start point slides to maintain the constraint.

### Bouncing Mechanics

- **Bounce direction:** Perpendicular to the line's angle (not just "up")
- **Bounce strength:** Matter.js restitution + additional spring boost (tunable)
- **Multiple bounce prevention:** Brief immunity period after each bounce
- **Wall behavior:** Configurable as hard boundaries or wrap-around portals
- **Gravity & air resistance:** All tunable via `src/config.js`

### Line Lifetime

- A line **destructs after one bounce**, or
- When a new line is created (max one line at a time)
- Otherwise persists indefinitely

### Feedback

- **Visual:** Word appears center-screen on each bounce with gentle fade
- **Haptic:** Light tick on line placement, medium impact on bounce
- **Audio:** Character voice speaks the word (recorded, not synthesized)

### Progression

The playfield scrolls upward as you bounce higher. Height is tracked as a light counter—minimal and secondary to the message.

### Aesthetic

- Dark-mode, MS-DOS-like minimalism
- Clean typography, restrained palette
- Monospace-style vibe: ultra-simple UI with occasional moments of fluidity
- Mascot: Simple circle with a face (small mouth animations, expressions)

---

## Tech Stack

### Core Framework
- **Expo + React Native** - Single codebase for iOS, Android, Web
- **react-native-web** - True native apps with genuine native performance
- **Why:** Proper haptics, low-latency audio, unified codebase without web compromises

### Rendering
- **React Native Skia** - GPU-accelerated canvas rendering
- **Native:** `@shopify/react-native-skia`
- **Web:** CanvasKit WASM (~2MB)
- **Why:** Single rendering codebase = single source of truth. Draw once, looks identical everywhere.

### Physics
- **Matter.js** - 2D physics engine
- **Why:** Sweet spot between control and simplicity. Tweakable restitution, friction, gravity for micro-details of game feel. At 88kb, light enough for rapid iteration.

### Audio System
- **expo-audio** - Recording and playback (cross-platform)
- **Word timing:** RMS envelope detection (5-10ms accuracy)
- **Speech-to-text:** Google Cloud STT (transcription only)
- **Why:** Unified API eliminates need for multiple audio libraries. Low-latency with precise seekTo() for word segments.

### Haptics
- **expo-haptics** + Web Vibration API
- **Why:** Native haptic feedback crucial for game feel. Simple API with graceful web fallback.

### Message Storage
- **GitHub Repository** - `messages.json` + audio files
- **Why:** Zero setup, free hosting, built-in version control. GitHub API allows in-app updates. Global CDN for fast fetches. No separate backend infrastructure needed.

---

## Architecture

### Message System

**Recording-First Approach:**
1. Admin records full message phrase in admin UI (device microphone)
2. Audio uploaded to `/api/align` endpoint (Vercel serverless)
3. Energy-based RMS envelope detects precise word boundaries (5-10ms accuracy)
4. Google Cloud STT transcribes audio (text only, no timestamps)
5. 1:1 matching of transcribed words to detected energy segments
6. Optional: ElevenLabs Speech-to-Speech transforms voice to character voices

**Storage:**
```json
{
  "current": "2025-11-29",
  "messages": {
    "2025-11-29": {
      "text": "you are loved",
      "words": ["you", "are", "loved"],
      "audioUrl": "message-audio/2025-11-29.m4a",
      "wordTimings": [
        {"word": "you", "start": 0, "end": 300},
        {"word": "are", "start": 420, "end": 615},
        {"word": "loved", "start": 730, "end": 1180}
      ]
    }
  }
}
```

**Client Playback:**
- Load message audio on startup (single `.m4a` file with word timing metadata)
- Each bounce triggers:
  1. `audioPlayer.seekTo(wordTiming.start / 1000)` - Jump to word start
  2. `audioPlayer.play()` - Start playback
  3. `setTimeout(() => audioPlayer.pause(), duration)` - Stop at word end
- Audio files served from GitHub via raw.githubusercontent.com (browser caching handles performance)

### Physics Details

**Entities:**
- **Mascot:** Dynamic circular body (restitution, frictionAir, mass)
- **Line (Gelato):** Static body created from swipes (length-clamped, thickness-constrained)
- **Bounds:** Optional left/right walls or horizontal wrap

**Tunable Constants** (all in `src/config.js`):
- `gravityY`, `restitution`, `friction`, `frictionAir`
- Line: `maxLength`, `thickness`, `springBoost`
- Bounce: `minBounceIntervalMs` (debounce guard)
- Haptics strengths per event
- Audio ducking ratios

> **Note:** All constants are exploratory. Game feel emerges through playtesting. System designed to be expandable and highly tweakable.

### Rendering

**Single Renderer for All Platforms:**
```jsx
import { Canvas, Circle, Line } from '@shopify/react-native-skia'

export function GameRenderer({ gameState }) {
  return (
    <Canvas style={{ flex: 1 }}>
      <Circle cx={gameState.mascot.x} cy={gameState.mascot.y} r={30} />
      {gameState.lines.map(line => (
        <Line p1={line.start} p2={line.end} color="white" strokeWidth={4} />
      ))}
    </Canvas>
  )
}
```

This same code runs identically on iOS, Android, and Web.

---

## Admin Portal

### In-App Admin Architecture

Admin functionality lives directly in the game—no separate web portal. Message updates happen within the game itself (no context switching, no separate deployment).

### Gestural Password: The Staircase

Authentication through gameplay: **5 consecutive bounces where each bounce is progressively higher on screen AND each line is progressively shorter (≥20% narrower each time).**

This approach:
- Uses existing game mechanics (no separate auth UI)
- Requires intentional skill (won't happen accidentally)
- Feels like discovering a secret
- Even if reverse-engineered, must be physically performed

### Admin Flow

**Players:**
1. Launch app → fetch `messages.json` from GitHub → play

**Admins:**
1. Launch app → draw staircase pattern → admin panel appears
2. Record new message → automatic transcription → word segmentation
3. Submit → GitHub file updates → all users get new message on next launch

### Components

- **CalendarView** - Schedule messages by date
- **TextEditor** - Compose message text
- **AudioRecorder** - Record voice with device microphone
- **PreviewMode** - Test messages in gameplay before publishing
- **githubApi.js** - GitHub API integration for message updates

---

## Development

### Design Principles

- **Vibe-code friendly:** Minimal tech stack, direct manipulation of physics constants, immediate visual feedback
- **Universal updates:** Server-side message updates deploy instantly to all platforms (no app store submissions for content)
- **Radical simplicity:** Every feature and line of code must justify its existence
- **Lightweight everything:** Small bundles, minimal dependencies, fast load times
- **Single source of truth:** One codebase, one physics engine, one set of constants
- **No bloat:** The game is about bouncing and hearing words. Everything else is secondary.

### Key Files

- **`src/config.js`** - All tunable constants (physics, colors, timing, audio)
- **`src/game/core/GameCore.js`** - Physics engine, state management, collision detection
- **`src/game/render/GameApp.jsx`** - Main game component
- **`src/game/render/GameRenderer.jsx`** - Skia canvas renderer (unified for all platforms)
- **`src/game/hooks/useGameLoop.js`** - 60fps animation loop (requestAnimationFrame)
- **`src/admin/AdminPortal.jsx`** - Admin interface
- **`src/services/audioRecordingService.js`** - expo-audio wrapper
- **`src/services/wordTimestampsService.js`** - API client for word boundary detection
- **`src/utils/audio.js`** - Sound effects playback
- **`src/utils/haptics.js`** - Vibration feedback

See [src/README.md](src/README.md) for detailed codebase navigation.
See [AGENTS.md](AGENTS.md) for AI agent coding guidelines.

### Coding Standards

- **JavaScript** (not TypeScript) - Simpler for rapid iteration
- **Functional components** with React hooks
- **Avoid React state in hot loops** - Use refs/imperative stores for performance
- **60 FPS baseline** with 120 FPS where device supports
- **Test on both web and mobile** when making rendering or physics changes

---

## Project Structure

```
/
├── src/
│   ├── game/
│   │   ├── core/         # Physics engine (GameCore.js)
│   │   ├── render/       # Rendering (GameApp.jsx, GameRenderer.jsx)
│   │   ├── hooks/        # React hooks (useGameLoop.js)
│   │   └── parallax/     # Background effects
│   ├── admin/            # Admin portal (6 components)
│   ├── services/         # External services (audio, STT, word timing)
│   ├── utils/            # Utilities (audio playback, haptics)
│   ├── components/       # Reusable UI (Button, DebugMenu)
│   ├── sfx/              # Sound effects (.wav files)
│   └── config.js         # All tunable constants
├── api/                  # Vercel serverless functions
│   └── align.js          # Word boundary detection (RMS + Google STT)
├── docs/                 # Design documentation
├── messages.json         # Message storage (fetched by clients)
├── message-audio/        # Audio recordings (.m4a files)
├── AGENTS.md             # AI agent guidelines
└── README.md             # This file
```

---

## Documentation

- **[AGENTS.md](AGENTS.md)** - AI agent guidelines (commands, tech stack, patterns)
- **[src/README.md](src/README.md)** - Detailed codebase navigation
- **[docs/bounsight-dev-doc.md](docs/bounsight-dev-doc.md)** - Original design blueprint (includes TBD mechanics and implementation milestones)
- **[docs/audio-recording-design.md](docs/audio-recording-design.md)** - Audio system architecture details

---

## Performance Targets

- **60 FPS baseline** (120 FPS where supported)
- **Smooth, consistent experience** across all platforms
- **No visual differences** between web and mobile
- **Fast load times** with minimal bundle size
- **Low-latency audio** for tight word-bounce sync

---

## External Projects

- **`/api/align.js`** - Vercel serverless function for word boundary detection
  - RMS envelope analysis for precise timing
  - Google Cloud STT for transcription
  - Returns word timings + transcribed text
- **`/modules/expo-custom-haptics/`** - Custom Android haptics module (if needed for advanced patterns)

---

## Why These Choices?

**Expo + React Native:**
Yes, there's development overhead (Metro bundler quirks, longer build times), but it's worth it for genuine native performance and feel (proper haptics, low-latency audio). Single codebase without web compromises.

**React Native Skia:**
The 2MB web bundle cost (CanvasKit WASM) is worth the simplicity of a unified rendering codebase. No maintaining two drawing implementations.

**Matter.js:**
At 88kb, it's worth not debugging custom physics edge cases. Gives us polish potential for great game feel while staying lightweight.

**GitHub Storage:**
Zero setup, free hosting, built-in version control. Eliminates need for separate backend infrastructure in MVP. Good enough for 2-person creative project.

**Recording-First Audio:**
Authentic voice quality from creator recordings. No AI generation costs. Personal touch from real human voice.

---

## License

Private project by two brothers. Not open source.
