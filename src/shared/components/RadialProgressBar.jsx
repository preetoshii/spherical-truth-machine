import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { SpinningCoin } from './Coin';

// Try to import react-native-svg, fallback to simple View-based implementation
let Svg, Circle, Path;
try {
  const svgModule = require('react-native-svg');
  Svg = svgModule.default || svgModule.Svg;
  Circle = svgModule.Circle;
  Path = svgModule.Path;
} catch (e) {
  // react-native-svg not available, will use View-based fallback
  Svg = null;
  Circle = null;
  Path = null;
}

/**
 * Converts polar coordinates (radius, angle) to Cartesian coordinates (x, y)
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} r - Radius
 * @param {number} angle - Angle in radians
 * @returns {{x: number, y: number}}
 */
function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/**
 * Generates SVG path string for an arc
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} r - Radius
 * @param {number} startAngle - Start angle in radians
 * @param {number} endAngle - End angle in radians
 * @param {number} progress - Progress percentage (0-100) for largeArcFlag calculation
 * @param {number} sweepFlag - 0 for counter-clockwise, 1 for clockwise
 * @returns {string} SVG path data string
 */
function describeArc(cx, cy, r, startAngle, endAngle, progress, sweepFlag) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = progress > 50 ? 1 : 0;
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, sweepFlag, end.x, end.y
  ].join(" ");
}

/**
 * RadialProgressBar - Circular progress indicator
 * Simple design: outer ring showing progress percentage
 * 
 * @param {number} progress - Progress value between 0 and 1
 * @param {number} size - Diameter of the progress bar in pixels
 * @param {number} strokeWidth - Thickness of the progress ring
 * @param {string} color - Color of the progress ring
 * @param {number} opacity - Opacity of the component (0-1)
 * @param {number|null} coinCount - Optional coin count to display in center (null = don't show)
 * @param {number} coinCountFontSize - Font size for coin count text
 * @param {boolean} shouldPulse - Whether to trigger a pulse animation (for coin deposits)
 */
export function RadialProgressBar({ progress, size, strokeWidth, color, opacity = 1, coinCount = null, coinCountFontSize = 24, shouldPulse = false }) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Pulse animation for coin deposits
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (shouldPulse) {
      // Quick pulse: scale up then back down
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldPulse]);
  
  // If react-native-svg is available, use SVG Path-based arc implementation with Animated API
  if (Svg && Path && Circle) {
    // Calculate SVG dimensions
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const startAngle = Math.PI / 2; // Start from bottom (90 degrees, like Moon example)
    
    // Use Animated.Value for smooth progress animation
    const animatedProgress = useRef(new Animated.Value(clampedProgress)).current;
    
    // State to hold the current path string (updated via listener)
    const [currentPath, setCurrentPath] = React.useState(() => {
      if (clampedProgress <= 0) return '';
      const progressPercent = clampedProgress * 100;
      const endAngle = startAngle + (2 * Math.PI * clampedProgress);
      return describeArc(center, center, radius, startAngle, endAngle, progressPercent, 1);
    });
    
    // Update animated progress when prop changes - animate smoothly
    useEffect(() => {
      Animated.timing(animatedProgress, {
        toValue: clampedProgress,
        duration: 200, // Smooth animation duration (matches deposit interval)
        useNativeDriver: false, // SVG path animation doesn't support native driver
      }).start();
    }, [clampedProgress]);
    
    // Listen to animated value changes and update path
    useEffect(() => {
      const listenerId = animatedProgress.addListener(({ value }) => {
        if (value <= 0) {
          setCurrentPath('');
        } else {
          const progressPercent = value * 100;
          const endAngle = startAngle + (2 * Math.PI * value);
          const pathString = describeArc(center, center, radius, startAngle, endAngle, progressPercent, 1);
          setCurrentPath(pathString);
        }
      });
      
      return () => {
        animatedProgress.removeListener(listenerId);
      };
    }, [animatedProgress, center, radius, startAngle]);
    
    // Full circle path for background (complete 360 degree arc)
    const fullCircleEndAngle = startAngle + 2 * Math.PI;
    const fullCirclePath = describeArc(center, center, radius, startAngle, fullCircleEndAngle, 100, 1);
    
    return (
      <Animated.View style={[styles.container, { width: size, height: size, opacity, transform: [{ scale: scaleAnim }] }]}>
        <Svg width={size} height={size}>
          {/* Background circle (full ring) - using path for consistency */}
          <Path
            d={fullCirclePath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          
          {/* Progress arc - animated path that fills from bottom (clockwise) */}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              opacity={1.0}
            />
          )}
        </Svg>
        {/* Coin count in center - "4 x [spinning coin]" format */}
        {coinCount !== null && (
          <View style={styles.centerText}>
            <View style={styles.coinCountContainer}>
              <Text style={[styles.coinCountText, { color, fontSize: coinCountFontSize * 0.6 }]}>
                {coinCount}
              </Text>
              <Text style={[styles.coinCountText, { color, fontSize: coinCountFontSize * 0.6, marginHorizontal: 4 }]}>
                ×
              </Text>
              <SpinningCoin color={color} size={coinCountFontSize * 0.5} />
            </View>
          </View>
        )}
      </Animated.View>
    );
  }
  
  // Fallback: Simple View-based implementation using rotation
  // This creates a circular progress bar using two half-circles
  const radius = size / 2;
  const borderWidth = strokeWidth;
  
  // Calculate rotation for progress (0-360 degrees, starting from top)
  const rotation = clampedProgress * 360;
  
  // Determine which half-circle to show based on progress
  const showSecondHalf = clampedProgress > 0.5;
  const firstHalfRotation = Math.min(180, rotation);
  const secondHalfRotation = showSecondHalf ? rotation - 180 : 0;
  
  return (
    <Animated.View style={[styles.container, { width: size, height: size, opacity, transform: [{ scale: scaleAnim }] }]}>
      {/* Background circle (full ring) - lower opacity */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: borderWidth,
            borderColor: color,
            opacity: 0.2,
          },
        ]}
      />
      
      {/* First half-circle (0-180 degrees) */}
      <View
        style={[
          styles.halfCircle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: borderWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: firstHalfRotation >= 180 ? color : 'transparent',
            borderLeftColor: firstHalfRotation >= 90 ? color : 'transparent',
            transform: [{ rotate: `${firstHalfRotation}deg` }],
          },
        ]}
      />
      
      {/* Second half-circle (180-360 degrees) */}
      {showSecondHalf && (
        <View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: borderWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: secondHalfRotation >= 90 ? color : 'transparent',
              borderBottomColor: secondHalfRotation >= 180 ? color : 'transparent',
              borderLeftColor: 'transparent',
              transform: [{ rotate: `${180 + secondHalfRotation}deg` }],
            },
          ]}
        />
      )}
      
      {/* Coin count in center - "4 x [spinning coin]" format */}
      {coinCount !== null && (
        <View style={styles.centerText}>
          <View style={styles.coinCountContainer}>
            <Text style={[styles.coinCountText, { color, fontSize: coinCountFontSize * 0.6 }]}>
              {coinCount}
            </Text>
            <Text style={[styles.coinCountText, { color, fontSize: coinCountFontSize * 0.6, marginHorizontal: 4 }]}>
              ×
            </Text>
            <SpinningCoin color={color} size={coinCountFontSize * 0.5} />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
  },
  halfCircle: {
    position: 'absolute',
  },
  centerText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  coinCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCountText: {
    fontFamily: 'Inter',
    fontWeight: '300',
    textAlign: 'center',
  },
});

