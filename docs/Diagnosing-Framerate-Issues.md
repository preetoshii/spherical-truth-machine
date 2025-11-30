# Diagnosing Framerate Issues

This document tracks our investigation and testing of Android performance issues related to jittery framerate and stuttering.

## Problem Statement

**Symptom:** Game experiences slight jittery/stuttering on Android devices, not buttery smooth despite using React Native Skia for GPU rendering.

**Root Hypothesis:** React reconciliation happening every frame is causing overhead, preventing smooth 60fps performance.

## Architecture Context

- React Native + Expo
- React Native Skia for GPU rendering
- Matter.js for physics
- Game loop running at 60fps via `requestAnimationFrame`
- Physics updates at fixed 16.667ms timesteps

## Tested Solutions

### Test 1: Shared State Object Optimization
**Date:** 2025-01-XX
**Commit:** `f8afbff`

**What we tried:**
- Consolidated game state into single shared object (`gameState.current`)
- Mutated state directly in game loop (bypasses React state updates)
- Replaced individual refs with shared state object
- Only frame counter triggers minimal React state update

**Implementation:**
```javascript
// Shared game state - mutated directly
const gameState = useRef({
  mascotPos: { x, y },
  obstacles: [],
  // ... all game state
});

// Game loop updates state directly
state.mascotPos = gameCore.current.getMascotPosition();
// ... update all state

// Minimal React update - just frame number
setFrame(prev => prev + 1);
```

**Result:** ❌ **DID NOT SOLVE** - Jitter remains the same

**Analysis:**
- Reduced React reconciliation overhead (fewer props to compare)
- Still triggering React re-render every frame via `setFrame()`
- React still goes through reconciliation cycle every frame
- Canvas components still receive new props every frame

**Key Learning:** Even minimal React state updates trigger full reconciliation. Shared state mutation doesn't bypass React's render cycle.

---

### Test 2: Remove Word Overlay + Optimize Calculations
**Date:** 2025-01-XX

**What we tried:**
- Completely removed word overlay (React Native View)
- Cached `Date.now()` calls (from 7+ per frame to 1)
- Disabled star twinkle calculations
- Removed word opacity/offset calculations

**Implementation:**
- Commented out word overlay component
- Added `const currentTime = Date.now()` at start of render
- Replaced all `Date.now()` calls with cached `currentTime`
- Disabled twinkle effect calculations

**Result:** ❌ **DID NOT SOLVE** - Jitter exactly the same

**Analysis:**
- Word overlay was not the bottleneck
- Date.now() calls were not causing significant overhead
- Expensive calculations in render were not the issue

**Key Learning:** The jitter is not from:
- React Native View re-renders (word overlay)
- Multiple Date.now() calls
- Expensive calculations in render

The problem is more fundamental - likely React reconciliation itself.

---

## Current Understanding

**What we know works:**
- Physics engine (Matter.js) runs smoothly
- Game loop timing is correct (fixed timestep)
- Skia rendering itself should be performant

**What we know doesn't work:**
- Shared state mutation + minimal React updates still causes jitter
- Removing React Native Views doesn't help
- Optimizing calculations doesn't help

**Root Cause Hypothesis:**
The fundamental issue is that we're still in React's render cycle. Every frame:
1. `setFrame()` triggers React state update
2. React reconciles component tree
3. Props passed to Canvas components change
4. Skia components re-render through React

Even with shared state mutation, React still needs to reconcile the component tree every frame, which adds overhead.

## Next Steps / Proposed Solutions

### Option 1: Imperative Drawing with `useDrawCallback`
**Status:** Not yet tested

**Approach:**
- Use Skia's `useDrawCallback` for imperative drawing
- Read directly from refs, bypass React completely
- Canvas draws imperatively without React reconciliation

**Pros:**
- Completely bypasses React render cycle
- Direct GPU rendering
- True 60fps performance

**Cons:**
- Major refactor (convert all declarative Skia components to imperative drawing)
- More complex code (manual drawing vs declarative)
- Harder to maintain

**Implementation Complexity:** High (significant refactor)

---

### Option 2: React Native Reanimated Integration
**Status:** Not yet tested

**Approach:**
- Use Reanimated's `useSharedValue` for game state
- Update values on UI thread
- Canvas reads from shared values

**Pros:**
- Runs on UI thread (bypasses JS thread)
- Might integrate better with Skia

**Cons:**
- Another dependency
- May not solve React reconciliation issue

**Implementation Complexity:** Medium

---

### Option 3: Accept Current Performance
**Status:** Not yet tested

**Approach:**
- Investigate if jitter is actually acceptable
- Profile actual frame times vs perceived jitter
- May be device-specific

**Pros:**
- No code changes needed
- Current solution is simpler

**Cons:**
- Doesn't solve the problem

**Implementation Complexity:** None (investigation only)

---

## Testing Protocol

When testing performance optimizations:

1. **Baseline:** Measure current FPS and perceived smoothness
2. **Test Build:** Install APK on Android device
3. **Test Scenarios:**
   - Ball bouncing with gelato
   - Fast movement
   - Multiple bounces
   - Trail rendering
4. **Subjective Feedback:** Document perceived jitter level (1-10 scale)
5. **Objective Metrics:** Use FPS counter if available

## Code Locations

- **Game Loop:** `src/screens/gameplay/GameApp.jsx`
- **Renderer:** `src/screens/gameplay/GameRenderer.jsx`
- **Physics:** `src/screens/gameplay/GameCore.js`
- **Config:** `src/config.js`

## Related Issues

- React Native Skia performance on Android
- React reconciliation overhead in game loops
- Balancing React's declarative model with performance needs

## Notes

- Current implementation uses declarative Skia components (Circle, Path, Line, etc.)
- React still reconciles these components every frame
- Skia rendering is GPU-accelerated, but React overhead remains
- Declarative approach is easier to maintain but comes with performance cost

---

**Last Updated:** 2025-01-XX
**Status:** Investigating - Root cause identified as React reconciliation overhead
