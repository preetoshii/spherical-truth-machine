# Bounsight Source Code Structure

## Quick Start: Where to Look

### 🎮 Game Logic
- **Entry point**: [`game/render/GameApp.jsx`](game/render/GameApp.jsx) - Main game component
- **Physics engine**: [`game/core/GameCore.js`](game/core/GameCore.js) - Matter.js physics simulation
- **Rendering**: [`game/render/GameRenderer.jsx`](game/render/GameRenderer.jsx) - React Native Skia canvas
- **Game loop**: [`game/hooks/useGameLoop.js`](game/hooks/useGameLoop.js) - 60fps animation loop
- **Background**: [`game/parallax/ParallaxManager.js`](game/parallax/ParallaxManager.js) - Parallax starfield

### 👤 Admin Portal
- **Entry point**: [`admin/AdminPortal.jsx`](admin/AdminPortal.jsx) - Main admin interface
- **Calendar**: [`admin/CalendarView.jsx`](admin/CalendarView.jsx) - Message scheduling
- **Editor**: [`admin/TextEditor.jsx`](admin/TextEditor.jsx) - Message composition
- **Preview**: [`admin/PreviewMode.jsx`](admin/PreviewMode.jsx) - Test messages in gameplay
- **Audio**: [`admin/AudioRecorder.jsx`](admin/AudioRecorder.jsx) - Voice recording
- **API**: [`admin/githubApi.js`](admin/githubApi.js) - GitHub integration

### 🛠️ Services & Utilities
- **Audio recording**: [`services/audioRecordingService.js`](services/audioRecordingService.js) - expo-audio wrapper
- **Word timing**: [`services/wordTimestampsService.js`](services/wordTimestampsService.js) - API client for word boundaries
- **Speech-to-text**: [`services/googleSpeechService.js`](services/googleSpeechService.js) - Google Cloud STT
- **Audio utils**: [`utils/audio.js`](utils/audio.js) - Sound effects playback
- **Haptics**: [`utils/haptics.js`](utils/haptics.js) - Vibration feedback

### ⚙️ Configuration
- **Game config**: [`config.js`](config.js) - All tunable constants (physics, colors, sizes, etc.)

## Application Flow

```
index.js (entry)
  └── App.js (root component)
      └── GameApp.jsx (main game)
          ├── GameCore.js (physics)
          ├── GameRenderer.jsx (rendering)
          ├── ParallaxManager.js (background)
          └── AdminPortal.jsx (content management)
              ├── CalendarView.jsx
              ├── TextEditor.jsx
              ├── AudioRecorder.jsx
              └── PreviewMode.jsx
```

## Folder Structure

```
src/
├── admin/           # Admin portal (6 files) - Message management UI
├── components/      # Reusable UI (2 files) - Button, DebugMenu
├── game/            # Game logic
│   ├── core/        # Physics engine (GameCore.js)
│   ├── hooks/       # React hooks (useGameLoop.js)
│   ├── parallax/    # Background effects (ParallaxManager.js)
│   └── render/      # Rendering layer (GameApp.jsx, GameRenderer.jsx)
├── services/        # External services (4 files) - Audio, STT, word timing
├── sfx/             # Sound effects (9 .wav files)
├── utils/           # Utilities (3 files) - Audio, haptics, UI helpers
└── config.js        # App configuration
```

## Key Dependencies

- **expo** - Cross-platform framework (web/iOS/Android)
- **react-native-skia** - GPU-accelerated canvas rendering
- **matter-js** - 2D physics engine
- **expo-audio** - Recording and playback
- **expo-haptics** - Vibration feedback
- **react-native-reanimated** - 60fps animations

## Build Folders (Hidden in VSCode)

These folders exist but are hidden from file explorer:
- `node_modules/` - Dependencies (4.7GB)
- `dist/` - Web build output
- `.expo/` - Expo build cache
- `android/` - Native Android project
- `ios/` - Native iOS project

See [`.vscode/settings.json`](../.vscode/settings.json) for full list.

## External Projects

- **`/api`** - Vercel serverless functions (separate Node.js project)
  - `/api/align.js` - Word boundary detection API (RMS envelope + Google STT)
- **`/modules/expo-custom-haptics`** - Custom Android haptics module
