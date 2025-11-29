# Bounsight

⚠️ This file is the single source of truth for AI agents. Edit this file, not CLAUDE.md or .cursorrules.

## Commands

```bash
npm run web              # Start web dev server (http://localhost:8082)
npm run ios              # Start iOS (requires Xcode)
npm run android          # Start Android (requires Android Studio)
```

**Admin portal:** Open http://localhost:8082 → Press 'a' key → Click admin button (top-right)

## Development Principles

When making decisions, prioritize:
- **Radical simplicity:** Every feature and line of code must justify its existence
- **Lightweight everything:** Small bundles, minimal dependencies, fast load times
- **Single source of truth:** One codebase, one physics engine, one set of constants
- **No bloat:** The game is about bouncing and hearing words. Everything else is secondary.

**If a request or approach seems to conflict with these principles, ask the developer before proceeding.**

## Tech Stack

- React Native + Expo (cross-platform: web/iOS/Android)
- React Native Skia (GPU rendering)
- Matter.js (physics)
- expo-audio (recording & playback)
- JavaScript (not TypeScript)

## Audio System

**Recording & playback** use expo-audio:
```js
import { createAudioPlayer } from 'expo-audio';
const player = createAudioPlayer({ uri });
player.seekTo(seconds);
player.play();
```

**Word timing** comes from `/api/align.js` (Vercel function) using RMS envelope detection.

## Project Structure

**Key files:**
- `src/config.js` - All tunables (physics, colors, timing)
- `src/screens/gameplay/GameCore.js` - Physics engine
- `src/screens/gameplay/GameApp.jsx` - Main game
- `src/screens/admin-portal/AdminPortal.jsx` - Admin interface

## Code Style

Functional components:
```js
export function MyComponent() {
  const [state, setState] = useState(0);
  return <View>...</View>;
}
```

Use Button component for all interactive buttons:
```js
import { Button } from '../../shared/components/Button';
<Button onPress={() => {}}>
  <Text>Click me</Text>
</Button>
```

## Git

- Main branch: `master`
- Feature branches for new work

## Boundaries

- Don't commit secrets (.env files)
- Link to docs/ for design decisions, don't duplicate them here
- If developer can't find a file I mention, check `.vscode/settings.json` - some folders are hidden for cleaner UX
