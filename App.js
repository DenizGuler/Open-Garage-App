import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, LogScreen, SettingsScreen, DevicesScreen } from './components/screens/';
import * as Settings from './components/screens/SettingsScreen';
// import EventEmitter from 'events';

const MainDrawer = createDrawerNavigator();
const RootStack = createStackNavigator();

function MainDrawerScreen() {
  return (
    <MainDrawer.Navigator
      initialRouteName='Home'
    >
      <MainDrawer.Screen name='Home' component={HomeScreen} />
      <MainDrawer.Screen name='Log' component={LogScreen} />
      <MainDrawer.Screen name='Settings' component={SettingsScreen} />
      <MainDrawer.Screen name='Devices' component={DevicesScreen} />
    </MainDrawer.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName='Main'
      >
        <RootStack.Screen name='Main' component={MainDrawerScreen} />
        <RootStack.Screen name='IPModal' component={Settings.IPModal} />
        <RootStack.Screen name='BasicSettings' component={Settings.BasicSettings} />
        <RootStack.Screen name='IntegrationSettings' component={Settings.IntegrationSettings} />
        <RootStack.Screen name='AdvancedSettings' component={Settings.AdvancedSettings} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
