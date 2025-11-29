import Matter from 'matter-js';
import { config } from '../../config';
import { playSound } from '../../shared/utils/audio';
import { createAudioPlayer } from 'expo-audio';
import { ParallaxManager } from '../../shared/effects/ParallaxManager';

/**
 * GameCore - Physics engine using Matter.js
 * Handles all physics simulation, collision detection, and game state
 */
export class GameCore {
  constructor(width, height, customMessage = null, audioUri = null, wordTimings = null, wordAudioSegments = null, responsiveConfig = null) {
    // Create Matter.js engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Set gravity from config
    this.engine.gravity.y = config.physics.gravityY;

    // Store dimensions
    this.width = width;
    this.height = height;
    
    // Store responsive config (if provided, overrides static config values)
    this.mascotRadius = responsiveConfig?.mascotRadius || config.physics.mascot.radius;
    this.gelatoMaxLength = responsiveConfig?.gelatoMaxLength || config.gelato.maxLength;

    // Store custom message for preview mode
    this.customMessage = customMessage;

    // Store audio data for voice playback
    this.audioUri = audioUri;
    this.wordTimings = wordTimings;
    this.wordAudioSegments = wordAudioSegments; // Keep for compatibility but won't use
    this.audioPlayer = null; // expo-audio player for full recording

    // Create expo-audio player for full recording if available
    if (audioUri && wordTimings && wordTimings.length > 0) {
      try {
        this.audioPlayer = createAudioPlayer({ uri: audioUri });
        console.log('Expo-audio player created for full recording');
      } catch (error) {
        console.error('Failed to create audio player:', error);
      }
    }

    // Store target position for entrance animation
    this.mascotTargetY = height * 0.25; // 25% from top = 75% near top

    // Create mascot (starts above screen for entrance animation)
    this.mascot = Matter.Bodies.circle(
      width / 2,
      -this.mascotRadius * 2, // Start above screen
      this.mascotRadius,
      {
        restitution: config.physics.mascot.restitution,
        friction: config.physics.mascot.friction,
        frictionAir: config.physics.mascot.frictionAir,
        mass: config.physics.mascot.mass,
        label: 'mascot',
        // Always dynamic, we'll control gravity manually
      }
    );

    Matter.World.add(this.world, this.mascot);

    // Track entrance animation
    this.entranceStartTime = Date.now();
    this.entranceComplete = false;

    // Track idle float animation timing
    this.idleFloatStartTime = null; // Will be set when entrance completes

    // Track whether game has started
    this.gameStarted = false;

    // Track loss state
    this.hasLost = false;

    // Track bounce count for difficulty progression
    this.bounceCount = 0;

    // Store current time scale for difficulty (time dilation approach)
    this.timeScale = 1.0;

    // Initialize parallax background manager
    this.parallaxManager = new ParallaxManager(width, height, config.parallax);

    // Create boundary walls using config
    const wallThickness = config.walls.thickness;
    const halfThickness = wallThickness / 2;

    // Side walls only (no bottom boundary - ball can fall off)
    const leftWall = Matter.Bodies.rectangle(
      halfThickness,
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
        label: 'wall',
        restitution: config.walls.restitution,
      }
    );

    const rightWall = Matter.Bodies.rectangle(
      width - halfThickness,
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
        label: 'wall',
        restitution: config.walls.restitution,
      }
    );

    Matter.World.add(this.world, [leftWall, rightWall]);

    // Store obstacles for rendering
    this.obstacles = [leftWall, rightWall];

    // Track Gelatos (player-drawn springboards)
    this.gelato = null; // Only one Gelato at a time (maxActiveGelatos = 1)
    this.gelatoLineData = null; // Store start/end points for rendering

    // Track last bounce time for debouncing
    this.lastBounceTime = 0;

    // Track bounce impact for visual deformation
    this.bounceImpact = null; // { x, y, strength, timestamp }

    // Track creation time for pop-in animation
    this.gelatoCreationTime = null;
    
    // Motion trail tracking
    this.trail = []; // Array of { x, y, timestamp }
    this.lastTrailTime = 0;
    this.lastBounceForTrail = 0; // Timestamp of last gelato bounce (for trail activation)

    // Particle system (wall bounce dust clouds)
    this.particles = []; // Array of { x, y, vx, vy, size, opacity, timestamp }

    // Color system
    this.currentColorIndex = 0;
    this.primaryColor = config.colors.mode === 'static' 
      ? config.colors.staticColor 
      : config.colors.palette[0];
    this.colorTransitionStart = Date.now();
    this.bouncesSinceColorChange = 0; // Track bounces for color change timing

    // Message system (Milestone 3)
    // Use custom message if provided (for preview mode), otherwise use default
    if (wordTimings && wordTimings.length > 0) {
      // Use words from transcription (with exact timing alignment)
      // Strip punctuation from displayed words
      this.message = wordTimings.map(t =>
        t.word.toLowerCase().replace(/[.,!?;:'"]/g, '')
      );
      console.log('Using transcribed words for message:', this.message);
    } else if (customMessage) {
      // Fall back to splitting custom message text
      this.message = customMessage.toLowerCase().split(/\s+/);
    } else {
      // Default fallback message (will be replaced by loaded message from GitHub)
      this.message = [
        "you", "are", "loved", "beyond", "measure",
        "and", "nothing", "can", "change", "that"
      ];
    }
    this.wordIndex = 0; // Current word in message
    this.currentWord = null; // Currently displayed word { text, timestamp }

    // Load current message from messages.json if not in preview mode
    // Preview mode is detected by presence of wordTimings or wordAudioSegments
    const isPreviewMode = wordTimings || wordAudioSegments || customMessage;

    if (!isPreviewMode) {
      this.messageLoadPromise = this.loadCurrentMessage();
    } else {
      // Preview mode - message is already set, resolve immediately
      this.messageLoadPromise = Promise.resolve();
    }

    // Set up collision event handler
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      this.handleCollision(event);
    });
  }

  /**
   * Update physics simulation
   * Call this every frame with delta time
   */
  step(deltaMs) {
    // Disable gravity before game starts (manual position control)
    if (!this.gameStarted) {
      Matter.Body.setVelocity(this.mascot, { x: 0, y: 0 });
    }

    // Check for loss (ball fell below screen)
    if (this.gameStarted && !this.hasLost && this.mascot.position.y > this.height + this.mascotRadius * 2) {
      this.handleLoss();
      return; // Skip physics update on loss frame
    }

    // Handle entrance animation (with delay)
    if (!this.entranceComplete) {
      const elapsed = Date.now() - this.entranceStartTime;
      const delayMs = config.physics.entrance.delayMs;
      const durationMs = config.physics.entrance.durationMs;

      // Wait for delay before starting animation
      if (elapsed < delayMs) {
        // Still waiting, keep ball above screen
        return;
      }

      // Calculate progress after delay
      const animationElapsed = elapsed - delayMs;
      const progress = Math.min(animationElapsed / durationMs, 1);

      // Ease-out cubic easing for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const startY = -this.mascotRadius * 2;
      const newY = startY + (this.mascotTargetY - startY) * easeProgress;

      Matter.Body.setPosition(this.mascot, {
        x: this.mascot.position.x,
        y: newY,
      });

      if (progress >= 1) {
        this.entranceComplete = true;
        // Start idle float timing from now to ensure smooth transition
        this.idleFloatStartTime = Date.now();
      }
    }
    // Handle floating animation when stationary (before game starts)
    else if (!this.gameStarted) {
      // Use time relative to when idle float started
      const time = (Date.now() - this.idleFloatStartTime) / 1000; // Convert to seconds

      // Sine wave for smooth up/down motion using config values
      const offset = Math.sin(time * config.physics.idleFloat.speed * Math.PI * 2) * config.physics.idleFloat.amplitude;

      Matter.Body.setPosition(this.mascot, {
        x: this.mascot.position.x,
        y: this.mascotTargetY + offset,
      });
    }

    // Apply time scale for difficulty progression (makes physics run faster)
    const scaledDelta = deltaMs * this.timeScale;
    Matter.Engine.update(this.engine, scaledDelta);

    // Update parallax background based on ball's Y position
    this.parallaxManager.update(this.mascot.position.y);

    // Update particles
    this.updateParticles(deltaMs);

    // Update color if mode is 'time' (gradual fade)
    if (config.colors.mode === 'time') {
      const currentTime = Date.now();
      const elapsed = currentTime - this.colorTransitionStart;
      const duration = config.colors.timeFadeDuration;
      
      if (elapsed >= duration) {
        // Move to next color
        this.currentColorIndex = (this.currentColorIndex + 1) % config.colors.palette.length;
        this.colorTransitionStart = currentTime;
      }
      
      // Interpolate between current and next color
      const progress = (elapsed % duration) / duration;
      const currentColor = config.colors.palette[this.currentColorIndex];
      const nextColor = config.colors.palette[(this.currentColorIndex + 1) % config.colors.palette.length];
      this.primaryColor = this.interpolateColor(currentColor, nextColor, progress);
    }
    
    // Update motion trail
    if (config.physics.mascot.trail.enabled && this.gameStarted) {
      const currentTime = Date.now();
      const activeAfterBounceMs = config.physics.mascot.trail.activeAfterBounceMs;
      const endFadeDurationMs = config.physics.mascot.trail.endFadeDurationMs;
      
      const timeSinceBounce = currentTime - this.lastBounceForTrail;
      
      // Check if trail should be completely removed (past active + fade windows)
      const isFullyExpired = activeAfterBounceMs > 0 && 
                            (timeSinceBounce > activeAfterBounceMs + endFadeDurationMs);
      
      if (isFullyExpired) {
        // Trail has completely faded - clear it
        this.trail = [];
      } else {
        // Trail is visible (either active or fading) - ALWAYS sample to follow ball
        if (currentTime - this.lastTrailTime >= config.physics.mascot.trail.sampleInterval) {
          this.trail.push({
            x: this.mascot.position.x,
            y: this.mascot.position.y,
            timestamp: currentTime,
          });
          this.lastTrailTime = currentTime;
          
          // Limit trail length
          if (this.trail.length > config.physics.mascot.trail.maxPoints) {
            this.trail.shift();
          }
        }
        
        // Remove old trail points that have fully faded
        const fadeOutMs = config.physics.mascot.trail.fadeOutMs;
        this.trail = this.trail.filter(point => 
          currentTime - point.timestamp < fadeOutMs
        );
      }
    }

    // Apply velocity capping (safety valve) - scale caps with time dilation
    const velocity = this.mascot.velocity;
    const maxVelX = config.physics.maxVelocityX * this.timeScale;
    const maxVelY = config.physics.maxVelocityY * this.timeScale;

    if (Math.abs(velocity.x) > maxVelX) {
      Matter.Body.setVelocity(this.mascot, {
        x: Math.sign(velocity.x) * maxVelX,
        y: velocity.y,
      });
    }
    if (Math.abs(velocity.y) > maxVelY) {
      Matter.Body.setVelocity(this.mascot, {
        x: velocity.x,
        y: Math.sign(velocity.y) * maxVelY,
      });
    }

    // Clean up Gelato after fade completes
    if (this.bounceImpact && this.bounceImpact.timestamp) {
      const timeSinceBounce = Date.now() - this.bounceImpact.timestamp;
      if (timeSinceBounce >= config.gelato.fadeOutDuration) {
        // Fade is complete - remove Gelato data
        if (this.gelato) {
          Matter.World.remove(this.world, this.gelato);
          this.gelato = null;
        }
        this.gelatoLineData = null;
        this.bounceImpact = null;
      }
    }
  }

  /**
   * Update difficulty based on bounce count
   * Uses time dilation approach: makes physics simulation run faster
   * This creates a natural "fast-forward" effect where everything speeds up proportionally
   */
  updateDifficulty() {
    if (!config.difficulty.enabled) {
      return;
    }

    const { start, end, bouncesUntilMax } = config.difficulty.speed;

    // Calculate current time scale (linear interpolation)
    const progress = Math.min(this.bounceCount / bouncesUntilMax, 1);
    this.timeScale = start + (end - start) * progress;

    // Log difficulty changes for debugging
    console.log(`Bounce ${this.bounceCount}: timeScale = ${this.timeScale.toFixed(2)}x (${(this.timeScale * 100).toFixed(0)}% speed)`);
  }

  /**
   * Handle loss (ball fell off screen)
   */
  handleLoss() {
    this.hasLost = true;

    // Play loss sound
    playSound('loss');

    // Reset word index to start message from beginning
    this.wordIndex = 0;
    this.currentWord = null;
    
    // Change color on quote restart if mode is 'bounce' and bouncesPerColorChange is 'quote'
    if (config.colors.mode === 'bounce' && config.colors.bouncesPerColorChange === 'quote') {
      this.currentColorIndex = (this.currentColorIndex + 1) % config.colors.palette.length;
      this.primaryColor = config.colors.palette[this.currentColorIndex];
      console.log('🎨 Quote complete - color changed to:', this.primaryColor, 'index:', this.currentColorIndex);
    }

    // Remove any existing gelato
    if (this.gelato) {
      Matter.World.remove(this.world, this.gelato);
      this.gelato = null;
      this.gelatoLineData = null;
      this.bounceImpact = null;
    }
    
    // Clear motion trail
    this.trail = [];
    this.lastTrailTime = 0;
    this.lastBounceForTrail = 0;

    // Reset ball to starting position (above screen)
    Matter.Body.setPosition(this.mascot, {
      x: this.width / 2,
      y: -this.mascotRadius * 2,
    });

    // Clear velocity (gravity will be disabled by !gameStarted check)
    Matter.Body.setVelocity(this.mascot, { x: 0, y: 0 });

    // Reset entrance animation
    this.entranceStartTime = Date.now();
    this.entranceComplete = false;
    this.idleFloatStartTime = null;
    this.gameStarted = false;
    this.hasLost = false;

    // Reset bounce count and difficulty
    this.bounceCount = 0;
    this.updateDifficulty();
  }

  /**
   * Handle collision events
   */
  handleCollision(event) {
    const pairs = event.pairs;

    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;

      // Check if mascot hit a Gelato
      const mascotBody = bodyA.label === 'mascot' ? bodyA : bodyB.label === 'mascot' ? bodyB : null;
      const gelatoBody = bodyA.label === 'gelato' ? bodyA : bodyB.label === 'gelato' ? bodyB : null;

      if (mascotBody && gelatoBody) {
        // Check debounce timer
        const currentTime = Date.now();
        if (currentTime - this.lastBounceTime < config.bounce.minIntervalMs) {
          continue; // Skip this bounce (too soon)
        }

        this.lastBounceTime = currentTime;
        
        // Activate trail on gelato bounce - clear old trail and start fresh
        this.lastBounceForTrail = currentTime;
        this.trail = []; // Reset trail on each bounce
        
        // Change color on bounce if mode is 'bounce'
        if (config.colors.mode === 'bounce') {
          const bouncesPerChange = config.colors.bouncesPerColorChange;
          
          // Only change if bouncesPerColorChange is not 'quote' (quote mode changes on message restart)
          if (bouncesPerChange !== 'quote') {
            this.bouncesSinceColorChange++;
            
            // Check if enough bounces have occurred
            if (this.bouncesSinceColorChange >= bouncesPerChange) {
              this.currentColorIndex = (this.currentColorIndex + 1) % config.colors.palette.length;
              this.primaryColor = config.colors.palette[this.currentColorIndex];
              this.bouncesSinceColorChange = 0; // Reset counter
            }
          }
        }
        
        // Apply spring boost perpendicular to Gelato
        const angle = gelatoBody.angle;
        const normalX = -Math.sin(angle); // Perpendicular to line
        const normalY = Math.cos(angle);

        // Calculate how hard the ball is hitting the Gelato (dot product)
        const currentVelocity = mascotBody.velocity;
        const impactSpeed = currentVelocity.x * normalX + currentVelocity.y * normalY;
        
        // Scale springBoost inversely with timeScale to maintain consistent bounce height
        // When time runs faster, ball hits harder, so we need less boost to reach same height
        const effectiveSpringBoost = config.gelato.springBoost / this.timeScale;

        // Apply trampoline effect: reflect velocity across normal and amplify
        // Remove the component moving INTO the gelato and add it back multiplied
        const boostVelocity = -impactSpeed * (1 + effectiveSpringBoost);

        Matter.Body.setVelocity(mascotBody, {
          x: currentVelocity.x + normalX * boostVelocity,
          y: currentVelocity.y + normalY * boostVelocity,
        });

        // Play gelato bounce sound
        playSound('gelato-bounce');

        // Store impact data for visual deformation
        this.bounceImpact = {
          x: mascotBody.position.x,
          y: mascotBody.position.y,
          strength: Math.abs(impactSpeed),
          timestamp: currentTime,
        };

        // Reveal next word (Milestone 3)
        this.revealNextWord();

        // Increment bounce count and update difficulty
        this.bounceCount++;
        this.updateDifficulty();
      }

      // Check if mascot hit a wall/boundary
      const wallBody = bodyA.label === 'wall' ? bodyA : bodyB.label === 'wall' ? bodyB : null;
      if (mascotBody && wallBody) {
        playSound('wall-bump');

        // Spawn particles on wall bounce
        if (config.walls.particles.enabled) {
          this.spawnWallParticles(mascotBody, wallBody);
        }
      }
    }
  }

  /**
   * Get mascot position for rendering
   */
  getMascotPosition() {
    return {
      x: this.mascot.position.x,
      y: this.mascot.position.y,
    };
  }
  
  /**
   * Get mascot radius (responsive)
   */
  getMascotRadius() {
    return this.mascotRadius;
  }

  getGelatoMaxLength() {
    return this.gelatoMaxLength;
  }

  /**
   * Get all obstacles for rendering
   */
  getObstacles() {
    return this.obstacles.map(body => ({
      x: body.position.x,
      y: body.position.y,
      width: body.bounds.max.x - body.bounds.min.x,
      height: body.bounds.max.y - body.bounds.min.y,
      angle: body.angle,
    }));
  }

  /**
   * Get parallax stars for rendering
   */
  getParallaxStars() {
    return this.parallaxManager.getStars();
  }

  /**
   * Interpolate between two hex colors
   */
  interpolateColor(color1, color2, progress) {
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
   * Get current primary color
   */
  getPrimaryColor() {
    return this.primaryColor;
  }

  /**
   * Get motion trail for rendering
   * Returns { trail: [...points], endFadeProgress: 0.0-1.0 }
   */
  getTrail() {
    if (!config.physics.mascot.trail.enabled) return { trail: [], endFadeProgress: 0 };
    
    const currentTime = Date.now();
    const activeAfterBounceMs = config.physics.mascot.trail.activeAfterBounceMs;
    const endFadeDurationMs = config.physics.mascot.trail.endFadeDurationMs;
    
    if (activeAfterBounceMs === 0) {
      // Always on - no end fade
      return { trail: this.trail, endFadeProgress: 0 };
    }
    
    const timeSinceBounce = currentTime - this.lastBounceForTrail;
    
    // Calculate end fade progress
    // 0.0 = fully visible, 1.0 = fully faded
    let endFadeProgress = 0;
    if (timeSinceBounce > activeAfterBounceMs) {
      const fadeTime = timeSinceBounce - activeAfterBounceMs;
      endFadeProgress = Math.min(1.0, fadeTime / endFadeDurationMs);
    }
    
    return { trail: this.trail, endFadeProgress };
  }

  /**
   * Create a Gelato (springboard) from a drawn line
   * Returns the line data if created, null if max length exceeded
   * @param {number} startX - Start X position
   * @param {number} startY - Start Y position
   * @param {number} endX - End X position
   * @param {number} endY - End Y position
   * @param {Array} originalPath - Original drawn path array of {x, y} points (optional)
   */
  createGelato(startX, startY, endX, endY, originalPath = null) {
    // Start the game on first gelato creation
    if (!this.gameStarted) {
      this.gameStarted = true;
      // Ball is already dynamic, just enable physics by allowing gravity
    }

    // Check max length constraint
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > this.gelatoMaxLength) {
      // Clamp to max length
      const scale = this.gelatoMaxLength / length;
      endX = startX + dx * scale;
      endY = startY + dy * scale;
    }

    // Destroy previous Gelato if exists (only one at a time)
    if (this.gelato) {
      Matter.World.remove(this.world, this.gelato);
    }

    // Calculate center point and angle
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const angle = Math.atan2(endY - startY, endX - startX);
    const gelatoLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

    // Calculate responsive thickness (scale with mascot radius)
    // Base thickness is 4px at 30px radius, scale proportionally
    const baseThickness = 4;
    const baseRadius = 30;
    const responsiveThickness = (baseThickness / baseRadius) * this.mascotRadius;

    // Create static rectangular body for the Gelato
    this.gelato = Matter.Bodies.rectangle(
      centerX,
      centerY,
      gelatoLength,
      responsiveThickness,
      {
        isStatic: true,
        angle: angle,
        label: 'gelato',
        restitution: 0.1, // Low restitution - we handle bounce manually
      }
    );

    Matter.World.add(this.world, this.gelato);

    // Play gelato creation sound
    playSound('gelato-create');

    // Store line data for rendering (including original path for morphing animation)
    this.gelatoLineData = { 
      startX, 
      startY, 
      endX, 
      endY,
      originalPath: originalPath || null, // Store original drawn path
    };

    // Track creation time for pop-in and morphing animations
    this.gelatoCreationTime = Date.now();

    // Return line data for rendering
    return this.gelatoLineData;
  }

  /**
   * Get current Gelato for rendering (if exists)
   */
  getGelato() {
    if (!this.gelato) return null;

    return {
      x: this.gelato.position.x,
      y: this.gelato.position.y,
      angle: this.gelato.angle,
      width: this.gelato.bounds.max.x - this.gelato.bounds.min.x,
      height: this.gelato.bounds.max.y - this.gelato.bounds.min.y,
    };
  }

  /**
   * Destroy current Gelato
   */
  destroyGelato() {
    if (this.gelato) {
      Matter.World.remove(this.world, this.gelato);
      this.gelato = null;
      this.gelatoLineData = null;
      this.bounceImpact = null;
    }
  }

  /**
   * Get bounce impact data for visual deformation
   */
  getBounceImpact() {
    return this.bounceImpact;
  }

  /**
   * Get creation time for pop-in animation
   */
  getGelatoCreationTime() {
    return this.gelatoCreationTime;
  }

  /**
   * Reveal next word in message
   */
  revealNextWord() {
    const word = this.message[this.wordIndex];
    const mascotBody = this.mascot;
    this.currentWord = {
      text: word,
      timestamp: Date.now(),
      initialVelocityY: mascotBody.velocity.y, // Store Y velocity at bounce
    };

    // Play word from full audio recording by seeking to timestamp
    if (this.audioPlayer && this.wordTimings && this.wordTimings[this.wordIndex]) {
      const timing = this.wordTimings[this.wordIndex];

      // Skip sentence break markers (*)
      if (timing.word === '*') {
        console.log('Skipping sentence break marker at word index', this.wordIndex);
      } else {
        try {
          // Seek to word start time (convert ms to seconds)
          const startSeconds = timing.start / 1000;
          const endSeconds = timing.end / 1000;
          const duration = endSeconds - startSeconds;

          // Seek and play using expo-audio
          this.audioPlayer.seekTo(startSeconds);
          this.audioPlayer.play();

          console.log(`🎵 "${timing.word}" (${startSeconds.toFixed(2)}s - ${endSeconds.toFixed(2)}s, ${(duration * 1000).toFixed(0)}ms)`);

          // Stop playback at word end
          setTimeout(() => {
            if (this.audioPlayer) {
              this.audioPlayer.pause();
            }
          }, duration * 1000);
        } catch (error) {
          console.error('Audio playback failed:', error);
        }
      }
    }

    // Advance to next word (loop)
    this.wordIndex = (this.wordIndex + 1) % this.message.length;
  }

  /**
   * Get current word for display
   */
  getCurrentWord() {
    return this.currentWord;
  }

  /**
   * Get current Y velocity of mascot
   */
  getMascotVelocityY() {
    return this.mascot.velocity.y;
  }

  /**
   * Get Gelato line data for rendering
   */
  getGelatoLineData() {
    return this.gelatoLineData;
  }

  /**
   * Update boundaries when screen size changes
   * Also updates responsive sizing for ball and gelatos
   */
  updateBoundaries(width, height, responsiveConfig = null) {
    this.width = width;
    this.height = height;
    
    // Update responsive config if provided (for resize events)
    if (responsiveConfig) {
      this.mascotRadius = responsiveConfig.mascotRadius;
      this.gelatoMaxLength = responsiveConfig.gelatoMaxLength;
      
      // Destroy existing gelato if it exists (it will be recreated with new size on next draw)
      if (this.gelato) {
        Matter.World.remove(this.world, this.gelato);
        this.gelato = null;
        this.gelatoLineData = null;
      }
      
      // Update mascot body radius (requires recreating the body)
      const currentPos = this.mascot.position;
      const currentVel = this.mascot.velocity;
      Matter.World.remove(this.world, this.mascot);
      
      this.mascot = Matter.Bodies.circle(
        currentPos.x,
        currentPos.y,
        this.mascotRadius,
        {
          restitution: config.physics.mascot.restitution,
          friction: config.physics.mascot.friction,
          frictionAir: config.physics.mascot.frictionAir,
          mass: config.physics.mascot.mass,
          label: 'mascot',
        }
      );
      
      Matter.Body.setVelocity(this.mascot, currentVel);
      Matter.World.add(this.world, this.mascot);
    }

    // Remove old boundaries
    this.obstacles.forEach(obstacle => {
      Matter.World.remove(this.world, obstacle);
    });

    // Create new boundaries with new dimensions (side walls only)
    const wallThickness = config.walls.thickness;
    const halfThickness = wallThickness / 2;

    const leftWall = Matter.Bodies.rectangle(
      halfThickness,
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
        label: 'wall',
        restitution: config.walls.restitution,
      }
    );

    const rightWall = Matter.Bodies.rectangle(
      width - halfThickness,
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
        label: 'wall',
        restitution: config.walls.restitution,
      }
    );

    Matter.World.add(this.world, [leftWall, rightWall]);
    this.obstacles = [leftWall, rightWall];
  }

  /**
   * Load current message from messages.json
   * Fetches from GitHub API (always fresh on refresh!)
   */
  async loadCurrentMessage() {
    try {
      // Get GitHub token from environment
      const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN;

      // Build GitHub API URL with cache buster to force fresh fetch
      const cacheBuster = Date.now();
      const url = `https://api.github.com/repos/preetoshii/bounsight/contents/messages.json?ref=master&_=${cacheBuster}`;

      const headers = {
        'Accept': 'application/vnd.github.v3+json',
      };

      // Add authorization if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn('Could not load messages.json from GitHub API, using fallback');
        return;
      }

      const apiData = await response.json();

      // GitHub API returns base64-encoded content
      const decodedContent = atob(apiData.content);
      const data = JSON.parse(decodedContent);

      const currentDate = data.current;
      const currentMessage = data.messages[currentDate];

      if (currentMessage && currentMessage.words) {
        this.message = currentMessage.words;
        console.log('✅ Loaded fresh message from GitHub:', this.message);
      } else {
        console.warn('No message found for current date:', currentDate);
      }
    } catch (error) {
      console.warn('Failed to load current message from GitHub:', error);
      console.warn('Using fallback message');
      // Keep using the fallback message set in constructor
    }
  }

  /**
   * Spawn particles on wall bounce
   */
  spawnWallParticles(mascotBody, wallBody) {
    const particleConfig = config.walls.particles;
    const mascotPos = mascotBody.position;

    // Determine which wall was hit (left or right)
    const isLeftWall = wallBody.position.x < this.width / 2;
    const impactX = isLeftWall ? config.walls.thickness : this.width - config.walls.thickness;
    const impactY = mascotPos.y;

    // Direction away from wall (perpendicular)
    const directionX = isLeftWall ? 1 : -1;

    // Spawn particles
    for (let i = 0; i < particleConfig.count; i++) {
      const spreadAngle = particleConfig.spreadAngle * (Math.PI / 180); // Convert to radians
      const randomAngle = (Math.random() - 0.5) * spreadAngle; // Random angle within spread

      // Base direction (away from wall) + random spread
      const baseAngle = directionX > 0 ? 0 : Math.PI; // 0 = right, PI = left
      const finalAngle = baseAngle + randomAngle;

      // Random velocity magnitude
      const speed = particleConfig.velocityMin + Math.random() * (particleConfig.velocityMax - particleConfig.velocityMin);
      const vx = Math.cos(finalAngle) * speed;
      const vy = (Math.random() - 0.5) * speed * 0.5; // Slight vertical variation

      // Random size
      const size = particleConfig.sizeMin + Math.random() * (particleConfig.sizeMax - particleConfig.sizeMin);

      this.particles.push({
        x: impactX,
        y: impactY,
        vx,
        vy,
        size,
        opacity: 1,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Update particles (physics and fade out)
   */
  updateParticles(delta) {
    const particleConfig = config.walls.particles;
    const currentTime = Date.now();

    // Update each particle
    this.particles = this.particles.filter(particle => {
      const age = currentTime - particle.timestamp;

      // Remove if fully faded
      if (age >= particleConfig.fadeOutMs) {
        return false;
      }

      // Update physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particleConfig.gravity; // Apply gravity

      // Update opacity (fade out linearly)
      particle.opacity = 1 - (age / particleConfig.fadeOutMs);

      // Shrink if enabled
      if (particleConfig.shrink) {
        particle.size = particle.size * (1 - (age / particleConfig.fadeOutMs) * 0.5); // Shrink to 50% of original
      }

      return true;
    });
  }

  /**
   * Get particles for rendering
   */
  getParticles() {
    return this.particles;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up audio player
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer = null;
      } catch (error) {
        console.error('Failed to cleanup audio:', error);
      }
    }

    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
  }
}
