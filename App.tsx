import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer, CompositeNavigationProp, DefaultTheme as DefaultNavTheme } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { createStackNavigator, StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { HomeScreen, LogScreen, SettingsScreen, DevicesScreen } from './screens';
import * as Settings from './screens/SettingsScreen';
import { StatusBar, Dimensions } from 'react-native';
import { Icon } from 'react-native-elements';
import { GarageDrawerComponent } from './components';
import { getDevices, findOldSettings } from './utils/utils';
import { Provider, DefaultTheme as DefaultPaperTheme } from 'react-native-paper';
import { PopupServiceProvider, usePopup } from './components/Popup';

const theme = {
  ...DefaultNavTheme,
  ...DefaultPaperTheme,
  colors: {
    ...DefaultNavTheme.colors,
    ...DefaultPaperTheme.colors,
    primary: '#000000',
    accent: '#a0c9e6',
    // text: '#444444'
  }
}

// Main drawer where all 'main' screens are held (i.e.: Home, Settings, etc.)
const MainDrawer = createDrawerNavigator();
export type MainDrawerParams = {
  Home: undefined,
  Logs: undefined,
  Settings: undefined,
  Sites: undefined,
}

// The 'root' stack used to have all 'pop-up/modal' screens show up on top of any main screens
const RootStack = createStackNavigator();
export type RootStackParams = {
  Main: {
    screen: 'Home' | 'Logs' | 'Settings' | 'Sites',
  },
  IPSettings: undefined,
  BasicSettings: undefined,
  IntegrationSettings: undefined,
  AdvancedSettings: undefined
}

export type AppNavigationProp<A extends keyof MainDrawerParams> = CompositeNavigationProp<
  DrawerNavigationProp<MainDrawerParams, A>,
  StackNavigationProp<RootStackParams>
>

function MainDrawerScreen({ navigation }: StackScreenProps<RootStackParams, 'Main'>) {
  const popup = usePopup();

  useEffect(() => {
    findOldSettings(popup)
      .then(() => getDevices())
      .then((value) => {
        const [currIdx, devices] = value;
        if (devices.length === 0) {
          navigation.navigate('IPSettings')
        }
      })
  }, [])

  return (
    <MainDrawer.Navigator
      initialRouteName='Home'
      drawerType={Dimensions.get('window').width < 600 ? 'front' : 'permanent'}
      drawerContent={(props) => <GarageDrawerComponent {...props} />}
    >
      <MainDrawer.Screen name='Home' component={HomeScreen} options={{
        drawerIcon: (props) => (
          <Icon name='home' type='material-community' color={props.color} />
        )
      }} />
      <MainDrawer.Screen name='Logs' component={LogScreen} options={{
        drawerIcon: (props) => (
          <Icon name='script' type='material-community' color={props.color} />
        )
      }} />
      <MainDrawer.Screen name='Settings' component={SettingsScreen} options={{
        drawerIcon: (props) => (
          <Icon name='settings' color={props.color} />
        )
      }} />
      <MainDrawer.Screen name='Sites' component={DevicesScreen} options={{
        drawerIcon: (props) => (
          <Icon name='swap-horizontal-bold' type='material-community' color={props.color} />
        )
      }} />
    </MainDrawer.Navigator>
  )
}

export default function App() {
  return (
    <Provider theme={theme}>
      <PopupServiceProvider>
        <NavigationContainer theme={theme}>
          <StatusBar backgroundColor="white" barStyle="dark-content" />
          <RootStack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName='Main'
          >
            <RootStack.Screen name='Main' component={MainDrawerScreen} />
            <RootStack.Screen name='IPSettings' component={Settings.IPSettings} />
            <RootStack.Screen name='BasicSettings' component={Settings.BasicSettings} />
            <RootStack.Screen name='IntegrationSettings' component={Settings.IntegrationSettings} />
            <RootStack.Screen name='AdvancedSettings' component={Settings.AdvancedSettings} />
          </RootStack.Navigator>
        </NavigationContainer>
      </PopupServiceProvider>
    </Provider>
  );
}
