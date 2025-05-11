import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

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
                backgroundColor: '#4A90E2',
              },
              headerTintColor: '#FFFFFF',
              drawerStyle: {
                backgroundColor: '#F5F5F5',
                width: 240,
              },
              drawerActiveTintColor: '#4A90E2',
              drawerInactiveTintColor: '#666666',
              drawerLabelStyle: {
                fontSize: 16,
                fontWeight: '500',
                marginLeft: -20,
              },
              drawerItemStyle: {
                borderRadius: 8,
                marginHorizontal: 8,
                marginVertical: 4,
              },
              drawerActiveBackgroundColor: '#E3F2FD',
              swipeEnabled: true,
              headerShown: true,
            }}
          >
            <Drawer.Screen
              name="index"
              options={{
                title: 'Home',
                drawerLabel: 'Home',
                drawerIcon: ({ color }) => (
                  <View style={{ width: 24, height: 24, backgroundColor: '#4A90E2', borderRadius: 12 }} />
                ),
              }}
            />
            <Drawer.Screen
              name="activation"
              options={{
                title: 'Activation',
                drawerLabel: 'Activation',
                drawerIcon: ({ color }) => (
                  <View style={{ width: 24, height: 24, backgroundColor: '#50C878', borderRadius: 12 }} />
                ),
              }}
            />
            <Drawer.Screen
              name="mindflow"
              options={{
                title: 'MindFlow',
                drawerLabel: 'MindFlow',
                drawerIcon: ({ color }) => (
                  <View style={{ width: 24, height: 24, backgroundColor: '#FF6B6B', borderRadius: 12 }} />
                ),
              }}
            />
          </Drawer>
        </PaperProvider>
      </View>
    </GestureHandlerRootView>
  );
}
