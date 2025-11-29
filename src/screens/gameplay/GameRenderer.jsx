import React, { useEffect, useRef } from 'react';
import { Canvas, Circle, Fill, Line, Rect, vec, DashPathEffect, Path, Skia, Group } from '@shopify/react-native-skia';
import { Text, View, StyleSheet, Animated } from 'react-native';
import { config } from '../../config';

// Load Inter font (clean, geometric, open-source)
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

/**
 * StarShape - Renders a 4-pointed star
 * @param {number} cx - Center X position
 * @param {number} cy - Center Y position
 * @param {number} size - Size of the star (radius from center to point)
 * @param {string} color - Star color
 * @param {number} opacity - Star opacity
 */
function StarShape({ cx, cy, size, color, opacity }) {
  const path = Skia.Path.Make();
  const { starShape, armThickness } = config.parallax;
  
  if (starShape === 'diamond') {
    // 4-pointed diamond star (classic star shape)
    const outerLength = size;
    const innerLength = size * armThickness;
    
    // Draw diamond with 4 points (top, right, bottom, left)
    path.moveTo(cx, cy - outerLength);              // Top point
    path.lineTo(cx + innerLength, cy - innerLength); // Top-right corner
    path.lineTo(cx + outerLength, cy);              // Right point
    path.lineTo(cx + innerLength, cy + innerLength); // Bottom-right corner
    path.lineTo(cx, cy + outerLength);              // Bottom point
    path.lineTo(cx - innerLength, cy + innerLength); // Bottom-left corner
    path.lineTo(cx - outerLength, cy);              // Left point
    path.lineTo(cx - innerLength, cy - innerLength); // Top-left corner
    path.close();
  } else {
    // Plus/cross shape (default)
    const outerLength = size;
    const innerWidth = size * armThickness;
    
    // Vertical bar
    path.moveTo(cx - innerWidth, cy - outerLength);
    path.lineTo(cx + innerWidth, cy - outerLength);
    path.lineTo(cx + innerWidth, cy + outerLength);
    path.lineTo(cx - innerWidth, cy + outerLength);
    path.close();
    
    // Horizontal bar
    path.moveTo(cx - outerLength, cy - innerWidth);
    path.lineTo(cx + outerLength, cy - innerWidth);
    path.lineTo(cx + outerLength, cy + innerWidth);
    path.lineTo(cx - outerLength, cy + innerWidth);
    path.close();
  }
  
  return (
    <Path
      path={path}
      color={color}
      opacity={opacity}
    />
  );
}

/**
 * WaveText - Mexican wave effect where each letter waves in sequence
 * Auto-scales font size to fit within screen width
 */
function WaveText({ text, opacity, color, screenWidth }) {
  const letters = text.split('');
  const totalLetters = letters.length;

  // Calculate dynamic font size based on text width
  const baseFontSize = config.visuals.wordFontSize;
  const maxWidthPercent = config.visuals.wordMaxWidthPercent;

  // Estimate text width (rough approximation: 0.6 * fontSize per character on average)
  // This is a heuristic - actual rendering may vary slightly by font
  const estimatedTextWidth = text.length * baseFontSize * 0.6;
  const maxAllowedWidth = screenWidth * (maxWidthPercent / 100);

  // Scale down font size if text would exceed max width
  const scaleFactor = estimatedTextWidth > maxAllowedWidth
    ? maxAllowedWidth / estimatedTextWidth
    : 1;
  const finalFontSize = baseFontSize * scaleFactor;

  return (
    <View style={{ flexDirection: 'row', opacity }}>
      {letters.map((letter, index) => (
        <WaveLetter
          key={`${text}-${index}`}
          letter={letter}
          index={index}
          totalLetters={totalLetters}
          color={color}
          fontSize={finalFontSize}
        />
      ))}
    </View>
  );
}

/**
 * WaveLetter - Individual letter with wave animation
 */
function WaveLetter({ letter, index, totalLetters, color, fontSize }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stagger the animation based on letter index
    const delayBetweenLetters = 60; // 60ms delay between each letter (faster wave)
    const initialDelay = index * delayBetweenLetters;

    // Wave only once on reveal - no loop!
    const waveAnimation = Animated.sequence([
      // Wait for this letter's turn
      Animated.delay(initialDelay),
      // Wave up (subtle and fast)
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // Wave down (subtle and fast)
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]);

    waveAnimation.start();

    return () => waveAnimation.stop();
  }, [index, totalLetters]);

  return (
    <Animated.Text
      style={[
        styles.word,
        {
          fontSize: fontSize,
          color: color,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </Animated.Text>
  );
}

/**
 * ZogChanFace - Renders the ZogChan face from dzog-chan
 * Based on the SVG paths from zog-chan-face.svg and zog-chan-speak.svg
 */
function ZogChanFace({ x, y, color, isSpeaking, radius }) {
  // Scale factor to fit face inside ball
  // Original SVG is 71x68, scale to fit in ball
  const faceScale = (radius * 0.5) / 35.5; // Scale to ~50% of ball radius (medium size)
  const faceWidth = 71 * faceScale;
  const faceHeight = 68 * faceScale;
  
  // Center the face in the ball
  const faceX = x - faceWidth / 2;
  const faceY = y - faceHeight / 2;
  
  return (
    <Group transform={[{ translateX: faceX }, { translateY: faceY }, { scale: faceScale }]}>
      {/* Left eyebrow */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.moveTo(2, 11.5946);
          p.quadTo(6.16667, 8.59463, 16.4, 4.39463);
          p.quadTo(24, 11.5946, 30, 17.0937);
          p.quadTo(30, 27.0938, 30, 31.5938);
          return p;
        })()}
        color={color}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
      
      {/* Right eyebrow */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.moveTo(69.0002, 13.0947);
          p.quadTo(66.8335, 10.7613, 61.1002, 6.29467);
          p.quadTo(55.5002, 7.09467, 48.5002, 8.09467);
          p.quadTo(41.5002, 16.5938, 41.0002, 23.5938);
          p.quadTo(40.6002, 29.1937, 40.8335, 33.5938);
          p.quadTo(41.0002, 35.0938, 41.0002, 35.0938);
          return p;
        })()}
        color={color}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
      
      {/* Nose */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.moveTo(25, 42);
          p.quadTo(25.7755, 44.2618, 26.5511, 45.8183);
          p.quadTo(30.0403, 47.0587, 36.0594, 49.1983);
          p.quadTo(42.0617, 47.764, 44, 42);
          return p;
        })()}
        color={color}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
      
      {/* Mouth - changes when speaking */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          // Mouth shape (same for both, but could animate)
          p.moveTo(28.5459, 54.0555);
          p.quadTo(26.5446, 54.5504, 19.5277, 61.0321);
          p.quadTo(20.0265, 61.5332, 20.5252, 62.0344);
          p.quadTo(49.526, 61.704, 50.5275, 61.2067);
          p.quadTo(51.5289, 60.7095, 41.5445, 54.5895);
          p.quadTo(40.0458, 54.0852, 39.3023, 53.835);
          p.quadTo(37.0431, 55.0781, 34.5431, 55.0708);
          p.quadTo(32.0431, 55.0634, 29.5542, 53.8062);
          p.quadTo(28.5459, 54.0555, 28.5459, 54.0555);
          p.close();
          return p;
        })()}
        color={color}
        style="fill"
      />
      
      {/* Left eye line */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.moveTo(8, 25.0004);
          p.quadTo(13.5, 24.4995, 15.5, 24.5);
          p.quadTo(21, 25.0004, 21, 25.0004);
          return p;
        })()}
        color={color}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
      
      {/* Right eye line */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.moveTo(48, 25.0004);
          p.quadTo(53.5, 24.4995, 55.5, 24.5);
          p.quadTo(61, 25.0004, 61, 25.0004);
          return p;
        })()}
        color={color}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
      
      {/* Forehead dot */}
      <Circle cx={34.5} cy={2.5} r={2.5} color={color} style="fill" />
      
      {/* Chin dot (only when speaking) */}
      {isSpeaking && (
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.moveTo(33.0082, 74.23);
            p.quadTo(31.8082, 74.2269, 30.5039, 75.8902);
            p.quadTo(30.0018, 76.7222, 31.4992, 77.7256);
            p.quadTo(40.5004, 77.2498, 40.5017, 76.7493);
            p.quadTo(40.503, 76.2489, 38.5069, 74.7442);
            p.quadTo(38.0082, 74.2429, 37.5095, 73.7416);
            p.quadTo(34.5082, 74.2338, 33.0082, 74.23);
            p.close();
            return p;
          })()}
          color={color}
          style="fill"
        />
      )}
    </Group>
  );
}

/**
 * GameRenderer - Unified Skia renderer for all platforms
 * This same code works on Web, iOS, and Android
 * Touch events pass through the Canvas to allow line drawing
 */
export function GameRenderer({ width, height, mascotX, mascotY, obstacles = [], lines = [], currentPath = null, bounceImpact = null, gelatoCreationTime = null, currentWord = null, mascotVelocityY = 0, mascotRadius = 45, parallaxStars = [], trail = [], trailEndFade = 0, primaryColor = '#FFFFFF' }) {
  // Calculate word opacity based on configured fade mode
  let wordOpacity = 0;

  if (currentWord) {
    if (config.visuals.wordFadeMode === 'velocity') {
      // Velocity-based fade: opacity synced 1:1 with ball motion
      if (currentWord.initialVelocityY !== undefined) {
        // At bounce: initialVelocityY is negative (upward)
        // As ball falls: velocityY increases toward positive (downward)
        // Fade from 100% to 0% as velocity goes from initial (negative) to 0 (peak) to positive
        const velocityRange = Math.abs(currentWord.initialVelocityY);
        const velocityChange = mascotVelocityY - currentWord.initialVelocityY;

        // Normalize velocity change: 0 at bounce, 1 when velocity reverses completely
        const fadeProgress = Math.min(1, Math.max(0, velocityChange / (velocityRange * 2)));
        wordOpacity = 1 - fadeProgress;
      }
    } else if (config.visuals.wordFadeMode === 'static') {
      // Static/time-based fade: three-phase animation (fade-in, persist, fade-out)
      const timeSinceReveal = Date.now() - currentWord.timestamp;
      const fadeInDuration = config.visuals.wordFadeInMs;
      const persistDuration = config.visuals.wordPersistMs;
      const fadeOutDuration = config.visuals.wordFadeOutMs;

      if (timeSinceReveal < fadeInDuration) {
        // Phase 1: Fade in from 0% → 100%
        wordOpacity = timeSinceReveal / fadeInDuration;
      } else if (timeSinceReveal < fadeInDuration + persistDuration) {
        // Phase 2: Stay at 100%
        wordOpacity = 1;
      } else if (timeSinceReveal < fadeInDuration + persistDuration + fadeOutDuration) {
        // Phase 3: Fade out from 100% → 0%
        const fadeOutProgress = (timeSinceReveal - fadeInDuration - persistDuration) / fadeOutDuration;
        wordOpacity = 1 - fadeOutProgress;
      } else {
        // Fully faded out
        wordOpacity = 0;
      }
    }
  }

  // Calculate word vertical offset - DIRECT 1:1 mapping with velocity
  // Negative velocity (up) = negative offset (up), positive velocity (down) = positive offset (down)
  let wordVerticalOffset = 0;
  if (currentWord && currentWord.initialVelocityY !== undefined) {
    const maxOffset = 50; // Maximum offset in either direction
    const velocityRange = Math.abs(currentWord.initialVelocityY);

    // Direct analog mapping: velocity -20 to +20 maps to offset -50 to +50
    // Velocity negative (up) → offset negative (up), velocity positive (down) → offset positive (down)
    const normalizedVelocity = Math.max(-1, Math.min(1, mascotVelocityY / velocityRange));
    wordVerticalOffset = normalizedVelocity * maxOffset;
  }

  return (
    <View style={{ width, height, position: 'relative' }} pointerEvents="box-none">
      <Canvas style={{ width, height }} pointerEvents="none">
        {/* Background */}
        <Fill color={config.visuals.backgroundColor} />

        {/* Parallax starfield background */}
        {parallaxStars.map((star, index) => {
          // Calculate twinkle effect (subtle opacity pulsing)
          let twinkledOpacity = star.opacity;
          if (config.parallax.twinkle.enabled) {
            const time = Date.now() / 1000; // Current time in seconds
            const { speed, intensity } = config.parallax.twinkle;
            
            // Each star twinkles at its own rate with unique phase offset
            const twinklePhase = star.twinklePhase || 0;
            const twinkleSpeedMultiplier = star.twinkleSpeed || 1.0;
            const sineWave = Math.sin(time * speed * twinkleSpeedMultiplier + twinklePhase);
            
            // Apply opacity variation: baseOpacity * (1 + intensity * sineWave)
            // sineWave ranges from -1 to 1, so this gives opacity variation of ±intensity
            twinkledOpacity = star.opacity * (1 + intensity * sineWave);
            
            // Clamp to valid opacity range (0 to 1)
            twinkledOpacity = Math.max(0, Math.min(1, twinkledOpacity));
          }
          
          return (
            <StarShape
              key={`star-${index}`}
              cx={star.x}
              cy={star.y}
              size={star.size}
              color={primaryColor}
              opacity={twinkledOpacity}
            />
          );
        })}

      {/* Draw obstacles (walls/ground) if visible in config */}
      {config.walls.visible && obstacles.map((obstacle, index) => (
        <Rect
          key={index}
          x={obstacle.x - obstacle.width / 2}
          y={obstacle.y - obstacle.height / 2}
          width={obstacle.width}
          height={obstacle.height}
          color="#333"
        />
      ))}

      {/* Draw all completed lines (Gelatos) with deformation effect */}
      {lines.map((line, index) => {
        // Render curved path if enabled and path exists
        if (config.gelato.renderMode === 'curved' && line.originalPath && line.originalPath.length > 1) {
          // Base blend: Interpolate each point toward straight line using curveBlend
          const blendAmount = config.gelato.curveBlend; // 0.0 to 1.0
          const blendedPoints = line.originalPath.map((point, i) => {
            const t = i / (line.originalPath.length - 1);
            const straightX = line.startX + (line.endX - line.startX) * t;
            const straightY = line.startY + (line.endY - line.startY) * t;
            // blendAmount = 0.0 → use straight line (straightX)
            // blendAmount = 1.0 → use original drawing (point.x)
            // blendAmount = 0.5 → 50/50 mix
            const blendedX = point.x * blendAmount + straightX * (1 - blendAmount);
            const blendedY = point.y * blendAmount + straightY * (1 - blendAmount);
            return { x: blendedX, y: blendedY };
          });

          // Calculate perpendicular direction for deformations
          const dx = line.endX - line.startX;
          const dy = line.endY - line.startY;
          const lineLength = Math.sqrt(dx * dx + dy * dy);
          const perpX = -dy / lineLength;
          const perpY = dx / lineLength;

          // Apply creation pop-in oscillation
          let creationBendAmount = 0;
          if (gelatoCreationTime) {
            const timeSinceCreation = Date.now() - gelatoCreationTime;
            const creationConfig = config.gelato.creation;

            if (timeSinceCreation < creationConfig.duration) {
              const progress = timeSinceCreation / creationConfig.duration;
              const frequency = creationConfig.frequency * Math.PI * 2;
              const dampingFactor = Math.exp(-creationConfig.damping * progress * 5);
              const oscillation = Math.sin(frequency * progress) * dampingFactor;
              creationBendAmount = creationConfig.maxBendAmount * oscillation;
            }
          }

          // Apply bounce deformation oscillation
          let bounceBendAmount = 0;
          if (bounceImpact && bounceImpact.timestamp) {
            const timeSinceBounce = Date.now() - bounceImpact.timestamp;
            const deformConfig = config.gelato.deformation;

            if (timeSinceBounce < deformConfig.duration) {
              const progress = timeSinceBounce / deformConfig.duration;
              const frequency = deformConfig.frequency * Math.PI * 2;
              const dampingFactor = Math.exp(-deformConfig.damping * progress * 5);
              const oscillation = Math.sin(frequency * progress) * dampingFactor;
              const impactStrength = Math.min(bounceImpact.strength / 10, 1);
              bounceBendAmount = deformConfig.maxBendAmount * oscillation * impactStrength;
            }
          }

          // Apply total deformation to blended points
          const totalBend = creationBendAmount + bounceBendAmount;
          const deformedPoints = blendedPoints.map((point, i) => {
            // Apply bend perpendicular to straight line
            // Stronger bend in the middle, weaker at endpoints
            const t = i / (blendedPoints.length - 1);
            const bendStrength = Math.sin(t * Math.PI); // 0 at ends, 1 in middle
            
            return {
              x: point.x + perpX * totalBend * bendStrength,
              y: point.y + perpY * totalBend * bendStrength,
            };
          });

          // Render path as simple connected lines (no smoothing)
          const path = Skia.Path.Make();
          path.moveTo(deformedPoints[0].x, deformedPoints[0].y);
          
          for (let i = 1; i < deformedPoints.length; i++) {
            path.lineTo(deformedPoints[i].x, deformedPoints[i].y);
          }

          // Calculate fade-out opacity after bounce
          let opacity = 1;
          if (bounceImpact && bounceImpact.timestamp) {
            const timeSinceBounce = Date.now() - bounceImpact.timestamp;
            const fadeOutDuration = config.gelato.fadeOutDuration;
            const fadeProgress = Math.min(timeSinceBounce / fadeOutDuration, 1);
            opacity = 1 - fadeProgress;
          }

          return (
            <Path
              key={index}
              path={path}
              color={primaryColor}
              opacity={opacity}
              style="stroke"
              strokeWidth={config.gelato.thickness}
              strokeCap="round"
            />
          );
        }

        // Check if we should apply deformation or fade to this line
        if (bounceImpact && bounceImpact.timestamp) {
          const timeSinceBounce = Date.now() - bounceImpact.timestamp;
          const deformConfig = config.gelato.deformation;
          const fadeOutDuration = config.gelato.fadeOutDuration;

          // Calculate fade out opacity (independent of deformation)
          const fadeProgress = Math.min(timeSinceBounce / fadeOutDuration, 1);
          const opacity = 1 - fadeProgress;

          // Apply deformation if still within deformation duration
          if (timeSinceBounce < deformConfig.duration) {
            // Calculate progress through the animation (0 to 1)
            const progress = timeSinceBounce / deformConfig.duration;

            // Apply oscillation with exponential decay (real spring physics)
            const frequency = deformConfig.frequency * Math.PI * 2;
            const dampingFactor = Math.exp(-deformConfig.damping * progress * 5); // Exponential decay
            const oscillation = Math.sin(frequency * progress) * dampingFactor;

            // Calculate bend amount with oscillation
            const impactStrength = Math.min(bounceImpact.strength / 10, 1);
            const bendAmount = deformConfig.maxBendAmount * oscillation * impactStrength;

            // Find the point on the line closest to impact
            const dx = line.endX - line.startX;
            const dy = line.endY - line.startY;
            const lineLength = Math.sqrt(dx * dx + dy * dy);

            // Project impact point onto line
            const impactDx = bounceImpact.x - line.startX;
            const impactDy = bounceImpact.y - line.startY;
            const t = Math.max(0, Math.min(1, (impactDx * dx + impactDy * dy) / (lineLength * lineLength)));

            // Calculate bend point (middle of line, displaced perpendicular)
            const bendX = line.startX + dx * t;
            const bendY = line.startY + dy * t;

            // Perpendicular direction (for bending)
            const perpX = -dy / lineLength;
            const perpY = dx / lineLength;

            // Apply bend displacement
            const displacedX = bendX + perpX * bendAmount;
            const displacedY = bendY + perpY * bendAmount;

            // Draw curved line using quadratic bezier
            const path = Skia.Path.Make();
            path.moveTo(line.startX, line.startY);
            path.quadTo(displacedX, displacedY, line.endX, line.endY);

            return (
              <Path
                key={index}
                path={path}
                color={primaryColor}
                opacity={opacity}
                style="stroke"
                strokeWidth={config.gelato.thickness}
                strokeCap="round"
              />
            );
          }

          // Still fading but no longer deforming - draw straight line with fade
          return (
            <Line
              key={index}
              p1={vec(line.startX, line.startY)}
              p2={vec(line.endX, line.endY)}
              color={primaryColor}
              opacity={opacity}
              style="stroke"
              strokeWidth={config.gelato.thickness}
              strokeCap="round"
            />
          );
        }

        // Check for creation animation (pop-in effect)
        if (gelatoCreationTime) {
          const timeSinceCreation = Date.now() - gelatoCreationTime;
          const creationConfig = config.gelato.creation;

          if (timeSinceCreation < creationConfig.duration) {
            // Calculate progress through creation animation
            const progress = timeSinceCreation / creationConfig.duration;

            // Apply oscillation from center with exponential decay
            const frequency = creationConfig.frequency * Math.PI * 2;
            const dampingFactor = Math.exp(-creationConfig.damping * progress * 5); // Exponential decay
            const oscillation = Math.sin(frequency * progress) * dampingFactor;

            // Bend amount for creation
            const bendAmount = creationConfig.maxBendAmount * oscillation;

            // Calculate center point and perpendicular direction
            const dx = line.endX - line.startX;
            const dy = line.endY - line.startY;
            const lineLength = Math.sqrt(dx * dx + dy * dy);

            // Bend at center (t = 0.5)
            const centerX = line.startX + dx * 0.5;
            const centerY = line.startY + dy * 0.5;

            // Perpendicular direction
            const perpX = -dy / lineLength;
            const perpY = dx / lineLength;

            // Apply bend displacement from center
            const displacedX = centerX + perpX * bendAmount;
            const displacedY = centerY + perpY * bendAmount;

            // Draw curved line
            const path = Skia.Path.Make();
            path.moveTo(line.startX, line.startY);
            path.quadTo(displacedX, displacedY, line.endX, line.endY);

            return (
              <Path
                key={index}
                path={path}
                color={primaryColor}
                style="stroke"
                strokeWidth={config.gelato.thickness}
                strokeCap="round"
              />
            );
          }
        }

        // No animation - draw normal line
        return (
          <Line
            key={index}
            p1={vec(line.startX, line.startY)}
            p2={vec(line.endX, line.endY)}
            color={primaryColor}
            style="stroke"
            strokeWidth={config.gelato.thickness}
            strokeCap="round"
          />
        );
      })}

      {/* Motion trail behind ball - single path with gradient fade */}
      {trail.length > 1 && (() => {
        const ballRadius = config.physics.mascot.radius;
        const maxOpacity = config.physics.mascot.trail.maxOpacity;
        const layers = config.physics.mascot.trail.gradientLayers;
        
        // Apply end fade (when trail expires after bounce window)
        const endFadeMultiplier = 1.0 - trailEndFade; // 1.0 = visible, 0.0 = faded
        
        // Render multiple overlapping paths with decreasing lengths for gradient effect
        // Each path starts from progressively newer points, creating fade-out at head
        return Array.from({ length: layers }).map((_, layerIndex) => {
          // Calculate what portion of trail to include in this layer
          const startIndex = Math.floor((trail.length - 1) * (layerIndex / layers));
          const layerTrail = trail.slice(startIndex);
          
          if (layerTrail.length < 2) return null;
          
          // Create smooth path for this layer
          const path = Skia.Path.Make();
          path.moveTo(layerTrail[0].x, layerTrail[0].y);
          
          for (let i = 1; i < layerTrail.length - 1; i++) {
            const midX = (layerTrail[i].x + layerTrail[i + 1].x) / 2;
            const midY = (layerTrail[i].y + layerTrail[i + 1].y) / 2;
            path.quadTo(layerTrail[i].x, layerTrail[i].y, midX, midY);
          }
          
          if (layerTrail.length > 1) {
            path.lineTo(
              layerTrail[layerTrail.length - 1].x,
              layerTrail[layerTrail.length - 1].y
            );
          }
          
          // Opacity decreases for shorter layers (creates fade at head)
          const layerOpacity = (layerIndex + 1) / layers;
          
          return (
            <Path
              key={`trail-layer-${layerIndex}`}
              path={path}
              color={primaryColor}
              opacity={layerOpacity * maxOpacity * endFadeMultiplier}
              style="stroke"
              strokeWidth={ballRadius * 2}
              strokeCap="round"
              strokeJoin="round"
            />
          );
        }).filter(Boolean);
      })()}

      {/* Draw current path being drawn (dotted curved preview) */}
      {currentPath && currentPath.length >= 2 && (() => {
        const path = Skia.Path.Make();
        path.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          path.lineTo(currentPath[i].x, currentPath[i].y);
        }
        return (
          <Path
            path={path}
            color={primaryColor}
            opacity={0.6}
            style="stroke"
            strokeWidth={config.gelato.previewThickness || config.gelato.thickness}
            strokeCap="round"
          >
            <DashPathEffect intervals={[1, 15]} />
          </Path>
        );
      })()}

      {/* Mascot circle */}
      <Group>
        <Circle
          cx={mascotX}
          cy={mascotY}
          r={mascotRadius}
          color={primaryColor}
          style="stroke"
          strokeWidth={config.gelato.thickness}
        />
        
        {/* ZogChan Face */}
        {config.physics.mascot.face.enabled && (
          <ZogChanFace 
            x={mascotX} 
            y={mascotY} 
            color={primaryColor}
            isSpeaking={currentWord !== null}
            radius={mascotRadius}
          />
        )}
      </Group>

      </Canvas>

      {/* Word overlay with Mexican wave animation */}
      {currentWord && wordOpacity > 0 && (
        <View
          style={[
            styles.wordContainer,
            { transform: [{ translateY: wordVerticalOffset }] }
          ]}
          pointerEvents="none"
        >
          <WaveText
            text={currentWord.text}
            opacity={wordOpacity}
            color={primaryColor}
            screenWidth={width}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wordContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    fontFamily: 'FinlandRounded',
    // fontSize is now set dynamically per letter
    color: config.visuals.wordColor,
    letterSpacing: 1,
  },
});
