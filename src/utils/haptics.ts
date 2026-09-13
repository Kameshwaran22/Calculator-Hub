// Haptic feedback utility using the Web Vibration API for tactile slider and button interactions

let lastVibrateTime = 0;

/**
 * Triggers a short, subtle haptic vibration pulse.
 * Uses a throttle to prevent overwhelming the device vibration motor during rapid slider dragging.
 *
 * @param durationMs Duration of the vibration pulse in milliseconds (default: 8ms for subtle tick)
 * @param throttleMs Minimum interval between haptic triggers in milliseconds (default: 35ms)
 */
export function triggerSliderHaptic(durationMs: number = 8, throttleMs: number = 35): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      const now = performance.now();
      if (now - lastVibrateTime >= throttleMs) {
        lastVibrateTime = now;
        navigator.vibrate(durationMs);
      }
    }
  } catch {
    // Gracefully ignore devices/browsers that do not support or allow Vibration API
  }
}

/**
 * Single crisp haptic tap for discrete controls (e.g. +/- steppers, toggles)
 */
export function triggerTapHaptic(durationMs: number = 12): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      lastVibrateTime = performance.now();
      navigator.vibrate(durationMs);
    }
  } catch {
    // Gracefully ignore
  }
}
