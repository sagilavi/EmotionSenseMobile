import { AppState, Platform, NativeModules } from 'react-native';

/**
 * BackgroundAudioManager manages background/foreground transitions for audio recording.
 * Gets: Called from recording logic (e.g., ActivationScreen)
 * Does: Listens to app state changes, requests background audio mode, resumes recording if needed
 * Outputs: Notifies caller when to resume recording, manages background mode
 *
 * Note: As of latest update, this manager does NOT pause recording when the app goes to background.
 * Recording continues in the background unless the microphone is taken by another app (handled by AudioFocusManager).
 */
export class BackgroundAudioManager {
  private static appStateListener: any = null;
  private static isBackgroundEnabled = false;
  private static onResumeRecording: (() => void) | null = null;
  // onPauseRecording is kept for API compatibility but not used
  private static onPauseRecording: (() => void) | null = null;

  /**
   * Initializes background audio management.
   * Gets: Callback for resuming recording (onResumeRecording), callback for pausing (not used)
   * Does: Sets up app state listener, requests background mode if needed
   * Outputs: Calls resume callback on state changes
   */
  static init(onResumeRecording: () => void, onPauseRecording: () => void) {
    BackgroundAudioManager.onResumeRecording = onResumeRecording;
    BackgroundAudioManager.onPauseRecording = onPauseRecording; // Not used
    if (BackgroundAudioManager.appStateListener) return;
    BackgroundAudioManager.appStateListener = AppState.addEventListener('change', BackgroundAudioManager.handleAppStateChange);
    if (Platform.OS === 'ios') {
      BackgroundAudioManager.enableIOSBackgroundAudio();
    }
    if (Platform.OS === 'android') {
      BackgroundAudioManager.enableAndroidForegroundService();
    }
  }

  /**
   * Handles app state changes (foreground/background).
   * Gets: New app state from AppState
   * Does: Calls resume recording callback as needed (does NOT pause on background)
   * Outputs: Triggers recording logic in ActivationScreen only on foreground
   */
  private static handleAppStateChange = (nextAppState: string) => {
    console.log('[BackgroundAudioManager] App state changed:', nextAppState);
    // Only resume on foreground, do NOT pause on background
    if (nextAppState === 'active') {
      if (BackgroundAudioManager.onResumeRecording) BackgroundAudioManager.onResumeRecording();
    }
    // Do NOT pause on background anymore
    // else if (nextAppState === 'background') {
    //   if (BackgroundAudioManager.onPauseRecording) BackgroundAudioManager.onPauseRecording();
    // }
  };

  /**
   * Enables background audio mode on iOS (requires Info.plist setup).
   * Gets: Called during init on iOS
   * Does: Requests background audio mode from native module (if available)
   * Outputs: Enables background audio for recording
   */
  private static enableIOSBackgroundAudio() {
    // Requires: Info.plist -> UIBackgroundModes: ["audio"]
    // Optionally, call a native module to activate background audio session
    if (NativeModules.BackgroundAudioModule && NativeModules.BackgroundAudioModule.enable) {
      console.log('[BackgroundAudioManager] Enabling iOS background audio mode');
      NativeModules.BackgroundAudioModule.enable();
    }
  }

  /**
   * Enables foreground service for background audio on Android (requires manifest setup).
   * Gets: Called during init on Android
   * Does: Requests foreground service from native module (if available)
   * Outputs: Enables background audio for recording
   */
  private static enableAndroidForegroundService() {
    // Requires: AndroidManifest.xml -> foreground service permission and service
    // Optionally, call a native module to start foreground service
    if (NativeModules.ForegroundServiceModule && NativeModules.ForegroundServiceModule.start) {
      console.log('[BackgroundAudioManager] Starting Android foreground service for background audio');
      NativeModules.ForegroundServiceModule.start();
    }
  }

  /**
   * Cleans up listeners and disables background mode.
   * Gets: Called from cleanup logic
   * Does: Removes app state listener
   * Outputs: None
   */
  static cleanup() {
    if (BackgroundAudioManager.appStateListener) {
      BackgroundAudioManager.appStateListener.remove();
      BackgroundAudioManager.appStateListener = null;
    }
    BackgroundAudioManager.onResumeRecording = null;
    BackgroundAudioManager.onPauseRecording = null;
  }
} 