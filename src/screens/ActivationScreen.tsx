import React, { useState, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Title, RadioButton, TextInput, Divider } from 'react-native-paper';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useRecordings } from '../context/RecordingsContext';

const audioRecorderPlayer = new AudioRecorderPlayer();

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

  const getFreq = () => parseInt(frequency === 'custom' ? customFrequency : frequency, 10) * 60 * 1000;
  const getDur = () => parseInt(duration === 'custom' ? customDuration : duration, 10) * 1000;

  const startRecording = async () => {
    try {
      const now = new Date();
      const fileName = `sound_${now.getTime()}.mp4`;
      const filePath =
        Platform.OS === 'android'
          ? `/data/user/0/com.emotionsensemobile/cache/${fileName}`
          : fileName;
      currentFileRef.current = filePath;
      startTimeRef.current = Date.now();
      await audioRecorderPlayer.startRecorder(filePath);
      timeoutRef.current = setTimeout(async () => {
        await stopRecording();
      }, getDur());
    } catch (e) {
      console.warn('Failed to start recording', e);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      if (result && currentFileRef.current) {
        const now = new Date();
        const endTime = Date.now();
        const length = endTime - startTimeRef.current;
        addRecording({
          path: currentFileRef.current,
          length,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
        });
        currentFileRef.current = null;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } catch (e) {
      console.warn('Failed to stop recording', e);
    }
  };

  const scheduleRecording = () => {
    startRecording();
    intervalRef.current = setInterval(() => {
      startRecording();
    }, getFreq());
  };

  const clearRecordingSchedule = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

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
      scheduleRecording();
    } else {
      setAnalyzing(false);
      clearRecordingSchedule();
      stopRecording();
    }
  };

  React.useEffect(() => {
    return () => {
      clearRecordingSchedule();
      stopRecording();
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