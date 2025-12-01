/**
 * Progress Storage Service
 * Manages universal progress persistence in localStorage
 * Progress is stored as a value between 0 and 1 (0% to 100%)
 */

const STORAGE_KEY = 'spherical-truth-machine-progress';

/**
 * Get current progress from localStorage
 * @returns {number} Progress value between 0 and 1
 */
export function getProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return 0;
    }
    const progress = parseFloat(stored);
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, progress));
  } catch (error) {
    // Handle localStorage errors (private browsing, quota exceeded, etc.)
    console.warn('Failed to read progress from localStorage:', error);
    return 0;
  }
}

/**
 * Set progress in localStorage
 * @param {number} value - Progress value between 0 and 1
 */
export function setProgress(value) {
  try {
    // Clamp between 0 and 1
    const clamped = Math.max(0, Math.min(1, value));
    localStorage.setItem(STORAGE_KEY, clamped.toString());
  } catch (error) {
    // Handle localStorage errors (private browsing, quota exceeded, etc.)
    console.warn('Failed to save progress to localStorage:', error);
  }
}

/**
 * Add progress to current stored progress
 * @param {number} amount - Amount to add (will be clamped so result is between 0 and 1)
 * @returns {number} The new progress value after adding
 */
export function addProgress(amount) {
  try {
    const current = getProgress();
    const newProgress = Math.max(0, Math.min(1, current + amount));
    setProgress(newProgress);
    return newProgress;
  } catch (error) {
    console.warn('Failed to add progress to localStorage:', error);
    return getProgress();
  }
}

