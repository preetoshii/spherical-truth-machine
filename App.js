import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { setupAudio } from './src/shared/utils/audio';
import { useFonts } from 'expo-font';

// Load Skia on web immediately (before any Skia imports)
let skiaLoadPromise = null;
if (Platform.OS === 'web') {
  skiaLoadPromise = LoadSkiaWeb({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.40.0/bin/full/${file}`,
  });
}

export default function App() {
  const [GameAppComponent, setGameAppComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load custom font
  const [fontsLoaded] = useFonts({
    'FinlandRounded': require('./assets/fonts/FinlandRounded-Thin.otf'),
  });

  useEffect(() => {
    async function loadApp() {
      try {
        if (Platform.OS === 'web') {
          // Wait for Skia to load first
          await skiaLoadPromise;
          console.log('✓ Skia loaded successfully');
        }

        // Setup audio
        await setupAudio();
        console.log('✓ Audio setup complete');

        // Now dynamically import GameApp (which imports Skia components)
        const module = await import('./src/screens/gameplay/GameApp');
        setGameAppComponent(() => module.GameApp);
        setLoading(false);
      } catch (err) {
        console.error('✗ Failed to load:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadApp();
  }, []);

  if (loading || !fontsLoaded || error || !GameAppComponent) {
    return <View style={styles.container} />;
  }

  return <GameAppComponent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
