# Gelato Bounce Sound Variants

This folder contains documentation for the musical gelato bounce sounds. Each file represents a different note in a C major chord, but in a much lower octave than the wall bumps, creating a deep, bouncy, springy feeling.

## Files (located in this folder)

- **gelato-bounce-C2.wav** - C2 (65 Hz) - Deep root note
- **gelato-bounce-E2.wav** - E2 (82 Hz) - Deep major third
- **gelato-bounce-G2.wav** - G2 (98 Hz) - Deep perfect fifth
- **gelato-bounce-C3.wav** - C3 (130 Hz) - Mid-bass octave (higher accent)

## Sound Character

**Walls vs Gelato:**
- **Walls** = High kalimba (C4/E4/G4/C5) - bright, sharp, percussive "tink"
- **Gelato** = Deep synth bass pluck (C2/E2/G2/C3) - bouncy, elastic, springy "BOING"

## ElevenLabs Sound Designer Prompt

Use this prompt to generate the base sound:

```
Create a short, deep synth bass pluck at C2 (65 Hz).
The sound should be:
- Sharp, plucked attack (~3-5ms) like releasing a spring
- Deep, resonant bass tone with elastic character
- 300-400ms total duration with natural decay
- Rich low frequencies (60Hz-200Hz) that feel physical
- Slight "boing" or springy quality, like a trampoline
- Electronic but musical, bouncy and energetic
- Catapult/launch feeling with elastic tension release
Perfect for a springboard bounce effect that feels like being launched upward.
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

#### Variant 1: C2 (Root) - NO CHANGE
- This is your base file (VERY deep!)
- Save as: `gelato-bounce-C2.wav`

#### Variant 2: E2 (Major Third) - UP 4 Semitones
1. Select all (Cmd+A)
2. Effect > Change Pitch
3. Set: **Semitones (half-steps): +4**
4. Click "OK"
5. Export as: `gelato-bounce-E2.wav`
6. Undo (Cmd+Z) to restore original

#### Variant 3: G2 (Perfect Fifth) - UP 7 Semitones
1. Select all (Cmd+A)
2. Effect > Change Pitch
3. Set: **Semitones (half-steps): +7**
4. Click "OK"
5. Export as: `gelato-bounce-G2.wav`
6. Undo (Cmd+Z) to restore original

#### Variant 4: C3 (Octave) - UP 12 Semitones
1. Select all (Cmd+A)
2. Effect > Change Pitch
3. Set: **Semitones (half-steps): +12**
4. Click "OK"
5. Export as: `gelato-bounce-C3.wav`

### Step 3: Export Settings
- Format: WAV (Microsoft)
- Encoding: Signed 16-bit PCM
- Sample Rate: 44100 Hz (or match your other sounds)

### Quick Reference: Semitones
| Note | Semitones from C2 | Frequency |
|------|------------------|-----------|
| C2   | 0                | 65 Hz     |
| E2   | +4               | 82 Hz     |
| G2   | +7               | 98 Hz     |
| C3   | +12              | 130 Hz    |

## Alternative: Manual Frequency Method

If "Change Pitch" by semitones doesn't work well, you can manually set frequencies:

1. Effect > Change Pitch
2. Click "Use Frequencies"
3. Set "from" to 65 Hz
4. Set "to" to target frequency:
   - E2: 82 Hz
   - G2: 98 Hz
   - C3: 130 Hz

## Alternative: Even Deeper (Optional)

If C2 isn't deep enough, try going down an octave to C1:

| Note | Frequency | Semitones from C2 |
|------|-----------|-------------------|
| C1   | 33 Hz     | -12               |
| E1   | 41 Hz     | -8                |
| G1   | 49 Hz     | -5                |

**Warning:** These are VERY deep and may be felt more than heard on some devices!

## Tips

- **Deep and bouncy**: These should feel springy and elastic
- **Test in-game**: Should harmonize with wall bumps (same key, different octave)
- **Adjust volume**: May need to be slightly louder than wall bumps due to low frequencies
- **Physical feeling**: Bass frequencies should feel weighty and powerful
- **Contrast**: Should sound completely different from bright kalimba wall bumps

## Testing

After replacing these files, the game will randomly play one of these four deep notes each time the ball bounces off the gelato, creating a musical springboard effect that harmonizes perfectly with the wall bumps.
