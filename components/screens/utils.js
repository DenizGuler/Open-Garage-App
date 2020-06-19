import React from 'react';
import { AsyncStorage, StyleSheet, Platform } from "react-native";
import { Icon, Header } from "react-native-elements";
import { useNavigation } from '@react-navigation/native';

/*
  device obj{
    conMethod: 'IP' | 'OTF',
    conInput: string,
    devKey: string,
  }
*/

// SETTERS

// Set the device array to an array
// setDevices(devArr: device[]): void
export const setDevices = async (devArr) => {
  try {
    await AsyncStorage.setItem('devices', JSON.stringify(devArr))
  } catch (err) {
    console.log(err)
  }
}

// Set the current device to the one at the provided index
// setCurrIndex(index: number): void
export const setCurrIndex = async (index) => {
  try {
    await AsyncStorage.setItem('currIndex', JSON.stringify(index))
  } catch (err) {
    console.log(err)
  }
}

// set the current device with the provided param and value
// setCurrDeviceParam(param: string, val: any): void
export const setCurrDeviceParam = async (param, val) => {
  let newDevs;
  try {
    const [currIdx, devices] = await getDevices();
    if (devices === null) {
      newDevs = [{}];
    } else {
      newDevs = devices.slice()
    }
    if (newDevs[currIdx] === undefined) {
      newDevs[currIdx] = {};
    }
    newDevs[currIdx][param] = val
    await setDevices(newDevs);
  } catch {
    console.log(err)
  }
}

// GETTERS

// Get index of device we are currently on and the list of devices
// getDevices(): number, device[]
export const getDevices = async () => {
  try {
    const currIndex = await AsyncStorage.getItem('currIndex');
    const devices = await AsyncStorage.getItem('devices');
    if (devices === null) {
      await setCurrIndex(0);
      return [0, null];
    }
    // console.log(currDev + ", " + devices);
    return [JSON.parse(currIndex), JSON.parse(devices)];
  } catch (err) {
    console.log(err);
  }
}

// Get the device key of the current device
// getDevKey(): string
export const getDevKey = async () => {
  try {
    const [currIdx, devices] = await getDevices();
    return devices[currIdx].devKey;
  } catch (err) {
    console.log(err);
  }
}

// Get the inputted value for connectivity
// getConInput(): string
export const getConInput = async () => {
  try {
    const [currIdx, devices] = await getDevices();
    return devices[currIdx].conInput;
  } catch (err) {
    console.log(err);
  }
}

// Get the url of the device at the given index (or the current device if no index is given)
// getURL(index?: number): string
export const getURL = async (index) => {
  try {
    let url;
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index
    let device = devices[index]

    switch (device.conMethod) {
      case 'IP':
        url = 'http://' + device.conInput
        break;
      case 'OTF':
        url = 'https://cloud.test.openthings.io/forward/v1/' + device.conInput
        break;
      default:
        url = ''
        break;
    }
    return url;
  } catch (err) {
    console.log(err)
  }
}

// HELPER METHODS

// Remove the device at the given index. Returns the deleted device
// removeDev(index: number): device
export const removeDev = async (index) => {
  try {
    const [currIdx, devices] = await getDevices();
    if (currIdx === index) {
      setCurrIndex(0);
    }
    let deleted = devices.splice(index, 1)
    await setDevices(devices);
    return deleted;
  } catch (err) {
    console.log(err)
  }
}

// COMPONENTS

/* 
  Header component for screens

  props: {
    left?={type}
    text?={string}
    right?={type}
    onCheck?={function}
    onAdd?={function}
  }

  type: {
    'hamburger': menu hamburger; opens the navigation drawer,
    'back': back button; invokes navigate.goBack(),
    'home' : home button; navigates to the 'Home' screen,
    'check' : check button; invokes onCheck(),
    'add' : plus/add button; invokes onAdd(),
  }
*/
export const ScreenHeader = (props) => {
  const style = StyleSheet.create({
    header: {
      zIndex: 2,
      width: '100%',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.34,
      shadowRadius: 6.27,

      elevation: 10,
    },
  })
  const navigation = useNavigation();
  const HeaderComponent = (type) => {
    let comp = null;
    switch (type) {
      case 'hamburger':
        if (Platform.OS !== 'web') {
          comp = <Icon name='menu' onPress={() => navigation.toggleDrawer()} />;
        }
        break;
      case 'back':
        comp = <Icon name='chevron-left' onPress={() => navigation.goBack()} />;
        break;
      case 'home':
        comp = <Icon name='home' onPress={() => navigation.navigate('Home')} />;
        break;
      case 'check':
        comp = <Icon name='check' onPress={props.onCheck} />
        break;
      case 'add':
        comp = <Icon name='add' onPress={props.onAdd} />
        break;
      case 'cancel':
        comp = <Icon name='close' onPress={props.onCancel} />
        break;
      case 'info':
        comp = <Icon name='info-outline' onPress={props.onInfo} />
        break;
      default:
        break;
    }
    return comp
  }

  return (
    <Header
      containerStyle={style.header}
      statusBarProps={{ translucent: true }}
      backgroundColor="#fff"
      leftComponent={HeaderComponent(props.left)}
      centerComponent={{ text: props.text, style: { fontSize: 24 } }}
      rightComponent={HeaderComponent(props.right)}
    />
  );
}

// export const 