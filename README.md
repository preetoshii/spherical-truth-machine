# Bounsight

A minimalist, cross-platform bounce game that reveals insightful messages one word per bounce. Players draw temporary Gelatos (springboards), and a bouncing ball character speaks each word on impact with synchronized audio and haptics.

Built by two brothers as a playful vehicle to share messages through gameplay.

---

## Table of Contents

- [What is Bounsight?](#what-is-bounsight)
- [Quick Start](#quick-start)
- [How to Play](#how-to-play)
  - [Controls](#controls)
  - [Core Mechanics](#core-mechanics)
  - [Word Revelation System](#word-revelation-system)
  - [Feedback Systems](#feedback-systems)
  - [Progression & Scrolling](#progression--scrolling)
  - [Aesthetic & Feel](#aesthetic--feel)
  - [Physics Tuning](#physics-tuning)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Message System](#message-system)
  - [Physics Details](#physics-details)
  - [Rendering](#rendering)
- [Admin Portal](#admin-portal)
  - [Accessing Admin](#accessing-admin-the-staircase)
  - [Calendar View](#calendar-view)
  - [Edit View](#edit-view-card-expansion)
  - [Preview Mode](#preview-mode)
  - [Confirmation](#confirmation-active-messages-only)
- [Message Management](#message-management)
  - [Scheduled vs Active Messages](#scheduled-vs-active-messages)
  - [Message Lifecycle](#message-lifecycle)
  - [GitHub Storage Structure](#github-storage-structure)
  - [Update Propagation](#update-propagation)
- [Development](#development)
  - [Design Principles](#design-principles)
  - [Key Files](#key-files)
  - [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Performance Targets](#performance-targets)
- [External Projects](#external-projects)

---

## What is Bounsight?

Bounsight is a game where **repetition via play helps a message "settle in."** The loop is meditative and affirmative without feeling like a lecture. It's a tiny stage for words wrapped in fun, simple gameplay—the medium we enjoy building.

### Core Loop

1. The mascot (ball with a face) falls under gravity
2. The player draws a Gelato (a springboard created by swiping or dragging)
3. The Gelato acts as a springboard
4. On contact, the mascot bounces and **speaks the next word** of the message
5. After the final word, the message repeats word-by-word on subsequent bounces

Height is a side effect; the message is the point.

---

## Quick Start

```bash
npm install
npm run web         # Start web dev (http://localhost:8082)
npm run ios         # Start iOS (requires Xcode)
npm run android     # Start Android (requires Android Studio)
```

**Admin Portal:** Open the app → Press 'a' key → Click admin button (top-right) to schedule messages and record audio

---

## How to Play

### Controls

**Create Gelato:**
- **Swipe:** Swipe in any direction to instantly create a straight Gelato
- **Draw:** Touch and drag to draw; preview follows finger, final Gelato is always straight

The Gelato has a maximum length—if your finger exceeds it, the start point slides to maintain the constraint.

### Core Mechanics

**The Ball (Mascot):**
- Falls continuously under gravity
- Bounces on contact with Gelatos (perpendicular to Gelato angle)
- Has immunity period after each bounce (prevents double-bouncing)
- Simple face with mouth animations that sync with speech

**Drawing Gelatos:**
- Preview appears while drawing to show placement
- Final Gelato is always straight (no curves)
- Gelato constraints tunable in config

**Bouncing:**
- **Direction:** Perpendicular to Gelato's angle (not always "up")
- **Strength:** Physics restitution + configurable spring boost
- **Immunity:** Period after bounce prevents multiple bounces
- **Gelato destruction:** Gelato disappears after use

**Wall Behavior:**
- Configurable as hard boundaries or wrap-around portals
- Top boundary: None (infinite upward scroll)
- Bottom boundary: Game over if ball falls off screen (depends on mode)

### Word Revelation System

**On Each Bounce:**
1. Ball collides with Gelato
2. Next word in sequence revealed
3. Word appears on screen with animation
4. Audio segment plays (timed to word boundaries)
5. Haptic feedback triggers
6. Visual effects sync with audio

**Audio Playback:**
- Uses audio player with precise seeking
- Plays word segment from start to end timestamp
- Authentic recorded voice (not synthesized)
- Optional voice transformation

**Sentence Breaks:**
- Special markers in word array
- Trigger gameplay events when encountered:
  - Play special sound
  - Award bonus points (if implemented)
  - Visual effects
  - Brief pause for dramatic effect
- Not displayed visually (invisible marker)

**Message Loop:**
- After final word revealed, message repeats from beginning
- Continuous gameplay with same message
- Height tracking continues through loops

### Feedback Systems

**Visual Feedback:**
- **Word display:** Word appears on screen with animation
- **Gelato preview:** Preview appears while drawing to show placement
- **Completed Gelato:** Completed gelato is visually distinct from preview
- **Ball trail:** Optional visual effects for ball movement (configurable)
- **Height counter:** Minimal number display (secondary to message)

**Haptic Feedback:**
- Haptic feedback provides tactile response for key events like gelato placement, bounces, and sentence breaks
- Different events trigger different haptic patterns to enhance game feel
- Web fallback uses platform-appropriate vibration

**Audio Feedback:**
- **Word speech:** Word audio plays from recording (primary feedback)
- Optional sound effects accompany key events like gelato placement and bounces
- Sounds sync with haptic feedback
- All sounds can be muted in settings

### Progression & Scrolling

**Upward Scrolling:**
- Camera follows ball when it rises
- Smooth interpolation
- Creates sense of vertical progress
- No downward scrolling (history stays below)

**Height Tracking:**
- Minimal counter shows maximum height reached
- Secondary to the message (not the main goal)
- Light visual treatment (small, unobtrusive)
- Resets on app restart (not persisted)

**No Traditional Scoring:**
- No points for bounces
- No combo multipliers
- No leaderboards
- Focus entirely on message repetition via play

### Aesthetic & Feel

**Visual Style:**
- Dark background with high contrast
- Minimal UI (no HUD clutter)
- Monospace typography
- Clean geometric shapes

**Mascot Design:**
- Simple circle with face
- Small mouth that opens when speaking
- Horizontal line eyes (minimal expression)
- No complex animations (subtle and restrained)

**Animation Philosophy:**
- High frame rate for smooth gameplay
- Smooth physics simulation
- Gentle fades for UI elements
- Spring-based animations for responsiveness
- No jarring transitions or effects

**Sound Design:**
- Recorded voice is focal point (not music)
- Minimal sound effects
- Non-intrusive by default
- All sounds can be muted in settings

### Physics Tuning

All values configurable in [src/config.js](src/config.js):

**Gravity & Motion:**
- `gravityY` - Downward acceleration
- `frictionAir` - Air resistance (drag)
- `restitution` - Bounciness factor
- `springBoost` - Additional velocity on bounce

**Gelato Properties:**
- `maxLength` - Maximum Gelato length
- `thickness` - Gelato stroke width
- `friction` - Surface friction

**Gameplay Timing:**
- `minBounceIntervalMs` - Immunity period between bounces
- `wordDisplayDuration` - How long word stays visible
- `fadeInDuration` / `fadeOutDuration` - Word animation timing

> **Note:** All timing and physics constants are configurable and exploratory. Game feel emerges through playtesting. System designed to be highly tweakable.


---

## Tech Stack

### Core Framework
- **Expo + React Native** - Single codebase for iOS, Android, Web
- **react-native-web** - True native apps with genuine native performance
- **Why:** Proper haptics, low-latency audio, unified codebase without web compromises

### Rendering
- **React Native Skia** - GPU-accelerated canvas rendering
- **Native:** `@shopify/react-native-skia`
- **Web:** CanvasKit WASM
- **Why:** Single rendering codebase = single source of truth. Draw once, looks identical everywhere.

### Physics
- **Matter.js** - 2D physics engine
- **Why:** Sweet spot between control and simplicity. Tweakable restitution, friction, gravity for micro-details of game feel. Lightweight enough for rapid iteration.

### Audio System
- **expo-audio** - Recording and playback (cross-platform)
- **Word timing:** Audio analysis for precise word boundaries
- **Speech-to-text:** Transcription service (transcription only)
- **Why:** Unified API eliminates need for multiple audio libraries. Low-latency with precise seeking for word segments.

### Haptics
- **expo-haptics** + Web Vibration API
- **Why:** Native haptic feedback crucial for game feel. Simple API with graceful web fallback.

### Message Storage
- **GitHub Repository** - `messages.json` + audio files
- **Why:** Zero setup, free hosting, built-in version control. GitHub API allows in-app updates. Global CDN for fast fetches. No separate backend infrastructure needed.

---

## Architecture

### Message System

#### Recording-First Approach

The core philosophy: **Audio is the source of truth**. Messages begin as recorded voice, not written text.

**Complete Workflow:**
1. **Record** - Admin speaks message in admin UI using device microphone
2. **Mark Sentence Breaks** - Optional: Mark sentence boundaries during recording for gameplay events
3. **Transcribe** - Audio uploaded to serverless function for processing
4. **Detect Word Boundaries** - Audio analysis finds precise word timing
5. **Extract Text** - Transcription service transcribes audio (text only, no timestamps)
6. **Align** - Matching of transcribed words to detected audio segments
7. **Transform Voice** - Optional: Convert to character voices
8. **Preview** - Test in actual gameplay before publishing
9. **Publish** - Upload audio + metadata to storage

#### Recording Workflow Details

**User Experience:**
1. Open admin portal → Navigate to date → Card expands
2. Press Record button
3. Button changes to Stop with live timer
4. Sentence break button appears (mark sentence boundaries during recording)
5. Speak message naturally with clear pauses between words
6. Press Stop → Review state with options to redo or complete
7. Press Complete → Transcription processing begins
8. Auto-navigate to Preview Mode when complete

**Sentence Break Markers:**
- Mark sentence boundaries during recording
- Stored as timestamps, inserted into word array as special marker
- Not displayed visually in gameplay
- Trigger special events (sounds, visual effects) between sentences

#### Word Timing Detection

**Hybrid Approach:** Audio analysis + transcription service

**Why This Works:**
- Audio analysis provides precise word boundaries
- Transcription service provides accurate text transcription
- Matching guarantees alignment
- No reliance on transcription timestamps (audio analysis is more accurate)

**Technical Process:**

1. **Audio Decoding**
   - Convert audio to raw PCM data
   - Normalize to mono at standard sample rate

2. **Energy Envelope Detection**
   - Analysis produces smooth "loudness curve"
   - Shows when speech occurs vs silence

3. **Speech Segment Detection**
   - Threshold-based detection finds speech regions
   - Distinguishes between noise floor and speech level
   - Merges very close segments, discards very short ones

4. **Speech-to-Text Transcription**
   - Sends audio to transcription API
   - Returns text only (no timestamps)
   - Audio analysis provides more accurate timing

5. **Word Alignment**
   - Tokenize transcription into words
   - Match words to segments
   - Validation: Word count must equal segment count
   - Error handling: If mismatch, ask user to re-record with clearer pauses

**Result:**
- Returns transcript text and word array
- Each word has precise start/end timestamps
- Sentence break markers included as special entries

**Tunable Parameters:**
- Audio sample rate
- Analysis window size and resolution
- Segment merging and filtering thresholds
- Noise/speech detection thresholds

All parameters are configurable in the serverless function for fine-tuning word boundary detection.

#### Voice Transformation (Optional)

**Voice Transformation:**
- Optional toggle in review state
- Sends audio to transformation service
- Converts voice to configured character voice
- Returns transformed audio
- Preview Mode plays transformed voice

**Why Optional:**
- Authentic voice from creator is default
- Transformation adds processing time
- Character voices provide consistent tone across messages
- Useful for privacy or aesthetic consistency

#### Audio Storage

**Repository Storage:**
- Audio files stored in dedicated directory
- Naming convention based on message content and date
- Compressed format for efficient storage and streaming

**Why Repository Storage:**
- Zero setup, free hosting
- Same API and authentication as messages.json
- Atomic deployment (audio + metadata in single commit)
- Version control for audio files
- Global CDN for fast fetches
- Good enough for 2-person project MVP

**Future Migration Path:**
- If repo size approaches 1GB, migrate to Cloudflare R2 or AWS S3
- Update `audioUrl` in messages.json to point to CDN
- No game code changes needed (just different URL)

#### Data Structure

**messages.json Schema:**
- `current` - Date string pointing to active message
- `messages` - Object keyed by date (YYYY-MM-DD format)
  - Each message contains:
    - `text` - Full message text (no sentence break markers)
    - `words` - Array including sentence break markers
    - `audioUrl` - Relative path to audio file
    - `wordTimings` - Array of objects with `word`, `start`, and `end` (milliseconds)

**Fields:**
- `text` - Full message text (no sentence break markers)
- `words` - Array including `"*"` markers for sentence breaks
- `audioUrl` - Relative path to audio file in repository
- `wordTimings` - Precise start/end timestamps

#### Client Playback (expo-audio)

**Loading:**
- Audio player loads from storage URL
- Uses expo-audio for cross-platform playback

**Playing Word Segments:**
- On each bounce, get current word index and timing
- Check for sentence break markers (special effects)
- Seek to word start timestamp and play
- Pause at word end timestamp
- Precise seeking ensures tight sync

**Why expo-audio:**
- Cross-platform: Identical API on web, iOS, Android
- Precise seeking for tight word sync
- Handles audio format natively on all platforms
- Modern hooks-based API
- Official Expo SDK package (actively maintained)

#### Read-Only Transcription

**Audio is Source of Truth:**
- Transcribed text displayed but not editable
- If transcription incorrect → Re-record
- Speech-to-text has high accuracy for clear speech
- Speaking more clearly usually fixes issues on retry
- Keeps implementation simple and reliable

**Future Enhancement (Low Priority):**
- Allow minor text corrections (e.g., fix typo "lovd" → "loved")
- Audio segment would still play original pronunciation
- Audio-text mismatch acceptable for small typos
- Word count must stay same (no add/remove words)

---

## Message Management

### Scheduled vs Active Messages

**Active Message:**
- The message currently playing in gameplay for all users
- Stored in `messages.json` with `"current": "YYYY-MM-DD"` pointer
- Updated immediately when admin presses "Send Now" (with confirmation)
- All users receive new message on next app launch

**Scheduled Messages:**
- Future messages stored in `messages.json` under specific dates
- Created by saving from admin portal (no confirmation required)
- Automatically promoted to active on scheduled date
- Promotion handled by client-side check on app launch

### Message Lifecycle

**Creating a Message:**
1. Admin opens calendar view → Taps future date card
2. Card expands → Record audio → Mark sentence breaks → Complete
3. Transcription processing → Auto-navigate to preview
4. Test in gameplay preview → Press "Save"
5. Message saved to `messages.json` for that date
6. GitHub API commits changes (atomic update)

**Scheduling Logic:**
- On app launch, client checks if scheduled message should become active
- If today's date has a scheduled message and current message is outdated, promote it
- Update local state and fetch new audio

**Immediate Publishing (Active Message):**
1. Admin edits today's message → Record → Preview
2. Press "Send Now" → Confirmation dialog appears
3. Admin confirms → Message updates immediately
4. `messages.json` updated with `current` pointer to today
5. Admin portal closes, returns to game
6. All users get new message on next launch

### GitHub Storage Structure

**Repository Layout:**
- `messages.json` - Message metadata + current pointer
- `message-audio/` - Audio files (named by content and date)

**messages.json Structure:**
- `current` - Date string (YYYY-MM-DD) pointing to active message
- `messages` - Object keyed by date, each containing:
  - `text` - Full message text
  - `words` - Array of words (including sentence break markers)
  - `audioUrl` - Relative path to audio file
  - `wordTimings` - Array of word timing objects

### Update Propagation

**How Updates Reach Users:**

1. **Admin Makes Change:**
   - Admin portal saves via GitHub API
   - Atomic commit updates messages.json + audio files (if needed)
   - Changes are version controlled

2. **Client Fetches Updates:**
   - On app launch, client fetches messages.json from storage
   - Parses JSON and extracts current message date
   - Loads corresponding audio file

3. **Caching Behavior:**
   - Browser automatically caches storage URLs
   - CDN provides fast delivery
   - Subsequent fetches use cached version if not stale

**Update Latency:**
- Admin saves → GitHub commit → Fast (seconds)
- Users fetch → GitHub serves file → Fast (CDN)
- Total propagation time: Very quick from save to user fetch

### Data Consistency

**GitHub API Integration:**
- Uses Personal Access Token (fine-grained, repo scope)
- Stored in app config (protected by staircase unlock)
- Token never exposed to regular users (admin-only)

**Conflict Handling:**
- Storage API requires version parameter for updates (prevents overwrites)
- Admin portal fetches latest version before saving
- If version mismatch, API returns conflict error
- Admin sees error, must refetch and try again (rare case)

**Atomic Updates:**
- messages.json and audio files updated in same commit
- No partial state where JSON points to missing audio
- Rollback via git revert if needed (version controlled)

### Client-Side Message Check

**On App Launch:**
- Client fetches messages.json from storage
- Checks if current message matches today's date
- If scheduled message exists for today and current is outdated, promotes it
- Loads corresponding audio file and starts game

**Scheduled Message Promotion:**
- No separate backend cron job (simplicity for MVP)
- Client checks on launch if today has scheduled message
- If yes, uses that message instead of `current` pointer
- Admin can manually update `current` pointer by publishing today's message

### Authentication & Authorization

**Admin Access Control:**
- No traditional login/password system
- Staircase pattern unlocks admin portal in current session
- Session expires after timeout or app close
- GitHub token embedded in app config (protected by staircase)

**Security Considerations:**
- Token has minimal scope (single repo, contents read/write)
- Token cannot access other repos or user data
- Staircase pattern prevents accidental activation
- Requires physical skill to execute (can't be scripted easily)

**User Access:**
- Regular users only fetch messages.json (read-only, public repo)
- No authentication required for gameplay
- Cannot modify messages or access admin portal without staircase

---

### Physics Details

**Entities:**
- **Mascot:** Dynamic circular body (restitution, frictionAir, mass)
- **Gelato:** Static body created from swipes (length-clamped, thickness-constrained)
- **Bounds:** Optional left/right walls or horizontal wrap

**Tunable Constants** (all in `src/config.js`):
- `gravityY`, `restitution`, `friction`, `frictionAir`
- Gelato: `maxLength`, `thickness`, `springBoost`
- Bounce: `minBounceIntervalMs` (debounce guard)
- Haptics strengths per event
- Audio ducking ratios

> **Note:** All constants are exploratory. Game feel emerges through playtesting. System designed to be expandable and highly tweakable.

### Rendering

**Single Renderer for All Platforms:**
- Uses React Native Skia for unified rendering
- Same rendering code runs identically on iOS, Android, and Web
- GPU-accelerated canvas rendering
- No platform-specific drawing code needed

---

## Admin Portal

### In-App Admin Architecture

Admin functionality lives directly in the game—no separate web portal. Message updates happen within the game itself (no context switching, no separate deployment).

### Accessing Admin: The Staircase

Authentication through gameplay: **Consecutive bounces where each bounce is progressively higher on screen AND each Gelato is progressively shorter.**

This approach:
- Uses existing game mechanics (no separate auth UI)
- Requires intentional skill (won't happen accidentally)
- Feels like discovering a secret
- Even if reverse-engineered, must be physically performed

### Calendar View

A scrollable timeline of messages organized by date.

**Features:**
- Scrollable timeline with snap-to-card behavior
- **Past messages**: Read-only for reference
- **Today's slot**: Marked as active (current live message)
- **Future slots**: Editable, schedulable
- **Card states**: Empty, populated, and past messages have distinct styling

**Navigation:**
- Scroll to browse timeline
- Today's card appears center on open
- Tap any editable card to enter edit mode

### Edit View (Card Expansion)

When tapping a card, it expands in place to become a full-screen editing interface.

**Features:**
- **Audio Recorder** - Record button with multiple states (idle, recording, review)
- **Sentence Break Markers** - Mark sentence boundaries during recording for gameplay events
- **Automatic Transcription** - On Complete, audio is sent for word boundary detection
- **Voice Transformation** - Optional toggle to transform voice (configurable)

**Workflow:**
1. Tap empty/existing card → Card expands to full screen
2. Press Record → Speak message → Press sentence breaks as needed → Stop
3. Review: Play audio back or redo if needed
4. Press Complete → Automatic transcription begins
5. Auto-navigate to Preview Mode when transcription completes

### Preview Mode

Experience the message in actual gameplay before publishing.

**Features:**
- **Full game simulation** - Ball bounces on Gelatos, reveals words with voice
- **Test interactions** - Verify timing, audio sync, sentence breaks work correctly
- **Preview button** - Appears at bottom when recording is ready
- **Back to edit** - Return to card to re-record if needed

**Publishing:**
- **Future dates** → "Save" button schedules message
- **Today's date** → "Send Now" button triggers confirmation dialog

### Confirmation (Active Messages Only)

Prevents accidental immediate updates to the live message.

**Flow:**
1. Admin presses "Send Now" in preview
2. Confirmation dialog appears
3. Options: Cancel (return to preview) or Confirm (update immediately)

### Message Updates

**For scheduled messages (future dates):**
- Saved to `messages.json` via GitHub API
- Automatically becomes active on scheduled date (client-side check)

**For active message (today):**
- Directly updates `messages.json` with `makeCurrent: true`
- All users receive new message on next app launch

### UI/UX Design

**Visual Style:**
- Dark background matching game aesthetic
- Card expansion with smooth animations
- Distinct styling for different card states
- Minimal chrome—focus on the content

**Animations:**
- Cards animate on entrance
- Selected card expands to full screen while others fade out
- Smooth high-frame-rate animations

### Components

- **[AdminPortal.jsx](src/screens/admin-portal/AdminPortal.jsx)** - Root component, manages view state
- **[CalendarView.jsx](src/screens/admin-portal/CalendarView.jsx)** - Scrollable timeline cards with expansion
- **[AudioRecorder.jsx](src/screens/admin-portal/AudioRecorder.jsx)** - Recording UI with multiple button states
- **[PreviewMode.jsx](src/screens/admin-portal/PreviewMode.jsx)** - Full game simulation for testing
- **[Confirmation.jsx](src/screens/admin-portal/Confirmation.jsx)** - Send Now confirmation dialog
- **[githubApi.js](src/shared/services/githubApi.js)** - GitHub API integration for message updates

---

## Development

### Development Principles

- **Vibe-code friendly:** Minimal tech stack, direct manipulation of physics constants, immediate visual feedback
- **Universal updates:** Server-side message updates deploy instantly to all platforms (no app store submissions for content)
- **Radical simplicity:** Every feature and line of code must justify its existence
- **Lightweight everything:** Small bundles, minimal dependencies, fast load times
- **Single source of truth:** One codebase, one physics engine, one set of constants
- **No bloat:** The game is about bouncing and hearing words. Everything else is secondary.

### Key Files

- **`src/config.js`** - All tunable constants (physics, colors, timing, audio)
- **`src/screens/gameplay/GameCore.js`** - Physics engine, state management, collision detection
- **`src/screens/gameplay/GameApp.jsx`** - Main game component
- **`src/screens/gameplay/GameRenderer.jsx`** - Skia canvas renderer (unified for all platforms)
- **`src/screens/gameplay/useGameLoop.js`** - Animation loop hook
- **`src/screens/admin-portal/AdminPortal.jsx`** - Admin interface
- **`src/shared/services/audioRecordingService.js`** - Audio recording wrapper
- **`src/shared/services/wordTimestampsService.js`** - API client for word boundary detection
- **`src/shared/utils/audio.js`** - Sound effects playback
- **`src/shared/utils/haptics.js`** - Vibration feedback

See [AGENTS.md](AGENTS.md) for AI agent coding guidelines.

### Coding Standards

- **JavaScript** (not TypeScript) - Simpler for rapid iteration
- **Functional components** with React hooks
- **Avoid React state in hot loops** - Use refs/imperative stores for performance
- **High frame rate** for smooth gameplay
- **Test on both web and mobile** when making rendering or physics changes

---

## Project Structure

```
/
├── src/
│   ├── screens/
│   │   ├── gameplay/     # Game components (GameCore, GameApp, GameRenderer)
│   │   └── admin-portal/ # Admin interface components
│   ├── shared/
│   │   ├── components/   # Reusable UI (Button, DebugMenu)
│   │   ├── services/     # External services (audio, STT, word timing, GitHub API)
│   │   ├── utils/        # Utilities (audio playback, haptics)
│   │   └── effects/      # Visual effects (ParallaxManager)
│   ├── assets/
│   │   └── sfx/          # Sound effects
│   └── config.js         # All tunable constants
├── api/                  # Vercel serverless functions
│   └── align.js          # Word boundary detection (audio analysis + transcription)
├── docs/                 # Design documentation
├── messages.json         # Message storage (fetched by clients)
├── message-audio/        # Audio recordings
├── AGENTS.md             # AI agent guidelines
└── README.md             # This file
```

---

## Documentation

- **[AGENTS.md](AGENTS.md)** - AI agent guidelines (commands, tech stack, patterns)
- **[docs/bounsight-dev-doc.md](docs/bounsight-dev-doc.md)** - Historical design document (see README for current state)
- **[docs/audio-recording-design.md](docs/audio-recording-design.md)** - Historical audio design document (see README for current state)
- **[docs/admin-portal-dev-doc.md](docs/admin-portal-dev-doc.md)** - Historical admin portal design document (see README for current state)

---

## Performance Targets

- **High frame rate** for smooth gameplay
- **Smooth, consistent experience** across all platforms
- **No visual differences** between web and mobile
- **Fast load times** with minimal bundle size
- **Low-latency audio** for tight word-bounce sync

---

## External Projects

- **`/api/align.js`** - Serverless function for word boundary detection
  - Audio envelope analysis for precise timing
  - Transcription service for text
  - Returns word timings + transcribed text
- **`/modules/expo-custom-haptics/`** - Custom Android haptics module (if needed for advanced patterns)

---

## Why These Choices?

**Expo + React Native:**
Yes, there's development overhead (Metro bundler quirks, longer build times), but it's worth it for genuine native performance and feel (proper haptics, low-latency audio). Single codebase without web compromises.

**React Native Skia:**
The web bundle cost (CanvasKit WASM) is worth the simplicity of a unified rendering codebase. No maintaining two drawing implementations.

**Matter.js:**
Lightweight physics engine worth not debugging custom physics edge cases. Gives us polish potential for great game feel while staying lightweight.

**GitHub Storage:**
Zero setup, free hosting, built-in version control. Eliminates need for separate backend infrastructure in MVP. Good enough for 2-person creative project.

**Recording-First Audio:**
Authentic voice quality from creator recordings. No AI generation costs. Personal touch from real human voice.

---

## License

Private project by two brothers. Not open source.
