/**
 * GitHub API integration for messages.json
 * Handles reading and writing message data to GitHub repository
 */

import { logger } from '../utils/logger.js';

// GitHub configuration
const GITHUB_CONFIG = {
  owner: 'preetoshii', // GitHub username
  repo: 'spherical-truth-machine',
  branch: 'master',
  filePath: 'messages.json',
  token: process.env.EXPO_PUBLIC_GITHUB_TOKEN || null, // Load from environment variable
};

/**
 * Fetch messages.json from GitHub
 * @returns {Promise<Object>} { current, messages }
 */
export async function fetchMessages() {
  const { owner, repo, filePath, token } = GITHUB_CONFIG;

  if (!token) {
    logger.warn('GITHUB_API', 'No GitHub token found. Using local fallback.');
    // Fallback: try to fetch from local server (for development)
    try {
      const response = await fetch('/messages.json');
      if (!response.ok) throw new Error('Local fetch failed');
      return await response.json();
    } catch (error) {
      logger.error('GITHUB_API', 'Failed to fetch messages locally:', error);
      // Return default fallback
      return {
        current: new Date().toISOString().split('T')[0],
        messages: {}
      };
    }
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // GitHub returns base64-encoded content
    const decodedContent = atob(data.content);
    const messagesData = JSON.parse(decodedContent);

    // Store SHA for future updates
    messagesData._sha = data.sha;

    return messagesData;
  } catch (error) {
    logger.error('GITHUB_API', 'Failed to fetch messages from GitHub:', error);
    throw error;
  }
}

/**
 * Update messages.json on GitHub
 * @param {Object} messagesData - { current, messages }
 * @param {string} commitMessage - Commit message
 * @returns {Promise<Object>} Updated data with new SHA
 */
export async function updateMessages(messagesData, commitMessage = 'Update messages') {
  const { owner, repo, filePath, token } = GITHUB_CONFIG;

  if (!token) {
    logger.error('GITHUB_API', 'No GitHub token found. Cannot update messages.');
    throw new Error('GitHub token required for updates');
  }

  try {
    // Extract SHA if it exists (needed for updates)
    const sha = messagesData._sha;

    // Remove SHA from data before encoding (don't want it in the file)
    const { _sha, ...cleanData } = messagesData;

    // Encode content as base64
    const content = btoa(JSON.stringify(cleanData, null, 2));

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: content,
        sha: sha, // Required for updates
        branch: GITHUB_CONFIG.branch,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Return updated data with new SHA
    return {
      ...cleanData,
      _sha: result.content.sha,
    };
  } catch (error) {
    logger.error('GITHUB_API', 'Failed to update messages on GitHub:', error);
    throw error;
  }
}

/**
 * Get current message (convenience function)
 * @returns {Promise<Object>} { text, words }
 */
export async function getCurrentMessage() {
  try {
    const data = await fetchMessages();
    const currentDate = data.current;
    const currentMessage = data.messages[currentDate];

    if (!currentMessage) {
      logger.warn('GITHUB_API', `No message found for current date: ${currentDate}`);
      return null;
    }

    return currentMessage;
  } catch (error) {
    logger.error('GITHUB_API', 'Failed to get current message:', error);
    return null;
  }
}

/**
 * Update a specific date's message
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} text - Message text
 * @returns {Promise<Object>} Updated messages data
 */
export async function updateMessageForDate(date, text) {
  try {
    // Fetch current data
    const messagesData = await fetchMessages();

    // Split text into words
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);

    // Update message for the date
    messagesData.messages[date] = { text, words };

    // Save back to GitHub
    const updated = await updateMessages(
      messagesData,
      `Update message for ${date}`
    );

    return updated;
  } catch (error) {
    logger.error('GITHUB_API', `Failed to update message for ${date}:`, error);
    throw error;
  }
}

/**
 * Set current active message date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Updated messages data
 */
export async function setCurrentDate(date) {
  try {
    // Fetch current data
    const messagesData = await fetchMessages();

    // Update current date
    messagesData.current = date;

    // Save back to GitHub
    const updated = await updateMessages(
      messagesData,
      `Set current message to ${date}`
    );

    return updated;
  } catch (error) {
    logger.error('GITHUB_API', `Failed to set current date to ${date}:`, error);
    throw error;
  }
}

/**
 * Save a message and optionally make it current (Send Now)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} text - Message text
 * @param {boolean} makeCurrent - Whether to set as current message
 * @returns {Promise<Object>} Updated messages data
 */
export async function saveMessage(date, text, makeCurrent = false) {
  // Validation: Prevent saving invalid data
  if (!date || date === 'null' || date === 'undefined') {
    const error = new Error(`Invalid date: "${date}". Cannot save message.`);
    logger.error('GITHUB_API', error);
    throw error;
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    const error = new Error(`Invalid message text: "${text}". Cannot save empty message.`);
    logger.error('GITHUB_API', error);
    throw error;
  }

  try {
    // Fetch current data
    const messagesData = await fetchMessages();

    // Split text into words
    const words = text.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0);

    // Additional check: ensure we have words after processing
    if (words.length === 0) {
      const error = new Error(`Message contains no valid words: "${text}"`);
      logger.error('GITHUB_API', error);
      throw error;
    }

    // Update message for the date
    messagesData.messages[date] = { text, words };

    // If makeCurrent, also update the current date pointer
    if (makeCurrent) {
      messagesData.current = date;
    }

    // Save back to GitHub
    const commitMsg = makeCurrent
      ? `Send message now: ${date}`
      : `Schedule message for ${date}`;

    const updated = await updateMessages(messagesData, commitMsg);

    return updated;
  } catch (error) {
    logger.error('GITHUB_API', `Failed to save message for ${date}:`, error);
    throw error;
  }
}

/**
 * Generate audio filename from message text
 * @param {string} text - Message text
 * @param {string} audioType - 'original' or 'transformed'
 * @returns {Promise<string>} - Filename (e.g., "25-10-2025-you-are-braver-original.m4a")
 */
async function generateAudioFilename(text, audioType) {
  const { config } = await import('../../config.js');

  // Get date in DD-MM-YYYY format
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  // Extract first 3 words (lowercase, alphanumeric only)
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Remove special chars
    .filter(word => word.length > 0)
    .slice(0, 3);

  const wordsStr = words.join('-');

  // Build base filename
  const ext = audioType === 'original' ? 'm4a' : 'mp3';
  const baseFilename = `${dateStr}-${wordsStr}-${audioType}.${ext}`;

  // Check for duplicates and append -2, -3, etc.
  const { owner, repo, token } = GITHUB_CONFIG;
  const audioFolder = config.github.audioFolder;

  let filename = baseFilename;
  let counter = 2;

  while (true) {
    const checkPath = `${audioFolder}${filename}`;
    const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${checkPath}`;

    try {
      const response = await fetch(checkUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        // File doesn't exist - we can use this filename
        break;
      }

      // File exists - try next counter
      filename = `${dateStr}-${wordsStr}-${counter}-${audioType}.${ext}`;
      counter++;
    } catch (error) {
      // Error checking - assume file doesn't exist
      break;
    }
  }

  return filename;
}

/**
 * Upload audio file to GitHub
 * @param {string} filename - Filename (generated by generateAudioFilename)
 * @param {Blob} audioBlob - Audio file data
 * @returns {Promise<string>} - Filename in repo
 */
async function uploadAudioFile(filename, audioBlob) {
  const { config } = await import('../../config.js');
  const { owner, repo, branch, token } = GITHUB_CONFIG;

  if (!token) {
    throw new Error('GitHub token required for audio uploads');
  }

  // Build full file path
  const audioFolder = config.github.audioFolder;
  const filePath = `${audioFolder}${filename}`;

  // Check if file exists (get SHA for overwrite)
  let existingSha = null;
  try {
    const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (checkResponse.ok) {
      const data = await checkResponse.json();
      existingSha = data.sha;
    }
  } catch (e) {
    // File doesn't exist yet
  }

  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Content = btoa(binary);

  // Upload to GitHub
  const uploadUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Upload audio: ${filename}`,
      content: base64Content,
      sha: existingSha,
      branch
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to upload audio: ${errorData.message}`);
  }

  logger.log('GITHUB_API', `✓ Uploaded audio: ${filename}`);
  return filename; // Return just filename, not full path
}

/**
 * Save message with audio files and word timings
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} text - Message text
 * @param {Object} audioData - { originalUri, transformedUri, wordTimings, words }
 * @param {boolean} makeCurrent - Set as active message
 * @returns {Promise<Object>} - Updated messages data
 */
export async function saveMessageWithAudio(date, text, audioData, makeCurrent = false) {
  // Validation
  if (!date || date === 'null') {
    throw new Error(`Invalid date: "${date}"`);
  }
  if (!text || text.trim().length === 0) {
    throw new Error('Message text cannot be empty');
  }
  if (!audioData || !audioData.originalUri) {
    throw new Error('Audio data is required (at minimum, originalUri)');
  }

  try {
    logger.log('GITHUB_API', 'Starting audio upload process...');

    // 1. Generate filenames based on message text
    const originalFilename = await generateAudioFilename(text, 'original');
    const transformedFilename = await generateAudioFilename(text, 'transformed');

    // 2. Upload original audio (required)
    const originalResponse = await fetch(audioData.originalUri);
    const originalBlob = await originalResponse.blob();
    await uploadAudioFile(originalFilename, originalBlob);

    // 3. Upload transformed audio (optional)
    let transformedUploaded = false;
    if (audioData.transformedUri) {
      try {
        const transformedResponse = await fetch(audioData.transformedUri);
        const transformedBlob = await transformedResponse.blob();
        await uploadAudioFile(transformedFilename, transformedBlob);
        transformedUploaded = true;
      } catch (error) {
        logger.warn('GITHUB_API', 'Failed to upload transformed audio (continuing with original):', error);
        // Continue - we have original audio
      }
    }

    // 4. Fetch current messages.json
    const messagesData = await fetchMessages();

    // 5. Build message object
    const messageObj = {
      text: text.trim(),
      words: audioData.words,
      audio: {
        original: originalFilename  // Store just filename
      },
      wordTimings: audioData.wordTimings
    };

    // Add transformed filename only if upload succeeded
    if (transformedUploaded) {
      messageObj.audio.transformed = transformedFilename;
    }

    // 6. Update messages data
    messagesData.messages[date] = messageObj;

    if (makeCurrent) {
      messagesData.current = date;
    }

    // 7. Save to GitHub
    const commitMsg = makeCurrent
      ? `Send message with audio now: ${date}`
      : `Schedule message with audio for ${date}`;

    const updated = await updateMessages(messagesData, commitMsg);

    logger.log('GITHUB_API', '✓ Message with audio saved successfully');
    return updated;
  } catch (error) {
    logger.error('GITHUB_API', 'Failed to save message with audio:', error);
    throw error;
  }
}
