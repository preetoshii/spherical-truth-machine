import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GameRenderer } from '../game/render/GameRenderer';
import { useGameLoop } from '../game/hooks/useGameLoop';
import { config } from '../config';
import { playSound } from '../utils/audio';
import { TextEditor } from './TextEditor';

/**
 * PreviewMode - Game preview with draft message and overlay controls
 */
export function PreviewMode({ message, isActive, onSave, audioUri, wordTimings, wordAudioSegments, onTextEditorChange }) {
  // State for text editing
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editedWordTimings, setEditedWordTimings] = useState(wordTimings);
  
  // Voice toggle state (Reboundhi vs Reboundhita)
  // wordAudioSegments now contains { reboundhi: uri, reboundhita: uri }
  const hasTransformedVoices = wordAudioSegments && typeof wordAudioSegments === 'object' && wordAudioSegments.reboundhi;
  const [selectedVoice, setSelectedVoice] = useState('reboundhi'); // Default to Reboundhi
  
  // Determine which audio URI to use
  const activeAudioUri = hasTransformedVoices 
    ? wordAudioSegments[selectedVoice] 
    : audioUri;

  // Use edited word timings if available, otherwise use original
  const [dimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Use shared game loop hook - ensures identical physics to main game
  // Pass null for fpsCap (uncapped in preview mode)
  // Use editedWordTimings instead of original wordTimings
  // Use activeAudioUri (selected voice or original)
  const activeWordTimings = editedWordTimings || wordTimings;
  const {
    gameCore,
    mascotPos,
    obstacles,
    bounceImpact,
    gelatoCreationTime,
    currentWord,
    mascotVelocityY,
    squashStretch,
    lines,
    setLines,
    trail,
  } = useGameLoop(dimensions, message, activeAudioUri, activeWordTimings, null, null);

  // Get parallax stars from game core
  const parallaxStars = gameCore.current ? gameCore.current.getParallaxStars() : [];

  const [currentPath, setCurrentPath] = useState(null);
  
  // Track touch start for tap vs drag detection
  const touchStartRef = React.useRef(null);
  const touchStartTimeRef = React.useRef(0);

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

  // Touch handlers for drawing
  const handleTouchStart = (event) => {
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
    const touchX = touch.pageX;
    const touchY = touch.pageY;
    
    // Store touch start position and time for tap detection
    touchStartRef.current = { x: touchX, y: touchY };
    touchStartTimeRef.current = Date.now();
    
    setCurrentPath([{ x: touchX, y: touchY }]);
  };

  const handleTouchMove = (event) => {
    if (!currentPath) return;
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;

    // Add current point to path
    const newPath = [...currentPath, { x: touch.pageX, y: touch.pageY }];

    // Trim path if it exceeds max length (sliding start)
    const trimmedPath = trimPathToMaxLength(newPath, config.gelato.maxLength);

    setCurrentPath(trimmedPath);
  };

  const handleTouchEnd = () => {
    if (!currentPath || currentPath.length === 0) return;
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTimeRef.current;
    const startPoint = currentPath[0];
    const endPoint = currentPath[currentPath.length - 1];
    
    // Calculate distance moved
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If it's a quick tap with minimal movement, check if tapping the ball
    const isTap = touchDuration < 200 && distance < 10;
    
    if (isTap && hasTransformedVoices && mascotPos.current) {
      // Check if tap is on the ball
      const ballX = mascotPos.current.x;
      const ballY = mascotPos.current.y;
      const ballRadius = config.physics.mascot.radius;
      
      const distToBall = Math.sqrt(
        (startPoint.x - ballX) ** 2 + 
        (startPoint.y - ballY) ** 2
      );
      
      if (distToBall <= ballRadius + 20) {
        // Tapped the ball! Switch voice
        const newVoice = selectedVoice === 'reboundhi' ? 'reboundhita' : 'reboundhi';
        setSelectedVoice(newVoice);
        playSound('click');
        console.log('🎭 Tapped ball - switched to voice:', newVoice);
        setCurrentPath(null);
        return;
      }
    }
    
    // Otherwise, draw gelato
    if (currentPath.length >= 2 && gameCore.current) {
      const gelatoLine = gameCore.current.createGelato(
        startPoint.x,
        startPoint.y,
        endPoint.x,
        endPoint.y,
        currentPath // Pass the full drawn path for morphing animation
      );

      if (gelatoLine) {
        setLines([gelatoLine]);
      }
    }

    setCurrentPath(null);
  };

  return (
    <View style={styles.container}>
      {/* Game renderer */}
      <View
        style={styles.gameView}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        <GameRenderer
          width={dimensions.width}
          height={dimensions.height}
          mascotX={mascotPos.current.x}
          mascotY={mascotPos.current.y}
          obstacles={obstacles.current}
          lines={lines}
          currentPath={currentPath}
          bounceImpact={bounceImpact.current}
          gelatoCreationTime={gelatoCreationTime.current}
          currentWord={currentWord.current}
          mascotVelocityY={mascotVelocityY.current}
          squashStretch={squashStretch.current}
          parallaxStars={parallaxStars}
          trail={trail.current}
          trailEndFade={0}
        />
      </View>

      {/* Overlay controls */}
      <View style={styles.overlay}>
        {/* Edit Text button (top-right) - only show if we have word timings */}
        {wordTimings && wordTimings.length > 0 && (
          <Pressable
            style={styles.editTextButton}
            onPress={() => {
              playSound('click');
              setShowTextEditor(true);
              onTextEditorChange?.(true);
            }}
            pointerEvents="auto"
          >
            <Feather name="type" size={24} color="#ffffff" />
          </Pressable>
        )}
        
        {/* Voice indicator (top-right, below text button) - show current voice */}
        {hasTransformedVoices && (
          <View style={styles.voiceIndicator} pointerEvents="none">
            <Text style={styles.voiceIndicatorText}>
              {selectedVoice === 'reboundhi' ? 'Reboundhi' : 'Reboundhita'}
            </Text>
          </View>
        )}

        {/* Save/Send Now button (bottom-center) */}
        <View style={styles.saveButtonContainer} pointerEvents="auto">
          <Pressable
            style={styles.saveButton}
            onPress={() => {
              playSound('click');
              onSave();
            }}
          >
            <Text style={styles.saveButtonText}>
              {isActive ? 'Send Now' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Text Editor overlay */}
      {showTextEditor && (
        <TextEditor
          wordTimings={activeWordTimings}
          onSave={(updatedWordTimings) => {
            setEditedWordTimings(updatedWordTimings);
            setShowTextEditor(false);
            onTextEditorChange?.(false);
            playSound('click');
          }}
          onCancel={() => {
            setShowTextEditor(false);
            onTextEditorChange?.(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gameView: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none', // Allow touches to pass through to game
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  saveButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0a0a0a',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 999,
    minWidth: 200,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a0a0a',
  },
  editTextButton: {
    position: 'absolute',
    top: 50,
    right: 50,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  voiceIndicator: {
    position: 'absolute',
    top: 110,
    right: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  voiceIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.8,
  },
});
