import React, { FC, useRef, useCallback } from 'react';
import { Platform, Text, TextProps, Alert } from "react-native";
import { Device } from './types';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-community/async-storage'

export const FONT = Platform.OS === 'ios' ? 'San Francisco' : 'sans-serif'

// SETTERS

/** 
 * Set the device array to an array
 */
export const setDevices = async (devArr: Device[]) => {
  try {
    await AsyncStorage.setItem('devices', JSON.stringify(devArr));
    return true;
  } catch (err) {
    console.log(err);
    createAlert('Error Saving Data', 'There was an error saving data')
    return false;
  }
}

/** 
 * Set the current device to the one at the provided index
 */
export const setCurrIndex = async (index: number) => {
  try {
    await AsyncStorage.setItem('currIndex', JSON.stringify(index))
    return true;
  } catch (err) {
    console.log(err)
    createAlert('Error Saving Data', 'There was an error saving data')
    return false;
  }
}

/**
 * Set the current device with the provided param and value
 */
export const setDeviceParam = async (params: Device) => {

  if (params.conInput !== undefined) {
    if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(params.conInput)) {
      params.conMethod = 'IP'
    } else {
      params.conMethod = 'OTF'
    }
  }

  let newDevs;
  try {
    const [currIdx, devices] = await getDevices();
    let newDevice: Device = {
      conMethod: 'IP',
      conInput: '',
    };
    if (devices === null) {
      newDevs = [newDevice];
    } else {
      newDevs = devices.slice()
    }
    if (newDevs[currIdx] === undefined) {
      newDevs[currIdx] = newDevice;
    }
    newDevs[currIdx] = {
      ...newDevs[currIdx],
      ...params,
    }
    await setDevices(newDevs);
    return true;
  } catch (err) {
    console.log(err);
    createAlert('Error Saving Data', 'There was an error saving data')
    return false;
  }
}

// GETTERS

/**
 * Get index of device we are currently on and the list of devices
 */
export const getDevices = async (): Promise<[number, Device[]]> => {
  try {
    const currIndex = await AsyncStorage.getItem('currIndex');
    const devices = await AsyncStorage.getItem('devices');
    if (devices === null || currIndex === null) {
      await setCurrIndex(0);
      return [0, []];
    }
    // console.log(currDev + ", " + devices);
    return [JSON.parse(currIndex), JSON.parse(devices)];
  } catch (err) {
    console.log(err);
    createAlert('Error Reading Data', 'There was an error reading data');
    return [0, []];
  }
}

/**
 *  Get the device key of the current device
 */
export const getDevKey = async (index?: number): Promise<string> => {
  try {
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index
    const deviceKey = devices[index].devKey;
    if (deviceKey !== undefined)
      return deviceKey;
    return ''
  } catch (err) {
    console.log(err);
    createAlert('Error Reading Data', 'There was an error reading data');
    return '';
  }
}

/** 
 * Get the inputted value for connectivity 
 */
export const getConInput = async (index?: number): Promise<string | undefined> => {
  try {
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index
    return devices[index].conInput;
  } catch (err) {
    console.log(err);
    createAlert('Error Reading Data', 'There was an error reading data');
    return '';
  }
}

// Get the url of the device at the given index (or the current device if no index is given)
// getURL(index?: number): string
export const getURL = async (index?: number) => {
  try {
    let url;
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index
    if (devices.length === 0) {
      return 'no devices';
    }
    let device = devices[index]

    switch (device.conMethod) {
      case 'IP':
        url = 'http://' + device.conInput
        break;
      case 'OTF':
        url = 'https://cloud.test.openthings.io/forward/v1/' + device.conInput
        break;
      case undefined:
        url = '';
        break;
      default:
        url = ''
        break;
    }
    return url;
  } catch (err) {
    console.log(err)
    createAlert('Error Reading Data', 'There was an error reading data');
    return '';
  }
}

/**
 * Get the image attached to the device at the given index/current device if one exists 
 * @param index (optional) index of target device
 */
export const getImage = async (index?: number) => {
  try {
    const [currIdx, devices] = await getDevices();
    if (index === undefined) index = currIdx;
    let device = devices[index]
    return device.image
  } catch (err) {
    console.log(err)
    createAlert('Error Reading Data', 'There was an error reading data');
    return undefined;
  }
}

// HELPER METHODS

/**
 * Remove the device at the given index. Returns the deleted devices
 * @param index index of target device
 */
export const removeDev = async (index: number): Promise<Device | undefined> => {
  try {
    const [currIdx, devices] = await getDevices();
    if (currIdx === index) {
      setCurrIndex(0);
    }
    let deleted = devices.splice(index, 1)
    await setDevices(devices);
    return deleted[0];
  } catch (err) {
    console.log(err)
    createAlert('Error Removing Data', 'There was an error removing data');
    return undefined
  }
}

/**
 * Creates an alert box that works on both mobile and web;
 * on web this function is blocking
 * @param title title of alert box (does not work as expected on web)
 * @param message (optional) message of alert box
 * @param buttons (optional) buttons 
 */
export const createAlert = (title: string, message?: string, buttons?: { text: string, onPress?: () => void }[]) => {
  if (buttons === undefined) {
    if (Platform.OS === 'web') {
      window.alert(message !== undefined ? message : title)
    } else {
      Alert.alert(title, message)
    }
  } else if (buttons.length === 2) {
    if (Platform.OS === 'web') {
      let res = window.confirm(message)
      if (!res && buttons[0].onPress !== undefined) {
        buttons[0].onPress()
      }
      if (res && buttons[1].onPress !== undefined) {
        buttons[1].onPress()
      }
    } else {
      Alert.alert(title, message, buttons)
    }
  }
}

// HOOKS

export const useInterval = (callback: () => any, delay: number) => {
  const savedCallback = useRef<() => any>(() => { });
  // remember the latest callback
  useFocusEffect(
    useCallback(() => {
      savedCallback.current = callback;
    }, [callback])
  );

  // set up the interval
  useFocusEffect(
    useCallback(() => {
      const tick = () => savedCallback.current();
      if (delay !== null) {
        const handle = setInterval(tick, delay);
        return () => {
          clearInterval(handle)
        }
      }
    }, [callback, delay])
  )
}

// COMPONENTS

/**
 * 'Base Text' component for the Open Garage App 
 * @param props same props as the Text component
 */
export const BaseText: FC<TextProps> = (props) => <Text /* style={[{ fontFamily: FONT }]} */ {...props}>{props.children}</Text>