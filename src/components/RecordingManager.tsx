import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecordingManagerProps {
  analysisFrequency: number; // in minutes
  snippetDuration: number; // in seconds
  onRecordingComplete: (fileUri: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export interface RecordingManagerRef {
  stopRecording: () => Promise<void>;
}

const RecordingManager = forwardRef<RecordingManagerRef, RecordingManagerProps>(({
  analysisFrequency,
  snippetDuration,
  onRecordingComplete,
  onRecordingStateChange,
}, ref) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useImperativeHandle(ref, () => ({
    stopRecording: async () => {
      await stopRecording();
    }
  }));

  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording, recordingInterval]);

  const startRecording = async () => {
    try {
      // Clean up any existing recording first
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permissions to use this feature.');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);

      // Set up interval for periodic recordings
      const interval: ReturnType<typeof setInterval> = setInterval(async () => {
        if (newRecording) {
          await stopAndSaveRecording(newRecording);
          // Start a new recording
          const nextRecording = new Audio.Recording();
          await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          await nextRecording.startAsync();
          setRecording(nextRecording);
        }
      }, analysisFrequency * 60 * 1000); // Convert minutes to milliseconds

      setRecordingInterval(interval);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }

      if (recording) {
        await stopAndSaveRecording(recording);
        setRecording(null);
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const stopAndSaveRecording = async (currentRecording: Audio.Recording) => {
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      if (uri) {
        // Create a unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording_${timestamp}.m4a`;
        const newUri = `${FileSystem.documentDirectory}${filename}`;

        // Move the file to our app's directory
        await FileSystem.moveAsync({
          from: uri,
          to: newUri,
        });

        // Save recording metadata
        const metadata = {
          uri: newUri,
          timestamp: new Date().toISOString(),
          duration: snippetDuration,
        };
        await saveRecordingMetadata(metadata);

        onRecordingComplete(newUri);
      }
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  };

  const saveRecordingMetadata = async (metadata: any) => {
    try {
      const existingMetadata = await AsyncStorage.getItem('recordingMetadata');
      const metadataArray = existingMetadata ? JSON.parse(existingMetadata) : [];
      metadataArray.push(metadata);
      await AsyncStorage.setItem('recordingMetadata', JSON.stringify(metadataArray));
    } catch (error) {
      console.error('Failed to save recording metadata:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording ? styles.stopButton : styles.startButton]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
      {isRecording && (
        <Text style={styles.statusText}>
          Recording in progress... Next snippet in {analysisFrequency} minutes
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 25,
    width: 200,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default RecordingManager; 