/**
 * ParallaxManager
 *
 * Manages multi-layer parallax scrolling starfield background.
 * Creates the illusion of infinite vertical climbing by moving stars
 * downward as the ball travels upward.
 *
 * Key features:
 * - Tracks cumulative upward movement only (ignores downward)
 * - Multiple parallax layers with different speeds for depth effect
 * - Dynamic star wrapping with random repositioning
 * - Performance-optimized with in-place updates
 */

export class ParallaxManager {
  /**
   * @param {number} width - Screen width
   * @param {number} height - Screen height
   * @param {object} config - Parallax configuration from config.js
   */
  constructor(width, height, config) {
    this.width = width;
    this.height = height;
    this.config = config;

    // Track cumulative upward distance traveled
    this.cumulativeUpwardDistance = 0;
    this.lastBallY = null;

    // Star layers (each layer has different parallax speed)
    this.layers = [];

    // Flattened array of all stars for efficient rendering
    this.allStars = [];

    if (this.config.enabled) {
      this.initializeLayers();
    }
  }

  /**
   * Initialize all parallax layers with randomly positioned stars
   */
  initializeLayers() {
    const { layers, wrapPadding, color, density = 1.0 } = this.config;

    layers.forEach((layerConfig, layerIndex) => {
      const stars = [];

      // Apply density multiplier to star count
      const actualStarCount = Math.round(layerConfig.starCount * density);

      // Generate stars for this layer
      for (let i = 0; i < actualStarCount; i++) {
        const star = this.createStar(layerConfig, layerIndex);
        stars.push(star);
        this.allStars.push(star);
      }

      this.layers.push({
        config: layerConfig,
        stars: stars,
      });
    });

    console.log(`ParallaxManager: Initialized ${this.allStars.length} stars across ${this.layers.length} layers (density: ${density}x)`);
  }

  /**
   * Create a single star with random properties
   * @param {object} layerConfig - Configuration for this layer
   * @param {number} layerIndex - Index of the layer (for debugging)
   * @returns {object} Star object
   */
  createStar(layerConfig, layerIndex) {
    const { sizeMin, sizeMax, speed } = layerConfig;
    const { color, wrapPadding, opacity: globalOpacity = 1.0 } = this.config;

    // Random initial Y position
    const initialY = Math.random() * (this.height + 2 * wrapPadding) - wrapPadding;

    return {
      // Random position across screen (including wrap padding above/below)
      x: Math.random() * this.width,
      y: initialY, // Start at initial position

      // Store initial Y for offset calculations
      initialY: initialY, // Preserve the random starting position

      // Random size within layer's range
      size: sizeMin + Math.random() * (sizeMax - sizeMin),

      // Visual properties
      color: color,
      opacity: globalOpacity, // Use global opacity directly (ignoring layer-specific opacity)

      // Parallax properties
      speed: speed,
      layerIndex: layerIndex,
      
      // Twinkle animation properties
      twinklePhase: Math.random() * Math.PI * 2, // Random phase offset (0 to 2π)
      twinkleSpeed: 0.8 + Math.random() * 0.4,   // Random speed variation (0.8x to 1.2x)
    };
  }

  /**
   * Update parallax based on ball's current Y position
   * Only accumulates when ball moves upward (y decreases)
   *
   * @param {number} ballY - Current Y position of the ball
   */
  update(ballY) {
    if (!this.config.enabled) return;

    // Track cumulative upward movement
    if (this.lastBallY !== null) {
      // In Matter.js, Y increases downward, so upward movement = ballY < lastBallY
      if (ballY < this.lastBallY) {
        const upwardDelta = this.lastBallY - ballY;
        this.cumulativeUpwardDistance += upwardDelta;
      }
    }

    this.lastBallY = ballY;

    // Update all star positions based on cumulative distance and layer speed
    this.updateStarPositions();
  }

  /**
   * Update positions of all stars based on cumulative upward distance
   * Handles wrapping when stars scroll off the bottom
   */
  updateStarPositions() {
    const { wrapPadding } = this.config;
    const wrapThreshold = this.height + wrapPadding;
    const wrapResetY = -wrapPadding;

    this.allStars.forEach(star => {
      // Calculate star's Y position based on cumulative distance and parallax speed
      // Stars move DOWN (positive Y) as ball climbs UP (negative Y)
      star.y = star.initialY + (this.cumulativeUpwardDistance * star.speed);

      // Wrap around when star scrolls off bottom
      if (star.y > wrapThreshold) {
        // Calculate how much to wrap (maintain continuity)
        const overflow = star.y - wrapThreshold;

        // Reset to top
        star.y = wrapResetY + overflow;

        // Update initial Y to maintain continuity
        star.initialY = star.y - (this.cumulativeUpwardDistance * star.speed);

        // Give star a new random X position
        star.x = Math.random() * this.width;

        // Optional: Randomize size again for variety
        const layerConfig = this.layers[star.layerIndex].config;
        star.size = layerConfig.sizeMin + Math.random() * (layerConfig.sizeMax - layerConfig.sizeMin);
        
        // Give star new random twinkle properties for variety
        star.twinklePhase = Math.random() * Math.PI * 2;
        star.twinkleSpeed = 0.8 + Math.random() * 0.4;
      }
    });
  }

  /**
   * Get all stars for rendering
   * @returns {Array} Array of star objects with x, y, size, color, opacity
   */
  getStars() {
    if (!this.config.enabled) return [];
    return this.allStars;
  }

  /**
   * Reset parallax state (useful for game restart)
   */
  reset() {
    this.cumulativeUpwardDistance = 0;
    this.lastBallY = null;

    // Reset all stars to initial positions
    this.allStars.forEach(star => {
      star.y = Math.random() * (this.height + 2 * this.config.wrapPadding) - this.config.wrapPadding;
      star.initialY = star.y;
      star.x = Math.random() * this.width;
    });
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      enabled: this.config.enabled,
      cumulativeUpwardDistance: this.cumulativeUpwardDistance.toFixed(2),
      totalStars: this.allStars.length,
      layers: this.layers.length,
    };
  }
}
