import { NativeModules, Platform } from 'react-native';

/**
 * AudioFocusManager handles audio focus and microphone lock for recording.
 * Gets: Called from recording logic (e.g., ActivationScreen)
 * Does: Requests exclusive, transient audio focus, detects mic lock, and resumes recording when available
 * Outputs: Notifies caller when recording can start/should pause, handles resume
 */
export class AudioFocusManager {
  private static isMicLocked = false;
  private static resumeCallback: (() => void) | null = null;
  private static retryTimeout: any = null;

  /**
   * Requests exclusive, transient audio focus for recording.
   * Gets: Callback to start recording, callback to pause recording
   * Does: Tries to start recording, catches mic-in-use errors, retries when available
   * Outputs: Calls start/pause callbacks as needed
   */
  static async requestAudioFocus(
    startRecording: () => Promise<void>,
    pauseRecording: () => Promise<void>
  ) {
    try {
      // Try to start recording
      await startRecording();
      AudioFocusManager.isMicLocked = false;
    } catch (e: any) {
      // If mic is in use, pause and retry
      if (AudioFocusManager.isMicrophoneInUseError(e)) {
        AudioFocusManager.isMicLocked = true;
        await pauseRecording();
        AudioFocusManager.retryWhenMicFree(startRecording);
      } else {
        throw e;
      }
    }
  }

  /**
   * Checks if the error is a microphone-in-use error.
   * Gets: Error object
   * Does: Inspects error message/code for mic-in-use
   * Outputs: true if mic is in use, false otherwise
   */
  static isMicrophoneInUseError(e: any): boolean {
    if (!e) return false;
    const msg = e.message || e.toString();
    return (
      msg.includes('Another app is using the microphone') ||
      msg.includes('unable to start a new recording') ||
      msg.includes('resource busy') ||
      msg.includes('already recording')
    );
  }

  /**
   * Retries starting recording when the microphone becomes available.
   * Gets: Callback to start recording
   * Does: Polls every 2 seconds until mic is free, then resumes
   * Outputs: Calls startRecording when mic is available
   */
  static retryWhenMicFree(startRecording: () => Promise<void>) {
    if (AudioFocusManager.retryTimeout) clearTimeout(AudioFocusManager.retryTimeout);
    AudioFocusManager.retryTimeout = setTimeout(async () => {
      try {
        await startRecording();
        AudioFocusManager.isMicLocked = false;
      } catch (e: any) {
        if (AudioFocusManager.isMicrophoneInUseError(e)) {
          AudioFocusManager.isMicLocked = true;
          AudioFocusManager.retryWhenMicFree(startRecording);
        } else {
          throw e;
        }
      }
    }, 2000);
  }

  /**
   * Cancels any pending retry for audio focus.
   * Gets: Called from cleanup logic
   * Does: Clears retry timeout
   * Outputs: None
   */
  static cancelRetry() {
    if (AudioFocusManager.retryTimeout) clearTimeout(AudioFocusManager.retryTimeout);
    AudioFocusManager.retryTimeout = null;
  }
} 