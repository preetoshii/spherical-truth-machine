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
 * @param {boolean} options.preventStraightUp - Offset angle grid so 90° is never an allowed angle
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

  // Rotate angle grid to prevent straight-up (90°) bounces
  // When enabled, shifts grid by half step so 90° falls between two allowed angles
  // Example with 32 dirs: normal grid has 90° as allowed angle, rotated grid has 84.375° and 95.625° instead
  const angleOffset = options.preventStraightUp ? angleStep / 2 : 0;

  // Snap to nearest discrete angle
  // Round to nearest multiple of angleStep, with optional offset
  const quantizedAngle = Math.round((currentAngle - angleOffset) / angleStep) * angleStep + angleOffset;

  // Convert back to velocity components
  // Preserve original speed magnitude
  return {
    x: Math.cos(quantizedAngle) * speed,
    y: Math.sin(quantizedAngle) * speed,
  };
}
