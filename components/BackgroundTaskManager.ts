import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';

const BACKGROUND_RECORDING_TASK = 'BACKGROUND_RECORDING_TASK';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let recordingInterval: ReturnType<typeof setInterval> | null = null;
let currentRecording: Audio.Recording | null = null;

export const startBackgroundRecording = async (frequency: number, duration: number) => {
  try {
    // Request permissions
    await Audio.requestPermissionsAsync();
    await Notifications.requestPermissionsAsync();

    // Set up audio mode for background recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Start the recording interval
    recordingInterval = setInterval(async () => {
      try {
        // Start recording
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        currentRecording = recording;

        // Wait for the specified duration
        await new Promise(resolve => setTimeout(resolve, duration * 1000));

        // Stop recording
        if (currentRecording) {
          await currentRecording.stopAndUnloadAsync();
          const uri = currentRecording.getURI();
          currentRecording = null;
          
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
              duration,
              frequency,
              filePath: destinationUri
            };

            const recordings = await AsyncStorage.getItem('recordings');
            const recordingsArray = recordings ? JSON.parse(recordings) : [];
            recordingsArray.push(metadata);
            await AsyncStorage.setItem('recordings', JSON.stringify(recordingsArray));

            // Show notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Recording Complete',
                body: 'A new audio snippet has been recorded for analysis.',
                data: { timestamp },
              },
              trigger: null,
            });
          }
        }
      } catch (error) {
        console.error('Error in recording interval:', error);
      }
    }, frequency * 60 * 1000); // Convert minutes to milliseconds

    return true;
  } catch (error) {
    console.error('Failed to start background recording:', error);
    return false;
  }
};

export const stopBackgroundRecording = async () => {
  try {
    // Clear the recording interval
    if (recordingInterval) {
      clearInterval(recordingInterval);
      recordingInterval = null;
    }

    // Stop any ongoing recording
    if (currentRecording) {
      await currentRecording.stopAndUnloadAsync();
      currentRecording = null;
    }

    return true;
  } catch (error) {
    console.error('Failed to stop background recording:', error);
    return false;
  }
}; 