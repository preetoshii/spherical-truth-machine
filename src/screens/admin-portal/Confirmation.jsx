import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { playSound } from '../../shared/utils/audio';

/**
 * Confirmation - Send Now confirmation dialog
 * Only shown when updating the ACTIVE message
 */
export function Confirmation({ onCancel, onConfirm, uploadProgress, primaryColor = '#FFFFFF' }) {
  return (
    <View style={styles.container}>
      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />

      {/* Confirmation card */}
      <View style={styles.card}>
        <Text style={[styles.title, { color: primaryColor }]}>Send this message now?</Text>
        <Text style={styles.subtitle}>
          This will update immediately for all users.
        </Text>

        <View style={styles.buttons}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              playSound('click');
              onCancel();
            }}
            disabled={uploadProgress !== null}
          >
            <Text style={[styles.cancelButtonText, { color: primaryColor }]}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.confirmButton, { backgroundColor: primaryColor }]}
            onPress={() => {
              playSound('click');
              onConfirm();
            }}
            disabled={uploadProgress !== null}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </Pressable>
        </View>
      </View>

      {/* Upload progress overlay */}
      {uploadProgress === 'uploading' && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>Uploading audio...</Text>
          </View>
        </View>
      )}

      {uploadProgress === 'success' && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>✓ Message sent!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  card: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 32,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color set inline with primaryColor
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    // backgroundColor set inline with primaryColor
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    // color set inline with primaryColor
  },
});
