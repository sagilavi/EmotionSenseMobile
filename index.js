import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import 'react-native-gesture-handler';

// Must be exported or Fast Refresh won't update the context
export function App() {
  return <ExpoRoot />;
}

registerRootComponent(App);
