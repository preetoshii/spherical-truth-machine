# Bounsight AI Agent Guidelines

## ⚠️ META-RULE: Maintaining This File

**IMPORTANT:** This file (AGENTS.md) is the single source of truth for AI agent context across all tools (Claude Code, Cursor, etc.).

**When adding or updating AI agent instructions:**
- ✅ **ALWAYS** edit this file (AGENTS.md)
- ❌ **NEVER** edit CLAUDE.md or .cursorrules (they just reference this file)
- ❌ **NEVER** create tool-specific instruction files

**If the user asks to "add a rule" or "remember this for future AI sessions":**
1. Add the instruction to the appropriate section in this file
2. Keep instructions clear, specific, and actionable
3. Use examples where helpful
4. Update existing sections rather than creating duplicate content

**File structure:**
- `AGENTS.md` ← Edit this (you are here)
- `CLAUDE.md` ← Contains only `@AGENTS.md` (do not edit)
- `.cursorrules` ← Contains only `@AGENTS.md` (do not edit)

---

## Project Overview

Bounsight is a React Native game built with Expo that combines physics-based gameplay with scheduled audio messages. The game features a bouncing ball with facial expressions that responds to physics interactions while users can schedule voice messages through an admin portal.

**Key Features:**
- Physics-based bouncing ball with Matter.js engine
- Animated facial expressions that respond to physics state
- Scheduled audio messages that play during gameplay
- Word-level highlighting synchronized with audio playback
- Admin portal for message scheduling and audio recording
- Cross-platform (Web, iOS, Android)

## Technology Stack

### Core Framework
- **Expo** - Cross-platform development (web, iOS, Android)
- **React Native** - UI framework
- **React Native Skia** - GPU-accelerated canvas rendering (unified renderer for all platforms)
- **Matter.js** - 2D physics engine

### Audio System
- **Recording:** expo-audio (cross-platform recording)
- **Playback:** expo-audio with precise seekTo() control
- **Word Timing:** Custom RMS envelope detection (NOT Google STT)
- **Speech-to-Text:** Google Cloud STT (transcription only, NOT for word timing)

### Key Libraries
- **expo-haptics** - Vibration feedback
- **react-native-reanimated** - Smooth 60/120fps animations
- **react-native-web** - Web platform support

## Codebase Structure

See [src/README.md](src/README.md) for detailed navigation guide.

### Key Entry Points
- `index.js` → `App.js` → Main application entry
- `src/game/render/GameApp.jsx` - Main game component
- `src/game/core/GameCore.js` - Physics engine and game state
- `src/admin/AdminPortal.jsx` - Content management interface
- `src/config.js` - All tunable constants (physics, colors, sizes, timing)

### Folder Organization
- `src/game/` - Game logic
  - `core/` - Physics engine (GameCore.js)
  - `render/` - Rendering layer (GameApp.jsx, GameRenderer.jsx)
  - `hooks/` - React hooks (useGameLoop.js)
  - `parallax/` - Background effects (ParallaxManager.js)
- `src/admin/` - Admin portal
  - `AdminPortal.jsx` - Main interface
  - `CalendarView.jsx` - Message scheduling
  - `TextEditor.jsx` - Message composition
  - `AudioRecorder.jsx` - Voice recording
  - `PreviewMode.jsx` - Test messages in gameplay
  - `githubApi.js` - GitHub integration for message storage
- `src/services/` - External services
  - `audioRecordingService.js` - expo-audio wrapper
  - `wordTimestampsService.js` - API client for word boundaries
  - `googleSpeechService.js` - Google Cloud STT
- `src/utils/` - Utilities
  - `audio.js` - Sound effects playback
  - `haptics.js` - Vibration feedback
- `src/components/` - Reusable UI
  - `Button.jsx` - Universal button with scale animation and sound
  - `DebugMenu.jsx` - Debug controls
- `src/sfx/` - Sound effects (.wav files)

## Coding Standards

### Language & Style
- Use **JavaScript** (NOT TypeScript)
- Functional components with React hooks
- Expo/React Native best practices
- No class components
- Simple, direct code over abstractions

### Audio Implementation
- ✅ Use `expo-audio` for ALL audio operations (recording and playback)
- ✅ Use `createAudioPlayer()` from expo-audio for playback
- ✅ Use `audioPlayer.seekTo()` for precise segment control
- ❌ **NEVER** suggest Howler.js (not used in this project)
- ❌ **NEVER** use HTML5 `<audio>` elements (not compatible with React Native)

### Word Timing System
- ✅ Word boundaries come from **energy-based RMS envelope detection**
- ✅ API endpoint: `/api/align.js` (Vercel serverless function)
- ✅ 5-10ms accuracy using audio energy analysis
- ❌ Google Cloud STT provides **transcription text ONLY**, NOT word timing
- ❌ Do NOT assume Google STT provides word boundaries (it doesn't in this project)

### Configuration
- All game constants live in `src/config.js`
- Physics constants (gravity, restitution, friction)
- Colors and theming
- Font sizes and UI spacing
- Audio timing parameters
- Ask before modifying physics constants
- Test changes on both web and mobile

### Platform Differences
- **Web:** Canvas-based rendering via CanvasKit WASM
- **Mobile:** Native Skia renderer (iOS/Android)
- **Always** test major changes on both web and mobile
- Rendering code is unified via React Native Skia

## Common Patterns

### Rendering
- Use React Native Skia for custom graphics
- Unified renderer works identically on web and mobile
- Game loop in `src/game/hooks/useGameLoop.js`
- 60fps target with requestAnimationFrame
- GameRenderer receives game state and renders to Skia canvas

### State Management
- React useState and useEffect for component state
- No Redux or external state management library
- Game state managed in GameCore.js
- Admin portal state managed locally in admin components

### Physics
- Matter.js engine instance in GameCore.js
- Ball physics with gravity, restitution, friction
- Line drawing creates static Matter.js bodies
- Collision detection for ball interactions

### Audio Playback
- Create player: `createAudioPlayer({ uri: audioUri })`
- Seek to position: `audioPlayer.seekTo(startSeconds)`
- Play: `audioPlayer.play()`
- Pause: `audioPlayer.pause()`
- Word highlighting synchronized with playback time

## Documentation

- **`docs/`** - Design documentation and implementation notes
  - `audio-recording-design.md` - Audio system architecture
  - `bounsight-dev-doc.md` - Main developer documentation
- **`src/README.md`** - Codebase navigation guide
- **`.claude/`** - Claude Code specific files
  - `android-build-workflow.md` - Android build instructions

## External Projects

- **`/api/`** - Vercel serverless functions (separate Node.js project)
  - `/api/align.js` - Word boundary detection API (RMS envelope + Google STT)
- **`/modules/expo-custom-haptics/`** - Custom Android haptics module (if still used)

## What NOT to Do

### Technology Choices
- ❌ Don't suggest converting to TypeScript
- ❌ Don't recommend Howler.js (we use expo-audio)
- ❌ Don't use deprecated React Native APIs
- ❌ Don't suggest Redux or other state management libraries
- ❌ Don't use HTML5 audio elements (not React Native compatible)

### Assumptions
- ❌ Don't assume Google STT provides word timing (it only provides transcription)
- ❌ Don't assume web-only solutions (must work on mobile)
- ❌ Don't modify physics constants without understanding impact

### Best Practices
- ❌ Don't create abstractions unless clearly needed
- ❌ Don't add dependencies without asking
- ❌ Don't modify `src/config.js` without testing on both platforms

## When in Doubt

1. Check `src/README.md` for file locations
2. Check `docs/` folder for design rationale and architecture decisions
3. Check `src/config.js` for tunable constants
4. Ask user before major architectural changes
5. Test on both web and mobile when making rendering or physics changes

## Git Workflow

- Main branch: `master`
- Create feature branches for new work
- Commit messages should be descriptive
- Test changes before committing

## Key Concepts

### Physics Ball
- Circular Matter.js body
- Animated facial expressions (eyes and mouth)
- Responds to gravity and collisions
- Visual feedback (squash/stretch, expressions)

### Line Drawing
- Touch/mouse input creates lines
- Lines become static Matter.js bodies
- Ball collides with drawn lines
- Lines stored and rendered with Skia

### Message System
- Messages stored in GitHub repository
- Scheduled by date and time
- Audio recordings with word-level timestamps
- Preview mode for testing in gameplay

### Parallax Background
- Animated starfield effect
- Multiple layers for depth
- Smooth scrolling based on ball position
