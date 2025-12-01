import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CalendarView } from './CalendarView';
import { PreviewMode } from './PreviewMode';
import { Confirmation } from './Confirmation';
import { fetchMessages, saveMessage as saveMessageToGitHub, saveMessageWithAudio } from '../../shared/services/githubApi';
import { playSound } from '../../shared/utils/audio';
import { logger } from '../../shared/utils/logger';
import { getPrimaryColor } from '../../shared/services/primaryColorManager';

/**
 * AdminPortal - Root component for admin interface
 * Manages view state and transitions between calendar, preview, and confirmation views
 */
export function AdminPortal({ onClose, preloadedData, primaryColor: initialPrimaryColor = '#FFFFFF' }) {
  // Track primary color state to allow updates from universal color manager
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  
  // Update primary color when prop changes (in case it updates from parent)
  useEffect(() => {
    setPrimaryColor(initialPrimaryColor);
  }, [initialPrimaryColor]);

  // Poll universal color manager for updates
  useEffect(() => {
    const interval = setInterval(() => {
      const currentColor = getPrimaryColor();
      if (currentColor && currentColor !== primaryColor) {
        setPrimaryColor(currentColor);
      }
    }, 100); // Update every 100ms for smooth color transitions

    return () => clearInterval(interval);
  }, [primaryColor]);
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' | 'preview' | 'confirmation'
  const [editingDate, setEditingDate] = useState(null); // Date being edited (when set, card is in edit mode)
  const [draftMessage, setDraftMessage] = useState(''); // Message being composed
  const [scheduledMessages, setScheduledMessages] = useState({}); // All scheduled messages
  const [scrollToDate, setScrollToDate] = useState(null); // Date to scroll to when returning to calendar
  const [messagesData, setMessagesData] = useState(null); // Full messages.json data (includes _sha for updates)
  const [isLoading, setIsLoading] = useState(!preloadedData); // Loading state (false if data was preloaded)

  // Audio recording data
  const [draftAudioUri, setDraftAudioUri] = useState(null);
  const [draftWordTimings, setDraftWordTimings] = useState(null);
  const [draftWordAudioSegments, setDraftWordAudioSegments] = useState(null);

  // Audio data for GitHub upload
  const [draftAudioData, setDraftAudioData] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null); // Track which voice user selected

  // Upload progress state: null | 'uploading' | 'success'
  const [uploadProgress, setUploadProgress] = useState(null);

  // Text editor state (for hiding back button)
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);

  // Load messages on mount (or use preloaded data)
  useEffect(() => {
    if (preloadedData) {
      // Use preloaded data to avoid flicker
      setMessagesData(preloadedData);
      setScheduledMessages(preloadedData.messages || {});
      logger.log('ADMIN_UI', 'Using preloaded messages:', preloadedData);
    } else {
      // Fallback: load from GitHub
      loadMessages();
    }
  }, [preloadedData]);

  // Load all messages from GitHub
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMessages();
      setMessagesData(data);
      setScheduledMessages(data.messages || {});
      logger.log('ADMIN_UI', 'Loaded messages from GitHub:', data);
    } catch (error) {
      logger.error('ADMIN_UI', 'Failed to load messages:', error);
      // Use empty messages as fallback
      setScheduledMessages({});
    } finally {
      setIsLoading(false);
    }
  };

  // When clicking a card, just set editing state (card expands in place)
  const openEdit = (date, message) => {
    setEditingDate(date);
    setDraftMessage(message);
  };

  // Navigate to preview mode from edit mode
  const openPreview = (audioUri, wordTimings, wordAudioSegments, messageText) => {
    setDraftAudioUri(audioUri);
    setDraftWordTimings(wordTimings);
    setDraftWordAudioSegments(wordAudioSegments);

    // Update draft message with transcribed text if provided
    if (messageText) {
      setDraftMessage(messageText);
    }

    // Store audio data - we'll determine which voice to upload when user saves
    // (PreviewMode lets user switch between voices, so we don't pick one yet)
    setDraftAudioData({
      originalUri: audioUri,
      wordAudioSegments: wordAudioSegments, // Contains both voice options
      wordTimings: wordTimings,
      words: wordTimings.map(wt => wt.word) // Extract words from timings
    });

    setCurrentView('preview');
  };

  // Navigate back from preview to calendar (with edit state preserved)
  const backFromPreview = () => {
    setCurrentView('calendar');
  };

  // Exit edit mode (collapse card)
  const exitEdit = () => {
    setEditingDate(null);
    setDraftMessage('');
  };

  // Save message (for future dates)
  const saveMessage = async (voiceSelection) => {
    // Validation: Check for empty or invalid data
    if (!editingDate || editingDate === 'null') {
      logger.error('ADMIN_UI', 'Cannot save: invalid date', editingDate);
      alert('Error: Invalid date. Please try again.');
      return;
    }

    if (!draftMessage || draftMessage.trim().length === 0) {
      logger.error('ADMIN_UI', 'Cannot save: empty message');
      alert('Error: Message cannot be empty.');
      return;
    }

    try {
      setUploadProgress('uploading'); // Show upload progress

      const savedDate = editingDate;
      const savedMessage = draftMessage;

      let updatedData;

      // Check if we have audio data to save
      if (draftAudioData && voiceSelection) {
        logger.log('ADMIN_UI', 'Saving message with audio (voice:', voiceSelection, ')');

        // Build audioData with only the selected voice
        const audioDataToSave = {
          originalUri: draftAudioData.originalUri,
          transformedUri: draftAudioData.wordAudioSegments[voiceSelection], // Pick selected voice
          wordTimings: draftAudioData.wordTimings,
          words: draftAudioData.words
        };

        // Save with audio
        updatedData = await saveMessageWithAudio(savedDate, savedMessage, audioDataToSave, false);
      } else {
        logger.log('ADMIN_UI', 'Saving text-only message');
        // Save text only (backward compatibility)
        updatedData = await saveMessageToGitHub(savedDate, savedMessage, false);
      }

      // Update local state
      setMessagesData(updatedData);
      setScheduledMessages(updatedData.messages || {});

      logger.log('ADMIN_UI', 'Saved message for', savedDate);

      // Show success message
      setUploadProgress('success');

      // Clear editing state AFTER successful save so we return to normal calendar view (not edit mode)
      setScrollToDate(savedDate); // Remember which card to scroll to
      setEditingDate(null);
      setDraftMessage('');
      setDraftAudioData(null);
      setSelectedVoice(null);

      // Wait 1 second to show success message, then return to calendar
      setTimeout(() => {
        setUploadProgress(null); // Reset progress state
        backFromPreview(); // Fade back to calendar
      }, 1000);

    } catch (error) {
      setUploadProgress(null); // Reset progress on error
      logger.error('ADMIN_UI', 'Failed to save message:', error);
      alert('Failed to save message. Please try again.');
      return; // Don't navigate away on error
    }
  };

  // Send now (for active message)
  const sendNow = (voiceSelection) => {
    // Store selected voice for confirmation
    setSelectedVoice(voiceSelection);
    setCurrentView('confirmation');
  };

  // Confirm send now
  const confirmSendNow = async () => {
    // Validation: Check for empty or invalid data
    if (!editingDate || editingDate === 'null') {
      logger.error('ADMIN_UI', 'Cannot send: invalid date', editingDate);
      alert('Error: Invalid date. Please try again.');
      setCurrentView('preview'); // Go back to preview
      return;
    }

    if (!draftMessage || draftMessage.trim().length === 0) {
      logger.error('ADMIN_UI', 'Cannot send: empty message');
      alert('Error: Message cannot be empty.');
      setCurrentView('preview'); // Go back to preview
      return;
    }

    try {
      setUploadProgress('uploading'); // Show upload progress

      const savedDate = editingDate;
      const savedMessage = draftMessage;

      let updatedData;

      // Check if we have audio data to save
      if (draftAudioData && selectedVoice) {
        logger.log('ADMIN_UI', 'Sending message with audio now (voice:', selectedVoice, ')');

        // Build audioData with only the selected voice
        const audioDataToSave = {
          originalUri: draftAudioData.originalUri,
          transformedUri: draftAudioData.wordAudioSegments[selectedVoice], // Use stored selected voice
          wordTimings: draftAudioData.wordTimings,
          words: draftAudioData.words
        };

        // Save with audio and makeCurrent = true
        updatedData = await saveMessageWithAudio(savedDate, savedMessage, audioDataToSave, true);
      } else {
        logger.log('ADMIN_UI', 'Sending text-only message now');
        // Save text only with makeCurrent = true
        updatedData = await saveMessageToGitHub(savedDate, savedMessage, true);
      }

      // Update local state
      setMessagesData(updatedData);
      setScheduledMessages(updatedData.messages || {});

      logger.log('ADMIN_UI', 'Sent message now for', savedDate);

      // Show success message
      setUploadProgress('success');

      // Clear editing state AFTER successful save
      setScrollToDate(savedDate); // Remember which card to scroll to
      setEditingDate(null);
      setDraftMessage('');
      setDraftAudioData(null);
      setSelectedVoice(null);

      // Wait 1.5 seconds to show success message, then close portal
      // This also gives GitHub time to commit before game reloads
      setTimeout(() => {
        setUploadProgress(null); // Reset progress state
        onClose(); // Close admin portal and return to game
      }, 1500);

    } catch (error) {
      setUploadProgress(null); // Reset progress on error
      logger.error('ADMIN_UI', 'Failed to send message:', error);
      alert('Failed to send message. Please try again.');
      return; // Don't navigate away on error
    }
  };

  // Helper to get local date string in YYYY-MM-DD format (not UTC)
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if editing today's message
  const isEditingToday = () => {
    if (!editingDate) return false;
    const today = getLocalDateString(new Date());
    return editingDate === today;
  };

  // Entrance and exit animation state
  const [isExiting, setIsExiting] = useState(false);
  const portalOpacity = useRef(new Animated.Value(0)).current; // Start invisible for entrance
  const portalTranslateY = useRef(new Animated.Value(50)).current; // Start slightly below for slide-up

  // Entrance animation - fade in and slide up
  useEffect(() => {
    // Animate in on mount
    Animated.parallel([
      Animated.timing(portalOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(portalTranslateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle exit animation - fade out overlay (matches card animation duration)
  useEffect(() => {
    if (isExiting) {
      Animated.parallel([
        Animated.timing(portalOpacity, {
          toValue: 0,
          duration: 500, // Match card exit animation duration
          useNativeDriver: true,
        }),
        Animated.timing(portalTranslateY, {
          toValue: 50,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsExiting(false);
        onClose();
      });
    }
  }, [isExiting]);

  // Handle back button - simple and direct
  const handleBack = () => {
    playSound('back-button');
    logger.log('ADMIN_UI', '🔙 Back pressed. currentView:', currentView, 'editingDate:', editingDate);

    if (currentView === 'confirmation') {
      logger.log('ADMIN_UI', '→ Going to preview');
      setCurrentView('preview');
    } else if (currentView === 'preview') {
      logger.log('ADMIN_UI', '→ Going back to calendar from preview');
      backFromPreview();
    } else if (currentView === 'calendar' && editingDate) {
      logger.log('ADMIN_UI', '→ Collapsing card');
      exitEdit();
    } else if (currentView === 'calendar') {
      logger.log('ADMIN_UI', '→ Closing portal with exit animation');
      playSound('card-slide');
      setIsExiting(true); // Trigger exit animation
    }
  };

  return (
    <Animated.View style={[styles.container, { 
      opacity: portalOpacity,
      transform: [{ translateY: portalTranslateY }],
    }]}>
      {/* Single persistent back button - hide when text editor is open */}
      {!isTextEditorOpen && (
        <Pressable
          onPress={() => {
            playSound('click');
            handleBack();
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={28} color={primaryColor} />
        </Pressable>
      )}
      {/* Calendar View - only render when active */}
      {currentView === 'calendar' && (
        <CalendarView
          scheduledMessages={scheduledMessages}
          onSelectDate={openEdit}
          onPreview={openPreview}
          initialEditingDate={editingDate}
          initialEditingText={draftMessage}
          primaryColor={primaryColor}
          scrollToDate={scrollToDate}
          onScrollComplete={() => setScrollToDate(null)}
          isExiting={isExiting}
          onExitComplete={() => {}} // Handled by Animated.View fade
        />
      )}

      {/* Preview Mode - only render when active */}
      {currentView === 'preview' && (
        <PreviewMode
          message={draftMessage}
          isActive={isEditingToday()}
          onSave={isEditingToday() ? sendNow : saveMessage}
          audioUri={draftAudioUri}
          wordTimings={draftWordTimings}
          wordAudioSegments={draftWordAudioSegments}
          onTextEditorChange={setIsTextEditorOpen}
          primaryColor={primaryColor}
        />
      )}

      {currentView === 'confirmation' && (
        <Confirmation
          onCancel={() => setCurrentView('preview')}
          onConfirm={confirmSendNow}
          uploadProgress={uploadProgress}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 30,
    padding: 24,
    zIndex: 9999,
  },
});
