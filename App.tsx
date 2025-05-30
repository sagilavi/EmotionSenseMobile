/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { RecordingsProvider } from './src/context/RecordingsContext';
import { FeaturesProvider } from './src/context/RecordingsContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => (
  <PaperProvider>
    <RecordingsProvider>
      <FeaturesProvider>
        <AppNavigator />
      </FeaturesProvider>
    </RecordingsProvider>
  </PaperProvider>
);

export default App;
