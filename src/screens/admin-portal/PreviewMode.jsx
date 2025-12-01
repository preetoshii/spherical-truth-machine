import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GameRenderer } from '../gameplay/GameRenderer';
import { useGameLoop } from '../gameplay/useGameLoop';
import { config } from '../../config';
import { playSound } from '../../shared/utils/audio';
import { TextEditor } from './TextEditor';
import { logger } from '../../shared/utils/logger';

/**
 * PreviewMode - Game preview with draft message and overlay controls
 */
export function PreviewMode({ message, isActive, onSave, audioUri, wordTimings, wordAudioSegments, onTextEditorChange, primaryColor: parentPrimaryColor = '#FFFFFF' }) {
  // State for text editing
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editedWordTimings, setEditedWordTimings] = useState(wordTimings);
  
  // Voice toggle state (uses enabled voices from config)
  // Get list of enabled voices
  const enabledVoices = config.voiceTransform.voices.filter(v => v.enabled);
  const defaultVoice = enabledVoices.find(v => v.default) || enabledVoices[0];
  const canSwitchVoices = enabledVoices.length > 1; // Only allow switching if multiple voices enabled

  // wordAudioSegments contains { reboundhi: uri, reboundhita: uri, etc }
  const hasTransformedVoices = wordAudioSegments && typeof wordAudioSegments === 'object' && wordAudioSegments[defaultVoice?.key];
  const [selectedVoice, setSelectedVoice] = useState(defaultVoice?.key || 'reboundhi');
  
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
    mascotRadius,
    lines,
    setLines,
    trail,
    primaryColor,
  } = useGameLoop(dimensions, message, activeAudioUri, activeWordTimings, null, null);

  // Get additional game state from game core (for new features like wall glows)
  const parallaxStars = gameCore.current ? gameCore.current.getParallaxStars() : [];
  const particles = gameCore.current ? gameCore.current.getParticles() : [];
  const wallGlows = gameCore.current ? gameCore.current.getWallGlows() : [];
  const deathFadeProgress = gameCore.current ? gameCore.current.getDeathFadeProgress() : 0;

  // Frame counter for triggering re-renders
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 16);
    return () => clearInterval(interval);
  }, []);

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
    // Use responsive max length from gameCore
    const maxLength = gameCore.current ? gameCore.current.getGelatoMaxLength() : config.gelato.maxLength;
    const trimmedPath = trimPathToMaxLength(newPath, maxLength);

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
        // Tapped the ball! Switch voice (only if multiple voices enabled)
        if (canSwitchVoices && hasTransformedVoices) {
          // Find current voice index and cycle to next enabled voice
          const currentIndex = enabledVoices.findIndex(v => v.key === selectedVoice);
          const nextIndex = (currentIndex + 1) % enabledVoices.length;
          const newVoice = enabledVoices[nextIndex].key;

          setSelectedVoice(newVoice);
          playSound('click');
          logger.log('ADMIN_UI', '🎭 Tapped ball - switched to voice:', newVoice);
        }
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
          gameState={{
            mascotPos: mascotPos.current,
            obstacles: obstacles.current,
            bounceImpact: bounceImpact.current,
            gelatoCreationTime: gelatoCreationTime.current,
            currentWord: currentWord.current,
            mascotVelocityY: mascotVelocityY.current,
            mascotRadius: mascotRadius.current,
            parallaxStars,
            trails: trail.current,
            primaryColor: primaryColor.current,
            particles,
            wallGlows,
            deathFadeProgress,
          }}
          frame={frame}
          lines={lines}
          currentPath={currentPath}
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
            <Feather name="type" size={24} color={parentPrimaryColor} />
          </Pressable>
        )}
        

        {/* Save/Send Now button (bottom-center) */}
        <View style={styles.saveButtonContainer} pointerEvents="auto">
          <Pressable
            style={styles.saveButton}
            onPress={() => {
              playSound('click');
              onSave(selectedVoice); // Pass selected voice to parent
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
          primaryColor={parentPrimaryColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    // backgroundColor set inline with primaryColor
    borderWidth: 2,
    borderColor: '#000000',
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
    color: '#000000',
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
});
