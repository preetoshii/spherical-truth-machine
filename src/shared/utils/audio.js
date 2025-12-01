import { createAudioPlayer } from 'expo-audio';
import { config } from '../../config';
import { triggerHaptic } from './haptics';
import { logger } from './logger';

// Sound player cache
const soundPlayers = {};

// Load and cache a sound player
function loadSound(name, source, volume = 1.0) {
  if (soundPlayers[name]) {
    // Update volume on cached player
    soundPlayers[name].volume = volume;
    return soundPlayers[name];
  }

  try {
    const player = createAudioPlayer(source);
    player.volume = volume;
    soundPlayers[name] = player;
    return player;
  } catch (error) {
    logger.warn('AUDIO_PLAYBACK', `Failed to load sound ${name}:`, error);
    return null;
  }
}

// Play a sound by name with optional haptic feedback
export async function playSound(name) {
  try {
    const soundMap = {
      'back-button': require('../../assets/sfx/back-button.wav'),
      'card-slide': require('../../assets/sfx/card-slide.wav'),
      'gelato-create': require('../../assets/sfx/gelato-create.wav'),
      'gelato-bounce': require('../../assets/sfx/gelato-bounce.wav'),
      'gelato-bounce-C2': require('../../assets/sfx/bounce/gelato-bounce-C2.wav'),
      'gelato-bounce-E2': require('../../assets/sfx/bounce/gelato-bounce-E2.wav'),
      'gelato-bounce-G2': require('../../assets/sfx/bounce/gelato-bounce-G2.wav'),
      'gelato-bounce-C3': require('../../assets/sfx/bounce/gelato-bounce-C3.wav'),
      'loss': require('../../assets/sfx/loss.wav'),
      'preview': require('../../assets/sfx/preview.wav'),
      'wall-bump': require('../../assets/sfx/wall-bump.wav'),
      'wall-bump-C4': require('../../assets/sfx/wall/wall-bump-C4.wav'),
      'wall-bump-E4': require('../../assets/sfx/wall/wall-bump-E4.wav'),
      'wall-bump-G4': require('../../assets/sfx/wall/wall-bump-G4.wav'),
      'wall-bump-C5': require('../../assets/sfx/wall/wall-bump-C5.wav'),
      'click': require('../../assets/sfx/click.wav'),
      'expand-card': require('../../assets/sfx/expand-card.wav'),
      'pickup-coin': require('../../assets/sfx/pickupCoin.wav'),
    };

    const source = soundMap[name];
    if (!source) {
      logger.warn('AUDIO_PLAYBACK', `Sound ${name} not found`);
      return;
    }

    // Set volume: 20% for all except gelato-create (100%)
    const volume = name === 'gelato-create' ? 1.0 : 0.2;
    const player = loadSound(name, source, volume);

    if (player) {
      // Replay from beginning
      player.seekTo(0);
      player.play();
    }

    // Trigger haptic feedback for key game events
    // Use runtime config if available (from haptics debug menu), otherwise use default
    const runtimeConfig = global.runtimeHapticsConfig;

    const hapticEventMap = {
      'gelato-create': 'gelatoCreation',
      'gelato-bounce': 'gelatoBounce',
      'wall-bump': 'wallBump',
      'loss': 'loss',
    };

    const hapticEvent = hapticEventMap[name];
    if (hapticEvent) {
      triggerHaptic(hapticEvent, runtimeConfig);
    }
  } catch (error) {
    logger.warn('AUDIO_PLAYBACK', `Failed to play sound ${name}:`, error);
  }
}

/**
 * Play a downward arpeggio death sound that completes the chord from the last bounce
 *
 * This creates musical continuity by finishing the chord descent from wherever
 * the last bounce note was, making death feel like a natural musical resolution.
 *
 * @param {string|null} lastBounceSound - The last bounce sound that was played
 *                                        (e.g., 'wall-bump-G4' or 'gelato-bounce-E2')
 *
 * Examples:
 * - Last bounce: 'wall-bump-G4'    → Plays: G4 → E4 → C4
 * - Last bounce: 'gelato-bounce-E2' → Plays: E2 → C2
 * - Last bounce: 'wall-bump-C5'    → Plays: C5 → G4 → E4 → C4 (full chord)
 * - No last bounce (null)          → Plays: C5 → G4 → E4 → C4 (default)
 *
 * Musical structure:
 * - Wall chord:   C5 (523Hz) → G4 (392Hz) → E4 (330Hz) → C4 (262Hz)  [C major, octave 4-5]
 * - Gelato chord: C3 (131Hz) → G2 (98Hz)  → E2 (82Hz)  → C2 (65Hz)   [C major, octave 2-3, bass]
 */
export async function playDeathArpeggio(lastBounceSound = null) {
  const delayMs = 80; // Milliseconds between each note (creates cascading arpeggio effect)

  // Define full C major chord progressions from high to low
  const wallChord = ['wall-bump-C5', 'wall-bump-G4', 'wall-bump-E4', 'wall-bump-C4'];
  const gelatoChord = ['gelato-bounce-C3', 'gelato-bounce-G2', 'gelato-bounce-E2', 'gelato-bounce-C2'];

  // Determine which chord to use and where to start
  let notes = wallChord; // Default to wall chord (mid-range)
  let startIndex = 0;    // Default to playing full chord from top

  if (lastBounceSound) {
    // Gelato bounces use bass chord (lower octave)
    if (lastBounceSound.startsWith('gelato-bounce-')) {
      notes = gelatoChord;
      startIndex = gelatoChord.indexOf(lastBounceSound);
    }
    // Wall bumps use mid-range chord
    else if (lastBounceSound.startsWith('wall-bump-')) {
      notes = wallChord;
      startIndex = wallChord.indexOf(lastBounceSound);
    }

    // Safety check: if note not found or already at the bottom, play full chord
    if (startIndex === -1 || startIndex === notes.length - 1) {
      startIndex = 0;
    }
  }

  // Extract the arpeggio starting from the last played note
  // Example: if last note was G4 (index 1), slice gives [G4, E4, C4]
  const arpeggioNotes = notes.slice(startIndex);

  // Play each note with a delay to create cascading effect
  for (let i = 0; i < arpeggioNotes.length; i++) {
    setTimeout(() => {
      playSound(arpeggioNotes[i]);
    }, i * delayMs); // 0ms, 80ms, 160ms, 240ms...
  }
}

// Setup audio (expo-audio handles configuration automatically)
export async function setupAudio() {
  // expo-audio doesn't require manual audio mode setup
  // Configuration happens automatically per platform
  logger.log('INITIALIZATION', 'Audio system ready (expo-audio)');
}
