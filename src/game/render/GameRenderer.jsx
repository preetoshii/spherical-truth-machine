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
 */
function WaveText({ text, opacity, color }) {
  const letters = text.split('');
  const totalLetters = letters.length;

  return (
    <View style={{ flexDirection: 'row', opacity }}>
      {letters.map((letter, index) => (
        <WaveLetter key={`${text}-${index}`} letter={letter} index={index} totalLetters={totalLetters} color={color} />
      ))}
    </View>
  );
}

/**
 * WaveLetter - Individual letter with wave animation
 */
function WaveLetter({ letter, index, totalLetters, color }) {
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
 * GameRenderer - Unified Skia renderer for all platforms
 * This same code works on Web, iOS, and Android
 * Touch events pass through the Canvas to allow line drawing
 */
export function GameRenderer({ width, height, mascotX, mascotY, obstacles = [], lines = [], currentPath = null, bounceImpact = null, gelatoCreationTime = null, currentWord = null, mascotVelocityY = 0, squashStretch = { scaleX: 1, scaleY: 1 }, parallaxStars = [], trail = [], trailEndFade = 0, primaryColor = '#FFFFFF' }) {
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
            strokeWidth={config.gelato.thickness}
            strokeCap="round"
          >
            <DashPathEffect intervals={[1, 15]} />
          </Path>
        );
      })()}

      {/* Mascot circle (now physics-based with squash and stretch!) */}
      <Group
        transform={[
          { translateX: mascotX },
          { translateY: mascotY },
          { rotate: squashStretch.rotation || 0 },
          { scaleX: squashStretch.scaleX },
          { scaleY: squashStretch.scaleY },
          { translateX: -mascotX },
          { translateY: -mascotY },
        ]}
      >
        <Circle
          cx={mascotX}
          cy={mascotY}
          r={config.physics.mascot.radius}
          color={primaryColor}
          style="stroke"
          strokeWidth={2}
        />
        
        {/* Face (eyes and mustache) */}
        {config.physics.mascot.face.enabled && (
          <Group>
            {/* Left eye (horizontal line) */}
            <Line
              p1={vec(
                mascotX - config.physics.mascot.face.eyeSpacing / 2 - config.physics.mascot.face.eyeSize,
                mascotY + config.physics.mascot.face.eyeOffsetY
              )}
              p2={vec(
                mascotX - config.physics.mascot.face.eyeSpacing / 2 + config.physics.mascot.face.eyeSize,
                mascotY + config.physics.mascot.face.eyeOffsetY
              )}
              color={primaryColor}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
            />
            
            {/* Right eye (horizontal line) */}
            <Line
              p1={vec(
                mascotX + config.physics.mascot.face.eyeSpacing / 2 - config.physics.mascot.face.eyeSize,
                mascotY + config.physics.mascot.face.eyeOffsetY
              )}
              p2={vec(
                mascotX + config.physics.mascot.face.eyeSpacing / 2 + config.physics.mascot.face.eyeSize,
                mascotY + config.physics.mascot.face.eyeOffsetY
              )}
              color={primaryColor}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
            />
            
            {/* Mustache (two curved sections) */}
            {(() => {
              const mustachePath = Skia.Path.Make();
              const mustacheCenterX = mascotX;
              const mustacheCenterY = mascotY + config.physics.mascot.face.mouthOffsetY;
              const mustacheWidth = config.physics.mascot.face.mouthWidth;
              const mustacheHeight = config.physics.mascot.face.mouthHeight;
              
              // Left side of mustache (curves up and left)
              mustachePath.moveTo(mustacheCenterX, mustacheCenterY);
              mustachePath.quadTo(
                mustacheCenterX - mustacheWidth / 3,
                mustacheCenterY - mustacheHeight,
                mustacheCenterX - mustacheWidth / 2,
                mustacheCenterY - mustacheHeight / 2
              );
              
              // Right side of mustache (curves up and right)
              mustachePath.moveTo(mustacheCenterX, mustacheCenterY);
              mustachePath.quadTo(
                mustacheCenterX + mustacheWidth / 3,
                mustacheCenterY - mustacheHeight,
                mustacheCenterX + mustacheWidth / 2,
                mustacheCenterY - mustacheHeight / 2
              );
              
              return (
                <Path
                  path={mustachePath}
                  color={primaryColor}
                  style="stroke"
                  strokeWidth={2}
                  strokeCap="round"
                />
              );
            })()}
          </Group>
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
          <WaveText text={currentWord.text} opacity={wordOpacity} color={primaryColor} />
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
    fontSize: config.visuals.wordFontSize,
    color: config.visuals.wordColor,
    letterSpacing: 1,
  },
});
