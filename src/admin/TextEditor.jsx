import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { playSound } from '../utils/audio';

/**
 * TextEditor - Overlay for editing transcribed text word by word
 * Allows correcting TTS errors before saving the message
 */
export function TextEditor({ wordTimings, onSave, onCancel }) {
  // State for edited words (initialize from wordTimings)
  const [editedWords, setEditedWords] = useState(
    wordTimings ? wordTimings.map(w => ({ ...w })) : []
  );
  const [editingIndex, setEditingIndex] = useState(null);

  // Handle word click to edit
  const handleWordPress = (index) => {
    setEditingIndex(index);
    playSound('click');
  };

  // Handle word change
  const handleWordChange = (index, newWord) => {
    const updated = [...editedWords];
    updated[index] = { ...updated[index], word: newWord };
    setEditedWords(updated);
  };

  // Handle save
  const handleSave = () => {
    playSound('click');
    // Filter out any empty words and sentence break markers
    const cleaned = editedWords.filter(w => w.word && w.word.trim() !== '');
    onSave(cleaned);
  };

  // Handle cancel
  const handleCancel = () => {
    playSound('back-button');
    onCancel();
  };

  // Get full text for display
  const getFullText = () => {
    return editedWords.map(w => w.word).join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Edit Transcription</Text>
          <Text style={styles.subtitle}>Tap any word to edit</Text>
        </View>

        {/* Scrollable text area with word bubbles */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.wordsContainer}>
          {editedWords.map((wordData, index) => {
            // Skip sentence break markers in display
            if (wordData.word === '*') return null;

            const isEditing = editingIndex === index;

            return (
              <View key={index} style={styles.wordWrapper}>
                {isEditing ? (
                  <View style={styles.editingContainer}>
                    <TextInput
                      style={styles.wordInput}
                      value={wordData.word}
                      onChangeText={(text) => handleWordChange(index, text)}
                      onBlur={() => setEditingIndex(null)}
                      autoFocus
                      selectTextOnFocus
                    />
                  </View>
                ) : (
                  <Pressable
                    style={styles.wordBubble}
                    onPress={() => handleWordPress(index)}
                  >
                    <Text style={styles.wordText}>{wordData.word}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Word count */}
        <Text style={styles.wordCount}>
          {editedWords.filter(w => w.word !== '*').length} words
        </Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    padding: 30,
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  wordWrapper: {
    marginRight: 8,
    marginBottom: 8,
  },
  wordBubble: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  wordText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
  },
  editingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066ff',
  },
  wordInput: {
    fontSize: 16,
    color: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60,
    fontWeight: '400',
  },
  wordCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0a0a0a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a0a0a',
  },
});

