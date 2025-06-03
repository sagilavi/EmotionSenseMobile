import { AppState, Platform, NativeModules } from 'react-native';

/**
 * BackgroundAudioManager manages background/foreground transitions for audio recording.
 * Gets: Called from recording logic (e.g., ActivationScreen)
 * Does: Listens to app state changes, requests background audio mode, resumes recording if needed
 * Outputs: Notifies caller when to pause/resume recording, manages background mode
 */
export class BackgroundAudioManager {
  private static appStateListener: any = null;
  private static isBackgroundEnabled = false;
  private static onResumeRecording: (() => void) | null = null;
  private static onPauseRecording: (() => void) | null = null;

  /**
   * Initializes background audio management.
   * Gets: Callbacks for resuming and pausing recording
   * Does: Sets up app state listener, requests background mode if needed
   * Outputs: Calls resume/pause callbacks on state changes
   */
  static init(onResumeRecording: () => void, onPauseRecording: () => void) {
    BackgroundAudioManager.onResumeRecording = onResumeRecording;
    BackgroundAudioManager.onPauseRecording = onPauseRecording;
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
   * Does: Calls pause/resume recording callbacks as needed
   * Outputs: Triggers recording logic in ActivationScreen
   */
  private static handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      if (BackgroundAudioManager.onResumeRecording) BackgroundAudioManager.onResumeRecording();
    } else if (nextAppState === 'background') {
      if (BackgroundAudioManager.onPauseRecording) BackgroundAudioManager.onPauseRecording();
    }
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