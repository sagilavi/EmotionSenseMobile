import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ActivationScreen from '../screens/ActivationScreen';
import MindFlowScreen from '../screens/MindFlowScreen';

const Drawer = createDrawerNavigator();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Activation" component={ActivationScreen} />
        <Drawer.Screen name="MindFlow" component={MindFlowScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 