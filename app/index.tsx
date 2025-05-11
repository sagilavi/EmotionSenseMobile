import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function HomePage() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="emoticon-outline"
          size={120}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Text variant="headlineLarge" style={styles.headline}>
          Track Your Emotions, Privately.
        </Text>
        <Text variant="bodyLarge" style={styles.subtext}>
          EmotionSense analyzes your voice (without recording it) and shows your emotional flow through the day.
        </Text>
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
  },
}); 