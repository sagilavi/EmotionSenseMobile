import BackgroundTimer from 'react-native-background-timer';

/**
 * BackgroundRecordingManager handles interval-based recording that continues in background.
 * Gets: Called from ActivationScreen to start/stop background recording intervals
 * Does: Uses react-native-background-timer to schedule recordings that work in background
 * Outputs: Calls recording callbacks at specified intervals, even when app is backgrounded
 */
export class BackgroundRecordingManager {
  private static intervalId: number | null = null;
  private static isRunning = false;
  private static onStartRecording: (() => Promise<void>) | null = null;

  /**
   * Initializes and starts background interval recording.
   * Gets: Callback function to start recording, frequency in milliseconds from ActivationScreen
   * Does: Sets up background timer that calls recording function at intervals, prevents multiple timers
   * Outputs: Starts timer that will trigger recordings even in background, returns success boolean
   */
  static startBackgroundRecording(
    recordingCallback: () => Promise<void>,
    frequencyMs: number
  ): boolean {
    try {
      // Prevent multiple timers - follow safe practices
      if (BackgroundRecordingManager.isRunning) {
        console.log('[BackgroundRecordingManager] Already running, skipping start');
        return true;
      }

      // Validate inputs - defensive programming
      if (!recordingCallback || frequencyMs <= 0) {
        console.error('[BackgroundRecordingManager] Invalid parameters');
        return false;
      }

      BackgroundRecordingManager.onStartRecording = recordingCallback;
      BackgroundRecordingManager.isRunning = true;

      console.log('[BackgroundRecordingManager] Starting background recording timer with frequency:', frequencyMs);

      // Start first recording immediately - user expectation
      BackgroundRecordingManager.executeRecording();

      // Schedule recurring recordings using background timer - core functionality
      BackgroundRecordingManager.intervalId = BackgroundTimer.setInterval(() => {
        BackgroundRecordingManager.executeRecording();
      }, frequencyMs);

      console.log('[BackgroundRecordingManager] Background timer started successfully');
      return true;
    } catch (error) {
      console.error('[BackgroundRecordingManager] Failed to start background recording:', error);
      BackgroundRecordingManager.isRunning = false;
      return false;
    }
  }

  /**
   * Executes a single recording attempt with error handling.
   * Gets: Uses stored recording callback from startBackgroundRecording method
   * Does: Safely calls the recording function with try/catch to prevent crashes
   * Outputs: Triggers recording or logs error if recording fails, continues running
   */
  private static async executeRecording(): Promise<void> {
    try {
      if (BackgroundRecordingManager.onStartRecording) {
        console.log('[BackgroundRecordingManager] Executing scheduled recording');
        await BackgroundRecordingManager.onStartRecording();
      }
    } catch (error) {
      console.error('[BackgroundRecordingManager] Recording execution failed:', error);
      // Continue running even if one recording fails - resilient design
    }
  }

  /**
   * Stops the background recording timer and cleans up all resources.
   * Gets: Called from ActivationScreen when analysis is stopped or on cleanup
   * Does: Clears background timer, resets state, prevents memory leaks
   * Outputs: Stops all background recording activity, logs success/failure
   */
  static stopBackgroundRecording(): void {
    try {
      console.log('[BackgroundRecordingManager] Stopping background recording timer');

      if (BackgroundRecordingManager.intervalId !== null) {
        BackgroundTimer.clearInterval(BackgroundRecordingManager.intervalId);
        BackgroundRecordingManager.intervalId = null;
      }

      BackgroundRecordingManager.isRunning = false;
      BackgroundRecordingManager.onStartRecording = null;

      console.log('[BackgroundRecordingManager] Background timer stopped successfully');
    } catch (error) {
      console.error('[BackgroundRecordingManager] Failed to stop background recording:', error);
    }
  }

  /**
   * Checks if background recording is currently active.
   * Gets: Called from other components to check current status
   * Does: Returns current running state without side effects
   * Outputs: Boolean indicating if background recording is active
   */
  static isBackgroundRecordingActive(): boolean {
    return BackgroundRecordingManager.isRunning;
  }

  /**
   * Updates the recording frequency without restarting if not running.
   * Gets: New frequency in milliseconds from UI updates
   * Does: Safely restarts timer with new frequency if currently running
   * Outputs: Updates frequency and restarts timer if needed, returns success boolean
   */
  static updateFrequency(newFrequencyMs: number): boolean {
    try {
      if (BackgroundRecordingManager.isRunning && BackgroundRecordingManager.onStartRecording) {
        console.log('[BackgroundRecordingManager] Updating frequency to:', newFrequencyMs);
        const callback = BackgroundRecordingManager.onStartRecording;
        BackgroundRecordingManager.stopBackgroundRecording();
        return BackgroundRecordingManager.startBackgroundRecording(callback, newFrequencyMs);
      }
      return true;
    } catch (error) {
      console.error('[BackgroundRecordingManager] Failed to update frequency:', error);
      return false;
    }
  }
} 