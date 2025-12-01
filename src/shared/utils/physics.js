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
 * @returns {{x: number, y: number}} - Quantized velocity vector
 */
export function quantizeVelocityAngle(vx, vy, numDirections) {
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
  const quantizedAngle = Math.round(currentAngle / angleStep) * angleStep;

  // Convert back to velocity components
  // Preserve original speed magnitude
  return {
    x: Math.cos(quantizedAngle) * speed,
    y: Math.sin(quantizedAngle) * speed,
  };
}
