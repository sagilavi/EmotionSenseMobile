import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ActivationScreen from '../screens/ActivationScreen';
import MindFlowScreen from '../screens/MindFlowScreen';
import DeveloperScreen from '../screens/DeveloperScreen';
import { RecordingsProvider } from '../context/RecordingsContext';

const Drawer = createDrawerNavigator();

const AppNavigator: React.FC = () => {
  return (
    <RecordingsProvider>
      <NavigationContainer>
        <Drawer.Navigator initialRouteName="Home">
          <Drawer.Screen name="Home" component={HomeScreen} />
          <Drawer.Screen name="Activation" component={ActivationScreen} />
          <Drawer.Screen name="MindFlow" component={MindFlowScreen} />
          <Drawer.Screen name="Developer" component={DeveloperScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </RecordingsProvider>
  );
};

export default AppNavigator; 