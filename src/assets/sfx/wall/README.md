# Wall Bump Sound Variants

**NOTE:** The sound files are located in the parent directory (`src/assets/sfx/`) due to Metro bundler requirements.

This folder contains documentation for the musical wall bump sounds. Each file represents a different note in a C major chord.

## Files (located in `src/assets/sfx/`)

- **wall-bump-C4.wav** - C4 (262 Hz) - Root note
- **wall-bump-E4.wav** - E4 (330 Hz) - Major third
- **wall-bump-G4.wav** - G4 (392 Hz) - Perfect fifth
- **wall-bump-C5.wav** - C5 (523 Hz) - Octave (high accent)

## ElevenLabs Sound Designer Prompt

Use this prompt to generate the base sound:

```
Create a short, bright kalimba note at C4 (middle C, 262 Hz).
The sound should be:
- Crisp and immediate (fast attack, ~5ms)
- Warm and wooden timbre
- 250-300ms total duration with natural decay
- Bright and clear in the mid-range frequencies (500Hz-2kHz)
- Slightly resonant with a touch of reverb
- Pleasant and musical, like a thumb piano or music box
Perfect for a game sound effect that needs to be both percussive and melodic.
```

## Audacity Pitch-Shifting Instructions

### Step 1: Generate Base Sound
1. Generate the sound from ElevenLabs using the prompt above
2. Download as WAV file
3. Open in Audacity

### Step 2: Create Variants

For each variant, you'll use **Effect > Change Pitch**

**Important**:
- ✅ Use "Change Pitch" (preserves duration)
- ❌ Don't use "Change Speed" (changes duration too)
- ❌ Don't use "Change Tempo" (wrong effect)

#### Variant 1: C4 (Root) - NO CHANGE
- This is your base file
- Save as: `wall-bump-C4.wav`

#### Variant 2: E4 (Major Third) - UP 4 Semitones
1. Select all (Cmd+A)
2. Effect > Change Pitch
3. Set: **Semitones (half-steps): +4**
4. Click "OK"
5. Export as: `wall-bump-E4.wav`
6. Undo (Cmd+Z) to restore original

#### Variant 3: G4 (Perfect Fifth) - UP 7 Semitones
1. Select all (Cmd+A)
2. Effect > Change Pitch
3. Set: **Semitones (half-steps): +7**
4. Click "OK"
5. Export as: `wall-bump-G4.wav`
6. Undo (Cmd+Z) to restore original

#### Variant 4: C5 (Octave) - UP 12 Semitones
1. Select all (Cmd+A)
2. Effect > Change Pitch
3. Set: **Semitones (half-steps): +12**
4. Click "OK"
5. Export as: `wall-bump-C5.wav`

### Step 3: Export Settings
- Format: WAV (Microsoft)
- Encoding: Signed 16-bit PCM
- Sample Rate: 44100 Hz (or match your other sounds)

### Quick Reference: Semitones
| Note | Semitones from C4 | Frequency |
|------|------------------|-----------|
| C4   | 0                | 262 Hz    |
| E4   | +4               | 330 Hz    |
| G4   | +7               | 392 Hz    |
| C5   | +12              | 523 Hz    |

## Alternative: Manual Frequency Method

If "Change Pitch" by semitones doesn't work well, you can manually set frequencies:

1. Effect > Change Pitch
2. Click "Use Frequencies"
3. Set "from" to 262 Hz
4. Set "to" to target frequency:
   - E4: 330 Hz
   - G4: 392 Hz
   - C5: 523 Hz

## Tips

- **Keep it short**: 200-300ms is perfect for a game SFX
- **Test in-game**: The sounds should blend together harmoniously
- **Adjust volume**: All variants should have similar loudness
- **Consider resonance**: A little natural reverb/resonance sounds good
- **Bright is better**: These need to cut through gameplay audio

## Testing

After replacing these files, the game will randomly play one of these four notes each time the ball hits a wall, creating a musical, varied sound experience.
