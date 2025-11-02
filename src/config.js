/**
 * Bounsight - Game Configuration
 * All tunable constants in one place for easy vibe-coding.
 * Values are TBD and exploratory - will emerge through playtesting.
 */

export const config = {
  // === AUDIO SYNC ===
  audio: {
    // Trim this many milliseconds from the start of each word slice
    // Google's timestamps may include leading silence/breath sounds
    // Increase if audio plays too early, decrease if too late
    trimStartMs: 120, // Try values between 50-150ms
  },

  // === PHYSICS ===
  physics: {
    gravityY: 1.0,            // Gravity strength (0.5 = floaty, 2.0 = heavy)

    // Mascot (ball) physics properties
    mascot: {
      radius: 30,             // Ball radius in pixels
      restitution: 0.6,       // Bounciness on collision with walls (0 = no bounce, 1 = perfect bounce)
      friction: 0.01,         // Surface friction when sliding (0 = frictionless, 1 = sticky)
      frictionAir: 0.005,     // Air resistance affecting terminal velocity (lower = falls faster)
      mass: 1,                // Mass affects force calculations (default: 1)
      
      // Squash/stretch deformation on bounce
      squashStretch: {
        enabled: true,        // Enable/disable bounce deformation
        amount: 0.30,         // Deformation intensity (0.0-0.5, higher = more stretch)
        holdTimeMs: 100,      // Time to hold stretched shape before relaxing (ms)
        decayTimeMs: 300,     // Time to decay back to circle after hold (ms)
      },
      
      // Motion trail effect
      trail: {
        enabled: true,        // Enable/disable trail effect
        fadeOutMs: 1000,       // How long trail takes to fade out (milliseconds)
        sampleInterval: 16,   // Add trail point every N milliseconds (16ms = ~60fps sampling)
        maxPoints: 30,        // Maximum trail points to keep (prevents infinite growth)
        activeAfterBounceMs: 10,  // Trail visible for X ms after hitting gelato (0 = always on)
        endFadeDurationMs: 1800,     // Duration of fade-out when trail expires (0 = instant disappear)
        maxOpacity: 0.1,      // Maximum trail opacity (0.0 = invisible, 1.0 = solid)
        gradientLayers: 1,    // Number of overlapping layers for gradient effect (more = smoother fade)
      },
    },

    // Entrance animation (ball dropping from top)
    entrance: {
      delayMs: 1000,          // Delay before entrance animation starts (in milliseconds)
      durationMs: 800,        // Duration of entrance animation (in milliseconds)
    },

    // Idle floating animation (before game starts)
    idleFloat: {
      amplitude: 8,           // Vertical movement range in pixels (up/down from center)
      speed: 0.5,             // Cycles per second (lower = slower, more meditative)
    },

    // Velocity limits (safety valve to prevent extreme speeds)
    maxVelocityX: 30,         // Maximum horizontal velocity in pixels/frame
    maxVelocityY: 50,         // Maximum vertical velocity in pixels/frame
  },

  // === DIFFICULTY PROGRESSION ===
  difficulty: {
    enabled: true,            // Toggle difficulty ramping on/off

    // Time dilation approach: Scale physics simulation speed
    // Instead of changing individual physics parameters, we make time pass faster
    // This creates a natural "fast-forward" effect where everything speeds up proportionally
    //
    // Implementation: Multiply delta time passed to Matter.Engine.update()
    //   - All physics (gravity, velocity, collisions) speed up together
    //   - Bounce heights, trajectories, everything stays proportional
    //   - Pure speed increase without changing game feel
    speed: {
      start: 1,            // Starting time multiplier (1.0 = normal time)
      end: 2.0,              // Ending time multiplier (2.0 = 2x speed, like fast-forward)
      bouncesUntilMax: 60,   // Number of bounces to reach maximum difficulty
    },

    // Example progression:
    //   Bounce 0:  timeScale = 1.0  →  normal speed
    //   Bounce 10: timeScale = 1.33 →  33% faster
    //   Bounce 20: timeScale = 1.67 →  67% faster
    //   Bounce 30+: timeScale = 2.0  →  2x speed (everything runs at double speed)
  },

  // === GELATO (SPRINGBOARDS) ===
  gelato: {
    maxLength: 275,           // Maximum line length in pixels (enforced during drawing)
    thickness: 4,             // Visual line thickness in pixels
    springBoost: 1.25,        // Trampoline bounce multiplier (1.0 = normal physics, 1.25 = 125% bounce back)
    maxActiveGelatos: 1,      // How many Gelatos can exist simultaneously (currently: 1)
    color: '#FFFFFF',         // Line color (hex or rgba)
    
    // Visual rendering mode
    renderMode: 'curved',     // 'curved' = honor drawn shape (with blend), 'straight' = simple A→B line
    curveBlend: .5,          // How much to honor drawn shape (0.0 = straight line, 1.0 = exact drawing, 0.5 = 50/50)
    collisionShape: 'path',   // 'line' = straight A→B physics, 'path' = curved physics matching blended visual

    // Visual deformation (trampoline effect on bounce)
    deformation: {
      maxBendAmount: 20,      // Maximum bend distance in pixels (higher = more dramatic wobble)
      duration: 400,          // Total animation duration in milliseconds
      frequency: 3,           // Oscillation speed (higher = faster/snappier, lower = slower/gooier)
      damping: 0.6,           // Spring damping coefficient (0 = no decay, 1 = heavy decay, uses exponential)
    },

    // Creation animation (pop-in effect when Gelato spawns)
    creation: {
      maxBendAmount: 15,      // Maximum bend in pixels when appearing (from center of line)
      duration: 300,          // How long the pop-in animation lasts in milliseconds
      frequency: 2,           // Oscillation speed (higher = faster wobble, lower = slower/gooier)
      damping: 0.5,           // Spring damping coefficient (lower = more bouncy, higher = settles faster)
    },

    // Destruction animation (fade-out on bounce)
    fadeOutDuration: 500,     // How long Gelato takes to fade out after bounce in milliseconds
    
    // Morphing animation (drawn path → straight line transition)
    morphing: {
      enabled: true,          // Enable/disable shape morphing animation
      duration: 400,          // Animation duration in milliseconds (quick/snappy)
      frequency: 2.5,         // Oscillation frequency (higher = more bouncy)
      damping: 0.6,           // Spring damping (how quickly it settles)
    },
  },

  // === BOUNCING ===
  bounce: {
    minIntervalMs: 100,       // Debounce timer in milliseconds to prevent double-bouncing on same Gelato
  },

  // === WALLS (Screen Boundaries) ===
  walls: {
    behavior: 'bounce',       // Boundary behavior: 'bounce' (reflect) or 'wrap' (teleport to other side)
    restitution: 1.2,         // Wall bounciness (0 = absorbs all energy, 0.5 = loses half, 1 = perfect bounce)
    thickness: 5,             // Thickness of boundary walls in pixels (affects physics collision edge)
    visible: false,           // Whether to render walls visually (false = invisible boundaries at screen edges)
  },

  // === HAPTICS (Mobile vibration feedback) ===
  // Platform-specific haptic feedback configuration
  //
  // Android: Custom expo-custom-haptics module using VibrationEffect.createOneShot()
  //   - durationMs: any positive number (e.g. 1-1000ms)
  //   - amplitude: 1-255 (1 = softest, 255 = strongest)
  //
  // iOS: expo-haptics with preset impact styles
  //   - style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'
  //   - iOS ignores Android settings, uses native haptic engine
  haptics: {
    gelatoCreation: {
      android: { durationMs: 0, amplitude: 0},   // Quick subtle tick
      ios: 'light',                                  // Light impact
    },
    gelatoBounce: {
      android: { durationMs: 5, amplitude: 40 },   // Very subtle for frequent bounces
      ios: 'soft',                                   // Soft impact
    },
    wallBump: {
      android: { durationMs: 0, amplitude: 0 },   // Medium subtle tick
      ios: 'light',                                  // Light impact
    },
    loss: {
      android: { durationMs: 50, amplitude: 100 },  // Longer, stronger for emphasis
    },

    // Drawing haptics (pencil-on-paper effect while dragging)
    drawing: {
      enabled: true,                                 // Enable/disable drawing haptics
      android: { durationMs: 1, amplitude: 20 },   // Ultra-subtle quick tick
      ios: 'soft',                                   // Soft impact
      pixelsPerTick: 20,                             // Distance between haptic ticks
      minIntervalMs: 50,                             // Minimum time between ticks (prevents overlap)
    },
  },

  // === AUDIO (Not yet implemented) ===
  audio: {
    voiceVolume: 1.0,         // Voice playback volume for word narration (0 = mute, 1 = full)
    sfxVolume: 0.3,           // Sound effects volume for bounces (0 = mute, 1 = full)
    duckingSfx: true,         // Whether to lower SFX volume when voice plays
  },

  // === PARALLAX STARFIELD ===
  // Multi-layer scrolling background that creates illusion of climbing through space
  // Stars move downward as ball travels upward (cumulative upward distance only)
  parallax: {
    enabled: false,                // Toggle parallax background on/off
    density: 0.5,                 // Density multiplier (0.5 = half as many stars, 1.0 = default, 2.0 = double)
    opacity: 0.5,                 // Global opacity multiplier (0.3 = subtle, 0.5 = half brightness, 1.0 = full)

    // Multiple layers for depth effect (back to front)
    // Each layer moves at different speed relative to ball's upward movement
    // Base star counts will be multiplied by density setting above
    // All layers use the same opacity (set globally above)
    layers: [
      // Background layer - slow, small (distant stars)
      {
        speed: 0.15,              // 15% of ball's upward speed (slow parallax)
        starCount: 20,            // Base number of stars (multiplied by density)
        sizeMin: 1,               // Minimum star radius in pixels
        sizeMax: 1.5,             // Maximum star radius in pixels
      },
      // Middle layer - medium speed
      {
        speed: 0.4,               // 40% of ball's upward speed
        starCount: 30,            // Base number of stars (multiplied by density)
        sizeMin: 1.5,
        sizeMax: 2.5,
      },
      // Foreground layer - fast, large (close stars)
      {
        speed: 0.8,               // 80% of ball's upward speed (fast parallax)
        starCount: 25,            // Base number of stars (multiplied by density)
        sizeMin: 2.5,
        sizeMax: 4,
      },
    ],

    wrapPadding: 150,             // Extra space above/below screen for smooth wrapping (pixels)
    color: '#FFFFFF',             // Star color (white)
    
    // Star shape configuration
    starShape: 'plus',            // Shape: 'plus' (4-pointed cross) or 'diamond' (4-pointed diamond)
    armThickness: 0.25,           // Thickness of star arms relative to size (0.25 = 25% of size)
    
    // Twinkle animation (subtle opacity pulsing)
    twinkle: {
      enabled: true,              // Enable/disable twinkling animation
      speed: 1.0,                 // Speed multiplier (1.0 = default, 2.0 = twice as fast, 0.5 = half speed)
      intensity: .8,             // Opacity variation (0.3 = ±30% opacity change, 0.5 = ±50%)
    },
  },

  // === VISUALS ===
  visuals: {
    backgroundColor: '#000000',   // Canvas background color (pure black)
    wordColor: '#FFFFFF',         // Text color for revealed words
    wordFontSize: 145,            // Font size for revealed words in pixels

    // Word fade mode: controls how words fade in/out after bounce
    // - 'velocity': Text opacity syncs 1:1 with ball's velocity change (physics-based, organic feel)
    //               Fades as ball rises and falls after bounce, tied to motion
    // - 'static': Traditional time-based fade with three configurable phases (fade-in, persist, fade-out)
    wordFadeMode: 'velocity',

    // Static fade timing (only used when wordFadeMode = 'static')
    // Creates a three-phase animation: fade-in → persist at full opacity → fade-out
    wordFadeInMs: 0,              // Phase 1: Fade-in duration from 0% → 100% opacity (0 = instant appearance)
    wordPersistMs: 800,           // Phase 2: How long word stays at 100% opacity before fading out
    wordFadeOutMs: 1500,          // Phase 3: Fade-out duration from 100% → 0% opacity
  },

  // === COLOR SYSTEM ===
  // Monochromatic design: single primary color used throughout (ball, trail, gelato, UI, text)
  colors: {
    mode: 'bounce',          // 'static' = fixed color, 'bounce' = change per bounce, 'time' = gradual fade
    
    // Color palette (used when mode is 'bounce' or 'time')
    palette: [
      '#4ECDC4',  // Cyan
      '#FF6B6B',  // Red
      '#A8E6CF',  // Mint
      '#FF8B94',  // Pink
      '#95E1D3',  // Aqua
      '#F3A683',  // Orange
      '#786FA6',  // Purple
    ],
    
    // Static mode: use this single color
    staticColor: '#FFFFFF',
    
    // Bounce mode: control when color changes
    // - Number (e.g., 1, 2, 5): Change every N bounces (1 = every bounce, 2 = every other bounce)
    // - 'quote': Change only when message/quote completes and restarts
    bouncesPerColorChange: 'quote',
    
    // Time mode: how long to transition between colors (ms)
    timeFadeDuration: 5000,
  },

  // === DRAWING ===
  drawing: {
    approach: 'continuous',       // Drawing method: 'continuous' (smooth path) or 'segmented' (snap to grid)

    // For segmented approach (not currently used)
    segmentTriggerDistance: 10,   // Distance in pixels finger must move before creating new segment

    // Preview visual (dotted line while drawing)
    previewColor: 'rgba(255, 255, 255, 0.5)',  // Preview line color with transparency
    previewThickness: 2,          // Preview line thickness in pixels (not currently used, uses gelato.thickness)
  },

  // === PERFORMANCE ===
  performance: {
    defaultFpsCap: null,          // Default FPS cap for components without their own FPS UI (null = uncapped, or 30/60/etc)
    showFps: false,               // Show FPS counter in corner (false = hidden by default)
  },

  // === VOICE TRANSFORMATION ===
  voiceTransform: {
    enabled: true,                          // Default state for toggle in AudioRecorder
    modelId: 'eleven_multilingual_sts_v2',  // ElevenLabs model
    
    // Two voices - both are transformed when enabled
    voices: [
      {
        id: 'q6bhPxtykZeN8o4aUNuh',
        name: 'Reboundhi',
        default: true,  // Default voice in preview
      },
      {
        id: 'UyE5iFj5Rg2T7GorYAnJ',
        name: 'Reboundhita',
        default: false,
      },
    ],
  },
};
