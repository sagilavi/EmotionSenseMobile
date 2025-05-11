import { startBackgroundRecording, stopBackgroundRecording } from '@/components/BackgroundTaskManager';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

export default function MindFlowPage() {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [frequency, setFrequency] = useState('30');
  const [duration, setDuration] = useState('30');
  const [lastRecordingTime, setLastRecordingTime] = useState<string | null>(null);

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem('recordingSettings');
        if (settings) {
          const { frequency: savedFrequency, duration: savedDuration } = JSON.parse(settings);
          setFrequency(savedFrequency);
          setDuration(savedDuration);
        }
      } catch (error) {
        console.error('Failed to load recording settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Set up notification listener
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const timestamp = notification.request.content.data?.timestamp as string;
      if (timestamp) {
        setLastRecordingTime(timestamp);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleStartRecording = async () => {
    const success = await startBackgroundRecording(
      parseInt(frequency),
      parseInt(duration)
    );
    if (success) {
      setIsRecording(true);
    }
  };

  const handleStopRecording = async () => {
    const success = await stopBackgroundRecording();
    if (success) {
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="brain"
          size={120}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Text variant="headlineLarge" style={styles.headline}>
          MindFlow Analysis
        </Text>
        <Text variant="bodyLarge" style={styles.subtext}>
          Record audio snippets to analyze your emotional patterns throughout the day.
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recording Settings
            </Text>
            <Text variant="bodyMedium">
              Frequency: Every {frequency} minutes
            </Text>
            <Text variant="bodyMedium">
              Duration: {duration} seconds per recording
            </Text>
            {lastRecordingTime && (
              <Text variant="bodyMedium" style={styles.lastRecording}>
                Last recording: {new Date(lastRecordingTime).toLocaleString()}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          style={styles.button}
          icon={isRecording ? 'stop' : 'play'}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 30,
  },
  headline: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subtext: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 30,
  },
  card: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  lastRecording: {
    marginTop: 12,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
}); 