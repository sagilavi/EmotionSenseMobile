import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { enableScreens } from 'react-native-screens';

// Enable screens for better performance
enableScreens();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    // Add any custom fonts here if needed
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <PaperProvider theme={colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme}>
          <Drawer
            screenOptions={{
              headerStyle: {
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
              },
              headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
              drawerStyle: {
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
              },
              drawerActiveTintColor: '#007AFF',
              swipeEnabled: true,
              headerShown: true,
              drawerType: 'front',
            }}
          >
            <Drawer.Screen
              name="index"
              options={{
                title: 'Home',
                drawerLabel: 'Home',
                headerShown: true,
              }}
            />
            <Drawer.Screen
              name="activation"
              options={{
                title: 'Activation',
                drawerLabel: 'Activation',
                headerShown: true,
              }}
            />
            <Drawer.Screen
              name="mindflow"
              options={{
                title: 'MindFlow',
                drawerLabel: 'MindFlow',
                headerShown: true,
              }}
            />
          </Drawer>
        </PaperProvider>
      </View>
    </GestureHandlerRootView>
  );
}
