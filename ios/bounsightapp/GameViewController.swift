import UIKit

/**
 * Custom ViewController that defers iOS system edge gestures to prevent interference with game swipes.
 * 
 * This is critical for the game because players draw "Gelatos" (springboards) by swiping
 * from the edges of the screen. Without gesture deferral, iOS's edge-swipe gestures
 * (back navigation, home indicator swipe, control center, etc.) would interfere with gameplay.
 * 
 * What this does:
 * - Defers system gestures on all edges (top, bottom, left, right)
 * - Allows the game to handle edge swipes before the system does
 * - Prevents accidental exits or interruptions during gameplay
 * 
 * iOS system gestures that are deferred:
 * - Left edge swipe: Back navigation (in navigation controllers)
 * - Bottom edge swipe: Home indicator gesture (on newer iPhones)
 * - Top edge swipe: Control center / notification center
 * - Right edge swipe: App switcher (on some devices)
 */
class GameViewController: UIViewController {
  
  /**
   * Defer system gestures on all screen edges to prevent interference with game swipes.
   * 
   * This tells iOS to let our app handle edge swipes first, only falling back to
   * system gestures if our app doesn't handle them. This is perfect for a game
   * where edge swipes are part of the gameplay.
   */
  override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge {
    return [.top, .bottom, .left, .right]
  }
}

