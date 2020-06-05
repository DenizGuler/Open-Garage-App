import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, LogScreen, SettingsStack, DevicesScreen } from './components/screens/';
// import EventEmitter from 'events';

const Drawer = createDrawerNavigator();

export default function App() {
  // const emiter = new EventEmitter();

  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName='Home'
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
        }}
      >
        <Drawer.Screen name='Home' component={HomeScreen} />
        <Drawer.Screen name='Log' component={LogScreen} />
        <Drawer.Screen name='Settings' component={SettingsStack} />
        <Drawer.Screen name='Devices' component={DevicesScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
