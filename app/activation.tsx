import * as Audio from 'expo-av';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text, TextInput } from 'react-native-paper';

export default function ActivationPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frequency, setFrequency] = useState('12');
  const [snippetDuration, setSnippetDuration] = useState('40');
  const [customFrequency, setCustomFrequency] = useState('');
  const [customDuration, setCustomDuration] = useState('');

  const handleStartAnalysis = async () => {
    if (!isAnalyzing) {
      // Request permissions
      const { status } = await Audio.Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Microphone permission is required for emotion analysis');
        return;
      }
    }
    setIsAnalyzing(!isAnalyzing);
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
              <RadioButton.Item label="Every 5 minutes" value="5" />
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