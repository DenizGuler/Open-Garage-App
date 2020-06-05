import React from 'react';
import { AsyncStorage } from "react-native";
import { Icon, Header } from "react-native-elements";
import { useNavigation } from '@react-navigation/native';

/*
  device obj{
    id: number,
    OGIP: string,
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
// setCurrDev(index: number): void
export const setCurrDev = async (index) => {
  try {
    await AsyncStorage.setItem('currDev', JSON.stringify(index))
  } catch (err) {
    console.log(err)
  }
}

// GETTERS

// Get index of device we are currently on and the list of devices
// getDevices(): number, device[]
export const getDevices = async () => {
  try {
    const currDev = await AsyncStorage.getItem('currDev');
    const devices = await AsyncStorage.getItem('devices');
    if (devices === null) {
      await setCurrDev(0);
      return [0, null];
    }
    // console.log(currDev + ", " + devices);
    return [JSON.parse(currDev), JSON.parse(devices)];
  } catch (err) {
    console.log(err);
  }
}

// Get the device key of the current device
// getDevKey(): string
export const getDevKey = async () => {
  try {
    const [currDev, devices] = await getDevices();
    return devices[currDev].devKey;
  } catch (err) {
    console.log(err);
  }
}

// Get the IP of the current device
// getOGIP(): string
export const getOGIP = async () => {
  try {
    const [currDev, devices] = await getDevices();
    return devices[currDev].OGIP;
  } catch (err) {
    console.log(err);
  }
}

// HELPER METHODS

// Remove the device at the given index. Returns the deleted device
// removeDev(index: number): device
export const removeDev = async (index) => {
  try {
    const [currDev, devices] = await getDevices();
    if (currDev === index) {
      setCurrDev(0);
    }
    let deleted = devices.splice(index, 1)
    await setDevices(devices);
    return deleted;
  } catch (err) {
    console.log(err)
  }
}

// COMPONENTS

export const ScreenHeader = (props) => {
  const navigation = useNavigation();
  const HeaderComponent = (type) => {
    let comp = null;
    switch (type) {
      case 'hamburger':
        comp = <Icon name='menu' onPress={() => navigation.toggleDrawer()} />;
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
      default:
        break;
    }
    return comp
  }

  return (
    <Header
      containerStyle={{ width: '100%' }}
      statusBarProps={{ translucent: true }}
      backgroundColor="#d8d8d8"
      leftComponent={HeaderComponent(props.left)}
      centerComponent={{ text: props.text, style: { fontSize: 20 } }}
      rightComponent={HeaderComponent(props.right)}
    />
  );
}