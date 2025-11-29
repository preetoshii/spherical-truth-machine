# Bounsight

⚠️ This file is the single source of truth for AI agents. Edit this file, not CLAUDE.md or .cursorrules.

## Commands

```bash
npm run web              # Start web dev server (http://localhost:8081)
npm run ios              # Start iOS (requires Xcode)
npm run android          # Start Android (requires Android Studio)
```

**Admin portal:** Open http://localhost:8081 → Press 'a' key → Click admin button (top-right)

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

See [src/README.md](src/README.md) for detailed navigation.

**Key files:**
- `src/config.js` - All tunables (physics, colors, timing)
- `src/game/core/GameCore.js` - Physics engine
- `src/game/render/GameApp.jsx` - Main game
- `src/admin/AdminPortal.jsx` - Admin interface

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
import { Button } from '../components/Button';
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
