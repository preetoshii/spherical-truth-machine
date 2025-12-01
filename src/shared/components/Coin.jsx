import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { config } from '../../config';

/**
 * Shared coin visual properties (matches config.coins)
 * These values are used consistently across all coin representations
 */
export const COIN_VISUAL = {
  width: config.coins.width,           // 8px
  height: config.coins.height,         // 12px
  cornerRadius: config.coins.cornerRadius, // 4px
};

/**
 * SpinningCoin - Reusable animated coin component
 * Uses horizontal scale oscillation to simulate 3D spinning (like Mario coins)
 * Matches the exact sine wave animation used by game coins
 * 
 * @param {string} color - Coin color (uses dynamic primary color or static)
 * @param {number} size - Target size in pixels (coin will scale to fit)
 * @param {boolean} spinning - Whether the coin should spin (default: true)
 */
export function SpinningCoin({ color, size, spinning = true }) {
  const scaleX = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());
  const rotationPhase = useRef(Math.random() * Math.PI * 2); // Random starting phase like game coins
  
  useEffect(() => {
    if (!spinning) {
      scaleX.setValue(1); // Show full width when not spinning
      return;
    }
    
    // Match game coin animation exactly: sine wave-based rotation
    // Game coins use: currentPhase = rotationPhase + (age * rotationSpeed)
    // Then: normalizedSine = (Math.sin(currentPhase) + 1) / 2
    // Then: scaleX = minScale + (normalizedSine * (maxScale - minScale))
    const { minScale, maxScale, speed: rotationSpeed } = config.coins.rotation;
    
    const animate = () => {
      const currentTime = Date.now();
      const age = currentTime - startTime.current;
      const currentPhase = rotationPhase.current + (age * rotationSpeed);
      
      // Map sine wave (-1 to 1) to scale range (minScale to maxScale) - EXACT match to game coins
      const normalizedSine = (Math.sin(currentPhase) + 1) / 2; // 0 to 1
      const newScaleX = minScale + (normalizedSine * (maxScale - minScale));
      
      scaleX.setValue(newScaleX);
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [spinning, scaleX]);
  
  // Calculate coin size to fit within the provided size
  const scale = Math.min(size / COIN_VISUAL.height, size / COIN_VISUAL.width) * 0.8;
  const scaledWidth = COIN_VISUAL.width * scale;
  const scaledHeight = COIN_VISUAL.height * scale;
  const scaledCornerRadius = COIN_VISUAL.cornerRadius * scale;
  
  return (
    <Animated.View
      style={{
        width: scaledWidth,
        height: scaledHeight,
        transform: [{ scaleX: scaleX }],
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: scaledWidth,
          height: scaledHeight,
          borderRadius: scaledCornerRadius,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
}

