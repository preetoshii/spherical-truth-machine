/**
 * Physics utility functions
 * Pure mathematical helpers for game physics
 */

/**
 * Quantize a velocity vector to nearest discrete angle
 * Preserves speed magnitude, only changes direction
 *
 * @param {number} vx - X component of velocity
 * @param {number} vy - Y component of velocity
 * @param {number} numDirections - Number of discrete directions (e.g., 32)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.preventStraightUp - Never allow perfectly vertical (90°) bounces
 * @param {number} options.ballX - Ball X position (required if preventStraightUp)
 * @param {number} options.screenWidth - Screen width (required if preventStraightUp)
 * @returns {{x: number, y: number}} - Quantized velocity vector
 */
export function quantizeVelocityAngle(vx, vy, numDirections, options = {}) {
  // Calculate current speed (magnitude) - we'll preserve this
  const speed = Math.sqrt(vx * vx + vy * vy);

  // Edge case: if ball is stationary, return as-is
  if (speed < 0.01) {
    return { x: vx, y: vy };
  }

  // Calculate current angle in radians
  // atan2 handles all quadrants correctly: atan2(y, x)
  const currentAngle = Math.atan2(vy, vx);

  // Calculate angle step size
  // For 32 directions: 2π / 32 = 0.196 radians ≈ 11.25°
  const angleStep = (Math.PI * 2) / numDirections;

  // Snap to nearest discrete angle
  // Round to nearest multiple of angleStep
  let quantizedAngle = Math.round(currentAngle / angleStep) * angleStep;

  // Prevent straight up bounces if enabled
  if (options.preventStraightUp) {
    const straightUp = Math.PI / 2; // 90° in radians
    const tolerance = 0.001; // Very small tolerance for floating point comparison

    // Check if quantized angle IS straight up (90°)
    // We need a tight tolerance because we're checking the exact quantized value
    if (Math.abs(quantizedAngle - straightUp) < tolerance) {
      // Determine which direction to bias based on ball position
      const screenCenter = options.screenWidth / 2;
      const ballIsLeftOfCenter = options.ballX < screenCenter;

      // Bias toward screen center
      // If ball is left of center, angle should be toward right (less than 90°)
      // If ball is right of center, angle should be toward left (more than 90°)
      if (ballIsLeftOfCenter) {
        // Angle toward right: 90° - angleStep
        quantizedAngle = straightUp - angleStep;
      } else {
        // Angle toward left: 90° + angleStep
        quantizedAngle = straightUp + angleStep;
      }
    }
  }

  // Convert back to velocity components
  // Preserve original speed magnitude
  return {
    x: Math.cos(quantizedAngle) * speed,
    y: Math.sin(quantizedAngle) * speed,
  };
}
