import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text, TextInput } from 'react-native-paper';

export default function ActivationPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frequency, setFrequency] = useState('12');
  const [snippetDuration, setSnippetDuration] = useState('40');
  const [customFrequency, setCustomFrequency] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);

  // Save settings whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      const finalFrequency = frequency === 'custom' ? customFrequency : frequency;
      const finalDuration = snippetDuration === 'custom' ? customDuration : snippetDuration;
      
      await AsyncStorage.setItem('recordingSettings', JSON.stringify({
        frequency: finalFrequency,
        duration: finalDuration
      }));
    };
    
    saveSettings();
  }, [frequency, snippetDuration, customFrequency, customDuration]);

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
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required for emotion analysis');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        // Save the recording
        const timestamp = new Date().toISOString();
        const fileName = `recording_${timestamp}.m4a`;
        const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.moveAsync({
          from: uri,
          to: destinationUri
        });

        // Save metadata
        const metadata = {
          timestamp,
          duration: parseInt(snippetDuration),
          frequency: parseInt(frequency),
          filePath: destinationUri
        };

        const recordings = await AsyncStorage.getItem('recordings');
        const recordingsArray = recordings ? JSON.parse(recordings) : [];
        recordingsArray.push(metadata);
        await AsyncStorage.setItem('recordings', JSON.stringify(recordingsArray));
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      setRecording(null);
    }
  };

  const handleStartAnalysis = async () => {
    if (!isAnalyzing) {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required for emotion analysis');
        return;
      }

      // Start the recording cycle
      const interval = setInterval(async () => {
        await startRecording();
        setTimeout(async () => {
          await stopRecording();
        }, parseInt(snippetDuration) * 1000);
      }, parseInt(frequency) * 60 * 1000);

      setRecordingInterval(interval as unknown as NodeJS.Timeout);
      setIsAnalyzing(true);
    } else {
      // Stop the recording cycle
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      if (recording) {
        await stopRecording();
      }
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.header}>
          Start Emotion Tracking
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Analysis Frequency
            </Text>
            <RadioButton.Group onValueChange={setFrequency} value={frequency}>
              <RadioButton.Item label="Every 1 minutes" value="1" />
              <RadioButton.Item label="Every 12 minutes" value="12" />
              <RadioButton.Item label="Every 25 minutes" value="25" />
              <RadioButton.Item label="Custom" value="custom" />
            </RadioButton.Group>
            {frequency === 'custom' && (
              <TextInput
                label="Custom frequency (minutes)"
                value={customFrequency}
                onChangeText={setCustomFrequency}
                keyboardType="numeric"
                style={styles.input}
              />
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Snippet Duration
            </Text>
            <RadioButton.Group onValueChange={setSnippetDuration} value={snippetDuration}>
              <RadioButton.Item label="20 seconds" value="20" />
              <RadioButton.Item label="40 seconds" value="40" />
              <RadioButton.Item label="60 seconds" value="60" />
              <RadioButton.Item label="Custom" value="custom" />
            </RadioButton.Group>
            {snippetDuration === 'custom' && (
              <TextInput
                label="Custom duration (seconds)"
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="numeric"
                style={styles.input}
              />
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleStartAnalysis}
          style={styles.button}
          icon={isAnalyzing ? 'pause' : 'play'}
        >
          {isAnalyzing ? 'Pause Analysis' : 'Start Analyzing'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  input: {
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
}); 