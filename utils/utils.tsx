import React, { FC, useRef, useCallback } from 'react';
import { Platform, Text, TextProps, Alert } from "react-native";
import { Device } from './types';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-community/async-storage'
import { usePopup, PopupOptions } from '../components/Popup';

// export const FONT = Platform.OS === 'ios' ? 'San Francisco' : 'sans-serif'
const TOKEN_PREFIX = 'OTC-'
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
    // createAlert('Error Saving Data', 'There was an error saving data')
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
    // createAlert('Error Saving Data', 'There was an error saving data')
    return false;
  }
}

/**
 * Set the current device with the provided param and value
 */
export const setDeviceParam = async (params: Device) => {

  if (params.conInput !== undefined) {
    params.conMethod = interpConMethod(params.conInput);
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
    // createAlert('Error Saving Data', 'There was an error saving data')
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
    // createAlert('Error Reading Data', 'There was an error reading data');
    return [0, []];
  }
}

/**
 *  Get the device key of the current device
 */
export const getDevKey = async (index?: number): Promise<string> => {
  try {
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index;
    if (devices[index] !== undefined) {
      const deviceKey = devices[index].devKey;
      if (deviceKey !== undefined) {
        return deviceKey;
      }
    }
    return '';
  } catch (err) {
    console.log(err);
    // createAlert('Error Reading Data', 'There was an error reading data');
    return '';
  }
}

/** 
 * Get the inputted value for connectivity 
 */
export const getConInput = async (index?: number): Promise<string | undefined> => {
  try {
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index;
    if (devices[index] !== undefined) {
      return devices[index].conInput;
    }
    return '';
  } catch (err) {
    console.log(err);
    // createAlert('Error Reading Data', 'There was an error reading data');
    return '';
  }
}

/**
 * @param index (optional) index of target device
 */
export const getConMethod = async (index?: number) => {
  try {
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index;
    if (devices[index] !== undefined) {
      return devices[index].conMethod;
    }
    return '';
  } catch (err) {
    console.log(err);
    // createAlert('Error Reading Data', 'There was an error reading data');
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
    if (device.conInput === undefined) {
      return '';
    }

    switch (device.conMethod) {
      case 'IP':
        url = 'http://' + device.conInput
        break;
      case 'OTC':
        url = `https://${device.otc?.domain}/forward/v1/${device.conInput.substring(4)}`;
        break;
      case 'BLYNK':
        url = 'http://blynk-cloud.com/' + device.conInput;
        break;
      case undefined:
        url = '';
        break;
      default:
        url = '';
        break;
    }
    return url;
  } catch (err) {
    console.log(err)
    // createAlert('Error Reading Data', 'There was an error reading data');
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
    let device = devices[index];
    if (device !== undefined) {
      return device.image
    }
    return undefined;
  } catch (err) {
    console.log(err)
    // createAlert('Error Reading Data', 'There was an error reading data');
    return undefined;
  }
}

// HELPER METHODS

/**
 * Interpret connection method given an input string
 * @param conInput - input string (eg. an IP or a Token) 
 */
export const interpConMethod = (conInput: string): 'IP' | 'OTC' | 'BLYNK' | 'none' => {
  if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(conInput)) {
    return 'IP';
  } else { // not an IP so must be a token
    if (/^OTC-\w{32}$/.test(conInput)) { // token prefix is "OTC-"
      return 'OTC';
    } else if (/^\w{32}$/) {
      return 'BLYNK';
    }
  }
  return 'none';
}



export const findOldSettings = async (popup: (options: PopupOptions) => Promise<void>) => {
  const keys = await AsyncStorage.getAllKeys();
  if (keys.includes('controllers')) {
    try {
      const value = await AsyncStorage.getItem('controllers');
      if (value === null) {
        return;
      }
      createAlert(popup, "Old Settings Found", "Old settings were detected on your device would you like to use these old settings or delete them?",
        [
          {
            text: 'Delete', onPress: async () => {
              await AsyncStorage.removeItem('controllers');
              await AsyncStorage.removeItem('activeController');
            }
          },
          {
            text: 'Use Old settings', onPress: async () => {
              const controllers: any[] = JSON.parse(value);
              const [currIdx, devices] = await getDevices();
              for (let i = 0; i < controllers.length; i++) {
                let device: Device = {
                  devKey: controllers[i].password,
                  image: controllers[i].image,
                }
                if (controllers[i].auth) {
                  device.conInput = controllers[i].auth;
                  device.conMethod = 'BLYNK';
                }
                if (controllers[i].ip) {
                  device.conInput = controllers[i].ip;
                  device.conMethod = 'IP';
                }
                devices.push(device);
              }
              await setDevices(devices);
              await AsyncStorage.removeItem('controllers');
              await AsyncStorage.removeItem('activeController');
            }
          }
        ])
    } catch (err) {
      console.log(err)
    }
  }
}

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
    // createAlert('Error Removing Data', 'There was an error removing data');
    return undefined
  }
}

export const addDev = async (...toAdd: Device[]) => {
  try {
    const [currIdx, devices] = await getDevices();
    devices.push(...toAdd);
    return await setDevices(devices);
  } catch (err) {
    console.log(err);
    return false;
  }
}

/**
 * Creates an alert box that works on both mobile and web;
 * on web this function is blocking
 * @param title title of alert box (does not work as expected on web)
 * @param message (optional) message of alert box
 * @param buttons (optional) buttons 
 */
export const createAlert = (popup: (options: PopupOptions) => Promise<void>, title: string, message?: string, buttons?: { text: string, onPress?: () => void }[]) => {

  // const popup = usePopup();

  if (buttons === undefined) {
    return popup({
      title: title,
      text: message,
      buttons: [{ text: 'OK' }]
    });
  } else {
    return popup({
      title: title,
      text: message,
      buttons: buttons,
    })
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