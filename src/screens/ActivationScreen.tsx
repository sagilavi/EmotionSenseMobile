import React, { useState, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Title, RadioButton, TextInput, Divider } from 'react-native-paper';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useRecordings } from '../context/RecordingsContext';
import { useFeatures } from '../context/RecordingsContext';
import { extractAcousticFeatures } from '../featureExtraction';
import { AudioFocusManager } from '../AudioFocusManager';
import { BackgroundAudioManager } from '../BackgroundAudioManager';

const audioRecorderPlayer = new AudioRecorderPlayer();

// Ref to track if a recording is currently in progress
const isRecordingRef = { current: false };

/**
 * Gets microphone permission from the OS.
 * Called before starting a recording to ensure permissions are granted.
 * Returns true if permission is granted, false otherwise.
 */
const getMicrophonePermission = async () => {
  const micPerm = Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  });
  let result = await check(micPerm!);
  if (result !== RESULTS.GRANTED) {
    result = await request(micPerm!);
  }
  return result === RESULTS.GRANTED;
};

/**
 * Gets background audio permission (Android only).
 * Called before starting a recording to ensure permissions are granted.
 * Returns true if permission is granted, false otherwise.
 */
const getBackgroundAudioPermission = async () => {
  if (Platform.OS === 'android') {
    const bgPerm = PERMISSIONS.ANDROID.RECORD_AUDIO;
    let result = await check(bgPerm);
    if (result !== RESULTS.GRANTED) {
      result = await request(bgPerm);
    }
    return result === RESULTS.GRANTED;
  }
  // iOS: background audio requires Info.plist setup
  return true;
};

const ActivationScreen: React.FC = () => {
  // State and refs for recording and scheduling
  const [analyzing, setAnalyzing] = useState(false);
  const [frequency, setFrequency] = useState('5');
  const [customFrequency, setCustomFrequency] = useState('');
  const [duration, setDuration] = useState('20');
  const [customDuration, setCustomDuration] = useState('');
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentFileRef = useRef<string | null>(null);
  const { addRecording } = useRecordings();
  const { addFeatures } = useFeatures();

  /**
   * Gets the frequency (interval) for scheduled recordings in ms.
   * Reads from frequency state (user input).
   * Returns frequency in milliseconds.
   */
  const getFreq = () => parseInt(frequency === 'custom' ? customFrequency : frequency, 10) * 60 * 1000;

  /**
   * Gets the duration for each recording in ms.
   * Reads from duration state (user input).
   * Returns duration in milliseconds.
   */
  const getDur = () => parseInt(duration === 'custom' ? customDuration : duration, 10) * 1000;

  /**
   * Attempts to start a new audio recording, handling microphone lock gracefully.
   * Gets: Called from scheduleRecording or handleStartPause
   * Does: Uses AudioFocusManager to request focus and retry if mic is busy
   * Outputs: Starts recording or waits and resumes when mic is free
   */
  const tryStartRecordingWithFocus = async () => {
    await AudioFocusManager.requestAudioFocus(startRecording, pauseRecording);
  };

  /**
   * Pauses the recording process (used when mic is locked by another app or app goes to background).
   * Gets: Called by AudioFocusManager or BackgroundAudioManager
   * Does: Stops the current recording if any
   * Outputs: Ensures no recording is running
   */
  const pauseRecording = async () => {
    if (!isRecordingRef.current) return;
    try {
      await audioRecorderPlayer.stopRecorder();
      isRecordingRef.current = false;
    } catch (e) {
      // Silently ignore errors
    }
  };

  /**
   * Starts a new audio recording and schedules stop after duration.
   * Gets: Called from scheduleRecording or background/foreground transitions.
   * Does: Starts recording only if not already recording.
   * Outputs: Updates isRecordingRef and schedules stop.
   */
  const startRecording = async () => {
    if (isRecordingRef.current) return;
    try {
      console.log('[Recording] startRecording called');
      const now = new Date();
      const fileName = `sound_${now.getTime()}.mp4`;
      const filePath =
        Platform.OS === 'android'
          ? `/data/user/0/com.emotionsensemobile/cache/${fileName}`
          : fileName;
      currentFileRef.current = filePath;
      startTimeRef.current = Date.now();
      await audioRecorderPlayer.startRecorder(filePath);
      isRecordingRef.current = true;
      console.log('[Recording] Recording started:', filePath);
      timeoutRef.current = setTimeout(async () => {
        await stopRecording();
      }, getDur());
    } catch (e) {
      console.log('[Recording] Failed to start recording', e);
      // Silently ignore errors to prevent warning spam
    }
  };

  /**
   * Stops the current audio recording, saves recording info, and extracts features.
   * Gets: Called after duration or when user stops analysis.
   * Does: Stops recording only if currently recording.
   * Outputs: Updates isRecordingRef, adds recording/features.
   */
  const stopRecording = async () => {
    if (!isRecordingRef.current) return;
    try {
      console.log('[Recording] stopRecording called');
      const result = await audioRecorderPlayer.stopRecorder();
      isRecordingRef.current = false;
      if (result && currentFileRef.current) {
        const now = new Date();
        const endTime = Date.now();
        const length = endTime - startTimeRef.current;
        const recordingItem = {
          path: currentFileRef.current,
          length,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
        };
        addRecording(recordingItem);
        // --- Feature Extraction Integration ---
        // 1. Create a File object from the path (for now, use dummy data)
        // 2. Call extractAcousticFeatures and addFeatures
        // TODO: Replace with actual file reading logic if needed
        const dummyFile = { name: recordingItem.path.split('/').pop() || '', arrayBuffer: async () => new ArrayBuffer(0) } as File;
        const features = await extractAcousticFeatures(dummyFile);
        if (features) {
          addFeatures(features);
        }
        // --- End Feature Extraction ---
        currentFileRef.current = null;
        console.log('[Recording] Recording stopped and features extracted:', recordingItem.path);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } catch (e) {
      console.log('[Recording] Failed to stop recording', e);
      // Silently ignore errors to prevent warning spam
    }
  };

  /**
   * Schedules recurring recordings at the selected frequency.
   * Called when user starts analysis.
   * No output, but sets up interval for startRecording.
   */
  const scheduleRecording = () => {
    tryStartRecordingWithFocus();
    intervalRef.current = setInterval(() => {
      tryStartRecordingWithFocus();
    }, getFreq());
  };

  /**
   * Clears any scheduled recordings and timeouts.
   * Called when user pauses analysis or on unmount.
   * No output, but clears intervals and timeouts.
   */
  const clearRecordingSchedule = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  /**
   * Handles start/pause button press for analysis.
   * Called from UI button.
   * Starts or pauses analysis and manages permissions.
   */
  const handleStartPause = async () => {
    if (!analyzing) {
      if (!hasAskedPermission) {
        const micGranted = await getMicrophonePermission();
        const bgGranted = await getBackgroundAudioPermission();
        setHasAskedPermission(true);
        if (!micGranted || !bgGranted) {
          alert('Microphone and background audio permissions are required.');
          return;
        }
      }
      setAnalyzing(true);
      // Initialize background audio management
      BackgroundAudioManager.init(tryStartRecordingWithFocus, pauseRecording);
      scheduleRecording();
    } else {
      setAnalyzing(false);
      clearRecordingSchedule();
      stopRecording();
      BackgroundAudioManager.cleanup();
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearRecordingSchedule();
      stopRecording();
      AudioFocusManager.cancelRetry();
      BackgroundAudioManager.cleanup();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Title style={styles.header}>Start Emotion Tracking</Title>
      <Button mode="contained" onPress={handleStartPause} style={styles.cta}>
        {analyzing ? 'Pause Analysis' : 'Start Analyzing'}
      </Button>
      <Divider style={{ marginVertical: 16 }} />
      <Text style={styles.label}>Analysis Frequency (minutes):</Text>
      <RadioButton.Group onValueChange={setFrequency} value={frequency}>
        <View style={styles.radioRow}>
          <RadioButton value="5" /><Text>5</Text>
          <RadioButton value="12" /><Text>12</Text>
          <RadioButton value="25" /><Text>25</Text>
          <RadioButton value="custom" /><Text>Custom</Text>
        </View>
      </RadioButton.Group>
      {frequency === 'custom' && (
        <TextInput
          label="Custom Frequency (min)"
          value={customFrequency}
          onChangeText={setCustomFrequency}
          keyboardType="numeric"
          style={styles.input}
        />
      )}
      <Text style={styles.label}>Snippet Duration (seconds):</Text>
      <RadioButton.Group onValueChange={setDuration} value={duration}>
        <View style={styles.radioRow}>
          <RadioButton value="20" /><Text>20</Text>
          <RadioButton value="40" /><Text>40</Text>
          <RadioButton value="60" /><Text>60</Text>
          <RadioButton value="custom" /><Text>Custom</Text>
        </View>
      </RadioButton.Group>
      {duration === 'custom' && (
        <TextInput
          label="Custom Duration (sec)"
          value={customDuration}
          onChangeText={setCustomDuration}
          keyboardType="numeric"
          style={styles.input}
        />
      )}
      <Divider style={{ marginVertical: 16 }} />
      <Text style={styles.permissionNote}>
        Permissions for microphone, storage, and background use will be requested on first analysis.
      </Text>
    </View>
  );
};

export default ActivationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  cta: {
    marginBottom: 16,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
    width: 160,
  },
  permissionNote: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
  },
}); 