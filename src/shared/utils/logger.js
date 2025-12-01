import { config } from '../../config.js';

/**
 * Conditional logging utility
 * Only logs if the feature category is enabled in config.logs
 */

export const logger = {
  /**
   * Log a message if category is enabled
   * @param {string} category - Log category (e.g., 'PHYSICS', 'AUDIO_PLAYBACK')
   * @param {...any} args - Arguments to pass to console.log
   */
  log(category, ...args) {
    if (config.logs && config.logs[category]) {
      console.log(...args);
    }
  },

  /**
   * Log a warning if category is enabled
   * @param {string} category - Log category
   * @param {...any} args - Arguments to pass to console.warn
   */
  warn(category, ...args) {
    if (config.logs && config.logs[category]) {
      console.warn(...args);
    }
  },

  /**
   * Log an error if category is enabled
   * @param {string} category - Log category
   * @param {...any} args - Arguments to pass to console.error
   */
  error(category, ...args) {
    if (config.logs && config.logs[category]) {
      console.error(...args);
    }
  },

  /**
   * Always log (for critical errors that should never be suppressed)
   * @param {...any} args - Arguments to pass to console.error
   */
  always(...args) {
    console.error(...args);
  }
};
