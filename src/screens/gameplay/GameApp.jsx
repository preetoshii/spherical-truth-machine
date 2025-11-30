import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Pressable, Text, Animated, ActivityIndicator, Platform, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { GameRenderer } from './GameRenderer';
import { GameCore } from './GameCore';
import { config, getResponsiveConfig } from '../../config';
import { AdminPortal } from '../admin-portal/AdminPortal';
import { playSound } from '../../shared/utils/audio';
import { fetchMessages } from '../../shared/services/githubApi';
import { Button } from '../../shared/components/Button';
import { triggerDrawingHaptic, triggerHaptic } from '../../shared/utils/haptics';
import { DebugMenu } from '../../shared/components/DebugMenu';

/**
 * GameApp - Main game component
 * Separated so it can be dynamically imported after Skia loads
 */
export function GameApp() {
  // Responsive dimensions - updates on window resize
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  // Game physics core
  const gameCore = useRef(null);
  
  // Shared game state object - mutated directly in game loop
  // Only frame counter triggers minimal React re-render
  const gameState = useRef({
    mascotPos: { x: dimensions.width / 2, y: 100 },
    obstacles: [],
    bounceImpact: null,
    gelatoCreationTime: null,
    currentWord: null,
    mascotVelocityY: 0,
    mascotRadius: 45,
    parallaxStars: [],
    trails: [],
    primaryColor: '#FFFFFF',
    particles: [],
    deathFadeProgress: 0,
  });
  
  // Frame counter for minimal React re-render trigger (just a number, not full reconciliation)
  const [frame, setFrame] = useState(0);

  // Simple line drawing state (still uses React state since it changes infrequently)
  const [lines, setLines] = useState([]);
  const [currentPath, setCurrentPath] = useState(null); // Array of {x, y} points
  const lastGelatoData = useRef(null); // Track last gelato data to detect changes

  // Admin portal state
  const [showAdmin, setShowAdmin] = useState(false);
  const [preloadedMessagesData, setPreloadedMessagesData] = useState(null);
  const gameOpacity = useRef(new Animated.Value(1)).current;
  const adminOpacity = useRef(new Animated.Value(0)).current;

  // Remount counter - increment to force remount main game
  const [gameMountKey, setGameMountKey] = useState(0);

  // Black overlay for smooth fade-in
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Animation frame ref (needs to be accessible to pause/resume)
  const animationFrameId = useRef(null);

  // Fixed timestep accumulator for framerate-independent physics
  const accumulator = useRef(0);
  const FIXED_TIMESTEP = 16.667; // 60 Hz physics updates (1000ms / 60 = 16.667ms)

  // FPS monitoring (DEV ONLY)
  const fpsCounter = useRef({ frames: 0, lastTime: performance.now(), lastRenderTime: 0 });
  const [fps, setFps] = useState(60);

  // FPS cap control (DEV ONLY)
  const [fpsCap, setFpsCap] = useState(null); // null = uncapped, or 10-120
  const fpsCapRef = useRef(fpsCap); // Use ref to avoid remounting effect

  // Debug menu (DEV ONLY)
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [showFps, setShowFps] = useState(config.performance.showFps);
  const [hapticsConfig, setHapticsConfig] = useState({
    gelatoCreation: config.haptics.gelatoCreation,
    gelatoBounce: config.haptics.gelatoBounce,
    wallBump: config.haptics.wallBump,
    loss: config.haptics.loss,
    drawing: config.haptics.drawing,
  });

  // Update global runtime config when haptics change (for audio.js to use)
  useEffect(() => {
    global.runtimeHapticsConfig = hapticsConfig;
  }, [hapticsConfig]);

  // Sync fpsCap ref when state changes
  useEffect(() => {
    fpsCapRef.current = fpsCap;
  }, [fpsCap]);

  // Fade in overlay after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 500); // 500ms delay before fade starts

    return () => clearTimeout(timer);
  }, []);

  // Initialize physics once on mount
  useEffect(() => {
    // Calculate responsive config based on screen width
    const responsiveConfig = getResponsiveConfig(dimensions.width);
    
    // Initialize gameState with dimensions
    gameState.current.mascotPos = { x: dimensions.width / 2, y: 100 };
    
    // Initialize physics with current dimensions and responsive config
    gameCore.current = new GameCore(dimensions.width, dimensions.height, null, null, null, null, responsiveConfig);

    let lastTime = performance.now();
    let lastFrameTime = performance.now(); // For FPS cap

    const animate = (currentTime) => {
      // FPS cap: Skip this frame if not enough time has passed
      const currentFpsCap = fpsCapRef.current;
      const minFrameTime = currentFpsCap ? (1000 / currentFpsCap) : 0;
      if (currentFpsCap && (currentTime - lastFrameTime < minFrameTime)) {
        // Schedule next frame but skip work
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Cap frame delta to prevent spiral of death (max 100ms if tab goes to background)
      const frameDelta = Math.min(deltaTime, 100);

      // Add frame time to accumulator
      accumulator.current += frameDelta;

      // Run physics updates in fixed 16.667ms timesteps
      // This decouples physics from rendering framerate
      // At 120 FPS: Run 1 physics step every 2 frames
      // At 60 FPS: Run 1 physics step every frame
      // At 30 FPS: Run 2 physics steps per frame
      while (accumulator.current >= FIXED_TIMESTEP) {
        gameCore.current.step(FIXED_TIMESTEP);
        accumulator.current -= FIXED_TIMESTEP;
      }

      // Update shared game state directly (mutation - bypasses React reconciliation)
      // Only frame counter triggers minimal React state update
      const state = gameState.current;
      state.mascotPos = gameCore.current.getMascotPosition();
      state.obstacles = gameCore.current.getObstacles();
      state.bounceImpact = gameCore.current.getBounceImpact();
      state.gelatoCreationTime = gameCore.current.getGelatoCreationTime();
      state.currentWord = gameCore.current.getCurrentWord();
      state.mascotVelocityY = gameCore.current.getMascotVelocityY();
      state.mascotRadius = gameCore.current.getMascotRadius();
      state.parallaxStars = gameCore.current.getParallaxStars();
      const trailData = gameCore.current.getTrail();
      state.trails = trailData.trails;
      state.primaryColor = gameCore.current.getPrimaryColor();
      state.particles = gameCore.current.getParticles();
      state.deathFadeProgress = gameCore.current.getDeathFadeProgress();
      
      // Minimal React update - just a number, triggers Skia re-render without full reconciliation
      setFrame(prev => prev + 1);

      // Sync lines with GameCore (updates when gelato destroyed after fade)
      const currentGelatoData = gameCore.current.getGelatoLineData();
      if (currentGelatoData !== lastGelatoData.current) {
        lastGelatoData.current = currentGelatoData;
        setLines(currentGelatoData ? [currentGelatoData] : []);
      }

      fpsCounter.current.frames++;
      const now = performance.now();
      if (now >= fpsCounter.current.lastTime + 1000) {
        setFps(Math.round((fpsCounter.current.frames * 1000) / (now - fpsCounter.current.lastTime)));
        fpsCounter.current.frames = 0;
        fpsCounter.current.lastTime = now;
      }

      // Schedule next frame at the end
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (gameCore.current) {
        gameCore.current.destroy();
      }
    };
  }, []); // Only on mount

  // Pause/resume animation when admin portal opens/closes
  useEffect(() => {
    if (showAdmin) {
      // Pause animation loop when admin opens
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      // Reset accumulator to prevent time buildup while paused
      accumulator.current = 0;
    } else {
      // Resume animation loop when admin closes (if not already running)
      if (!animationFrameId.current && gameCore.current) {
        let lastTime = performance.now();
        let lastFrameTime = performance.now();

        const animate = (currentTime) => {
          // FPS cap: Skip this frame if not enough time has passed
          const currentFpsCap = fpsCapRef.current;
          const minFrameTime = currentFpsCap ? (1000 / currentFpsCap) : 0;
          if (currentFpsCap && (currentTime - lastFrameTime < minFrameTime)) {
            // Schedule next frame but skip work
            animationFrameId.current = requestAnimationFrame(animate);
            return;
          }
          lastFrameTime = currentTime;

          const deltaTime = currentTime - lastTime;
          lastTime = currentTime;

          const frameDelta = Math.min(deltaTime, 100);
          accumulator.current += frameDelta;

          while (accumulator.current >= FIXED_TIMESTEP) {
            gameCore.current.step(FIXED_TIMESTEP);
            accumulator.current -= FIXED_TIMESTEP;
          }

          // Update shared game state directly
          const state = gameState.current;
          state.mascotPos = gameCore.current.getMascotPosition();
          state.obstacles = gameCore.current.getObstacles();
          state.bounceImpact = gameCore.current.getBounceImpact();
          state.gelatoCreationTime = gameCore.current.getGelatoCreationTime();
          state.currentWord = gameCore.current.getCurrentWord();
          state.mascotVelocityY = gameCore.current.getMascotVelocityY();
          state.mascotRadius = gameCore.current.getMascotRadius();
          state.parallaxStars = gameCore.current.getParallaxStars();
          const trailData = gameCore.current.getTrail();
          state.trails = trailData.trails;
          state.primaryColor = gameCore.current.getPrimaryColor();
          state.particles = gameCore.current.getParticles();
          state.deathFadeProgress = gameCore.current.getDeathFadeProgress();
          
          setFrame(prev => prev + 1);

          const currentGelatoData = gameCore.current.getGelatoLineData();
          if (currentGelatoData !== lastGelatoData.current) {
            lastGelatoData.current = currentGelatoData;
            setLines(currentGelatoData ? [currentGelatoData] : []);
          }

          fpsCounter.current.frames++;
          const now = performance.now();
          if (now >= fpsCounter.current.lastTime + 1000) {
            setFps(Math.round((fpsCounter.current.frames * 1000) / (now - fpsCounter.current.lastTime)));
            fpsCounter.current.frames = 0;
            fpsCounter.current.lastTime = now;
          }

          // Schedule next frame at the end
          animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);
      }
    }
  }, [showAdmin])

  // Handle window resize - update boundaries without resetting game
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newDimensions = { width: window.width, height: window.height };
      setDimensions(newDimensions);

      // Update boundaries live without destroying game
      if (gameCore.current) {
        // Recalculate responsive config for new screen size
        const responsiveConfig = getResponsiveConfig(newDimensions.width);
        gameCore.current.updateBoundaries(newDimensions.width, newDimensions.height, responsiveConfig);
      }
    });

    return () => subscription?.remove();
  }, []);

  /**
   * Prevent Android hardware back button from interfering with gameplay.
   * 
   * This complements the immersive mode in MainActivity.kt which blocks edge-swipe gestures.
   * The hardware back button is still accessible, so we intercept it here to prevent
   * accidental exits during gameplay. The admin portal can still use the back button normally.
   * 
   * Note: iOS edge swipe prevention is handled natively in GameViewController.swift
   * which defers system gestures on all screen edges using preferredScreenEdgesDeferringSystemGestures.
   */
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Only allow back if admin portal is open (let it handle its own navigation)
        if (showAdmin) {
          return false; // Let admin portal handle back button
        }
        // Prevent back button during gameplay to avoid accidental exits
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }
  }, [showAdmin]);

  // Helper: Calculate total path length
  const calculatePathLength = (points) => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  // Helper: Trim path from start to maintain max length
  const trimPathToMaxLength = (points, maxLength) => {
    let totalLength = calculatePathLength(points);
    let trimmedPoints = [...points];

    while (totalLength > maxLength && trimmedPoints.length > 2) {
      // Remove first point
      const dx = trimmedPoints[1].x - trimmedPoints[0].x;
      const dy = trimmedPoints[1].y - trimmedPoints[0].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      trimmedPoints.shift();
      totalLength -= segmentLength;
    }

    return trimmedPoints;
  };

  // Track last haptic position and time for drawing feedback
  const lastHapticPos = useRef(null);
  const lastHapticTime = useRef(0);

  // Touch handlers for drawing lines
  const handleTouchStart = (event) => {
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
    console.log('🎨 Touch start:', touch.pageX, touch.pageY);
    setCurrentPath([{ x: touch.pageX, y: touch.pageY }]);
    lastHapticPos.current = { x: touch.pageX, y: touch.pageY };
    lastHapticTime.current = Date.now();
  };

  const handleTouchMove = async (event) => {
    if (!currentPath) return;
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;

    // Add current point to path
    const newPath = [...currentPath, { x: touch.pageX, y: touch.pageY }];

    // Trim path if it exceeds max length (sliding start)
    // Use responsive max length from gameCore
    const maxLength = gameCore.current ? gameCore.current.getGelatoMaxLength() : config.gelato.maxLength;
    const trimmedPath = trimPathToMaxLength(newPath, maxLength);

    setCurrentPath(trimmedPath);

    // Trigger haptic feedback based on distance AND time (prevents overlap when moving fast)
    if (config.haptics.drawing.enabled && lastHapticPos.current) {
      const dx = touch.pageX - lastHapticPos.current.x;
      const dy = touch.pageY - lastHapticPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeSinceLastHaptic = Date.now() - lastHapticTime.current;

      // Trigger haptic only if BOTH distance and time thresholds are met
      if (distance >= config.haptics.drawing.pixelsPerTick &&
          timeSinceLastHaptic >= config.haptics.drawing.minIntervalMs) {
        // Trigger ultra-subtle haptic for drawing feedback
        // Uses platform-specific haptics (Android: custom module, iOS: expo-haptics)
        triggerDrawingHaptic(hapticsConfig);
        lastHapticPos.current = { x: touch.pageX, y: touch.pageY };
        lastHapticTime.current = Date.now();
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentPath && currentPath.length >= 2 && gameCore.current) {
      // Create straight-line Gelato from first to last point of path
      const startPoint = currentPath[0];
      const endPoint = currentPath[currentPath.length - 1];

      const gelatoLine = gameCore.current.createGelato(
        startPoint.x,
        startPoint.y,
        endPoint.x,
        endPoint.y,
        currentPath // Pass the full drawn path for morphing animation
      );

      // Store the clamped line for visual rendering
      if (gelatoLine) {
        setLines([gelatoLine]); // Replace old lines (only one Gelato at a time)
      }

      setCurrentPath(null);
    }
  };

  // Admin portal toggle functions
  const openAdmin = async () => {
    playSound('card-slide');

    // Preload messages data to prevent flicker
    try {
      const data = await fetchMessages();
      setPreloadedMessagesData(data);
    } catch (error) {
      console.error('Failed to preload messages:', error);
      // Still open admin portal, it will handle the error
    }

    // Reset admin opacity to 1 before showing
    adminOpacity.setValue(1);
    setShowAdmin(true);
  };

  const closeAdmin = () => {
    setShowAdmin(false);
    // Reset game opacity to 1 and force remount of main game to reset physics
    gameOpacity.setValue(1);
    setGameMountKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* Game view - unmount completely when admin is open */}
      {!showAdmin && (
        <View
          key={gameMountKey}
          style={styles.fullScreen}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        >
          {/* Hidden preload element to force font to load before first word */}
          <Text style={{ position: 'absolute', opacity: 0, fontFamily: 'FinlandRounded' }}>
            preload
          </Text>

          <GameRenderer
            width={dimensions.width}
            height={dimensions.height}
            gameState={gameState.current}
            frame={frame}
            lines={lines}
            currentPath={currentPath}
          />

          {/* Admin Button - Feather Icon */}
          <Pressable onPress={openAdmin} style={styles.adminButton}>
            <Feather name="feather" size={20} color={gameState.current.primaryColor} style={{ opacity: 0.6 }} />
          </Pressable>

          {/* Debug Button (always visible) with optional FPS Counter */}
          <Pressable onPress={() => setShowDebugMenu(true)} style={styles.debugButton}>
            <Text style={[styles.debugButtonText, { color: gameState.current.primaryColor }]}>
              {config.performance.showFps ? `⚙️ ${fps} FPS` : '⚙️'}
            </Text>
          </Pressable>

          {/* Debug Menu Overlay */}
          <DebugMenu
            visible={showDebugMenu}
            onClose={() => setShowDebugMenu(false)}
            hapticsConfig={hapticsConfig}
            setHapticsConfig={setHapticsConfig}
            fpsCap={fpsCap}
            setFpsCap={setFpsCap}
            showFps={showFps}
            setShowFps={setShowFps}
            primaryColor={gameState.current.primaryColor}
          />
        </View>
      )}

      {/* Admin portal - unmount when closed */}
      {showAdmin && (
        <View style={styles.fullScreen}>
          <AdminPortal onClose={closeAdmin} preloadedData={preloadedMessagesData} primaryColor={gameState.current.primaryColor} />
        </View>
      )}

      {/* Hide status bar - immersive mode in MainActivity.kt handles system-level hiding,
          but this ensures React Native doesn't show it either */}
      <StatusBar hidden={true} />

      {/* Black overlay that fades in on mount */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  adminButton: {
    position: 'absolute',
    top: 50,
    right: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fpsCounter: {
    position: 'absolute',
    top: 50,
    left: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  fpsText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#00ff00',
    fontWeight: 'bold',
  },
  debugButton: {
    position: 'absolute',
    top: 50,
    left: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  debugButtonText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#00ff00',
    fontWeight: 'bold',
  },
  fpsMenu: {
    position: 'absolute',
    top: 90,
    left: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
  },
  fpsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 4,
  },
  fpsButtonActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  fpsButtonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  hapticControl: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  hapticLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#00ff00',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  hapticButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  hapticBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    alignItems: 'center',
  },
  hapticTestBtn: {
    flex: 2,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 4,
    alignItems: 'center',
  },
  hapticBtnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
