import { config } from '../../config';
import { logger } from '../utils/logger';

/**
 * Primary Color Manager - Universal color system for entire app
 * 
 * Manages primary color updates independently of game loop.
 * Uses ref-based storage for zero React overhead.
 * 
 * Modes:
 * - 'time': Continuous color transitions based on elapsed time
 * - 'bounce': Color changes on game events (bounces, message restarts)
 * - 'static': Fixed color, no updates
 */

// Ref-based storage (zero React overhead)
const colorState = {
  value: config.colors.mode === 'static' 
    ? config.colors.staticColor 
    : config.colors.palette[0],
};

// State for time mode
let colorUpdateLoop = null;
let currentColorIndex = 0;
let colorTransitionStart = Date.now();

// State for bounce mode
let bouncesSinceColorChange = 0;

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1, color2, progress) {
  const c1 = parseInt(color1.substring(1), 16);
  const c2 = parseInt(color2.substring(1), 16);
  
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  
  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Update color for time mode
 */
function updateTimeModeColor() {
  const currentTime = Date.now();
  const elapsed = currentTime - colorTransitionStart;
  const duration = config.colors.timeFadeDuration;
  
  if (elapsed >= duration) {
    // Move to next color
    currentColorIndex = (currentColorIndex + 1) % config.colors.palette.length;
    colorTransitionStart = currentTime;
  }
  
  // Interpolate between current and next color
  const progress = (elapsed % duration) / duration;
  const currentColor = config.colors.palette[currentColorIndex];
  const nextColor = config.colors.palette[(currentColorIndex + 1) % config.colors.palette.length];
  colorState.value = interpolateColor(currentColor, nextColor, progress);
}

/**
 * Start the color manager
 * Initializes update loop for time mode
 */
export function startColorManager() {
  // Initialize color based on mode
  if (config.colors.mode === 'static') {
    colorState.value = config.colors.staticColor;
    return; // No update loop needed
  }
  
  if (config.colors.mode === 'time') {
    // Start independent RAF loop for time mode
    colorState.value = config.colors.palette[0];
    currentColorIndex = 0;
    colorTransitionStart = Date.now();
    
    function updateLoop() {
      updateTimeModeColor();
      colorUpdateLoop = requestAnimationFrame(updateLoop);
    }
    
    colorUpdateLoop = requestAnimationFrame(updateLoop);
    logger.log('RENDERING', 'Color manager started (time mode)');
  } else if (config.colors.mode === 'bounce') {
    // Bounce mode: initialize to first color, updates via events
    colorState.value = config.colors.palette[0];
    currentColorIndex = 0;
    bouncesSinceColorChange = 0;
    logger.log('RENDERING', 'Color manager started (bounce mode)');
  }
}

/**
 * Stop the color manager
 * Cleans up update loop (useful for testing)
 */
export function stopColorManager() {
  if (colorUpdateLoop) {
    cancelAnimationFrame(colorUpdateLoop);
    colorUpdateLoop = null;
  }
}

/**
 * Get current primary color
 * Zero-overhead read from ref (no React reconciliation)
 */
export function getPrimaryColor() {
  return colorState.value;
}

/**
 * Notify that a bounce occurred (for bounce mode)
 */
export function notifyBounce() {
  if (config.colors.mode !== 'bounce') return;
  
  const bouncesPerChange = config.colors.bouncesPerColorChange;
  
  // Only change if bouncesPerColorChange is not 'quote' (quote mode changes on message restart)
  if (bouncesPerChange !== 'quote') {
    bouncesSinceColorChange++;
    
    // Check if enough bounces have occurred
    if (bouncesSinceColorChange >= bouncesPerChange) {
      currentColorIndex = (currentColorIndex + 1) % config.colors.palette.length;
      colorState.value = config.colors.palette[currentColorIndex];
      bouncesSinceColorChange = 0; // Reset counter
      logger.log('RENDERING', '🎨 Bounce - color changed to:', colorState.value, 'index:', currentColorIndex);
    }
  }
}

/**
 * Notify that message restarted (for bounce mode with 'quote' setting)
 */
export function notifyMessageRestart() {
  if (config.colors.mode === 'bounce' && config.colors.bouncesPerColorChange === 'quote') {
    currentColorIndex = (currentColorIndex + 1) % config.colors.palette.length;
    colorState.value = config.colors.palette[currentColorIndex];
    logger.log('RENDERING', '🎨 Quote complete - color changed to:', colorState.value, 'index:', currentColorIndex);
  }
}

