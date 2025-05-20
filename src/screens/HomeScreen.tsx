import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title, Paragraph, Avatar } from 'react-native-paper';

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Avatar.Icon size={96} icon="emoticon-happy-outline" style={styles.icon} />
      <Title style={styles.headline}>Track Your Emotions, Privately.</Title>
      <Paragraph style={styles.subtext}>
        EmotionSense analyzes your voice (without recording it) and shows your emotional flow through the day.
      </Paragraph>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  icon: {
    marginBottom: 24,
    backgroundColor: '#e3f2fd',
  },
  headline: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
}); 