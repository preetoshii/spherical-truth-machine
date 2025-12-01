# RECAP - Coin Functionality Work in Progress

## Current Status
Working on coin functionality for the game. This is still a work in progress with several issues to address.

## What We've Built So Far

### Coin System
- Coins spawn after completing a message (as a "5th item" reward, without a word)
- Coin count cutscene displays after death (only if coins > 0)
- Radial progress bar component created to track universal progress across sessions
- Progress is stored in localStorage and persists across app restarts
- Coin deposit animation during cutscene (coins deplete from count and fill progress bar)

### Components
- `RadialProgressBar` component - shows progress with animated arc
- `SpinningCoin` component - reusable coin component with sine wave animation matching game coins
- Shared `Coin.jsx` component for consistent coin visuals

## Known Issues / Problems

1. **Arc progress bar doesn't increase** - The progress bar animation isn't working correctly during the coin deposit cutscene
2. **Visual polish needed** - The coin functionality doesn't look good yet, needs design refinement
3. **General polish** - Many aspects still need work and refinement

## Next Steps
- Fix the arc progress bar animation so it actually increases during coin deposits
- Polish the visual design of the coin system
- Address other issues as they come up

## Notes
- Coin cutscene is skipped if player collected 0 coins (to avoid demotivation)
- Death fade continues during coin cutscene (elements fade out properly)
- Progress bar only shows during cutscene (idle display removed for now)

