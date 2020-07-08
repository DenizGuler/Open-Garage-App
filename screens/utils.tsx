import React, { FC } from 'react';
import { AsyncStorage, Platform, Text, TextProps } from "react-native";
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types';

export const FONT = Platform.OS === 'ios' ? 'San Francisco' : 'sans-serif'

// INTERFACES

/**
 * Interface for local device settings
 */
export interface Device {
  conMethod?: 'IP' | 'OTF',
  conInput?: string,
  devKey?: string,
  image?: ImageInfo,
  name?: string,
  // [param: string]: any,
}

/**
 * Interface for device params as described by the Open Garage API
 */
export interface Params {
  fwv?: number,
  mnt?: number,
  dth?: number,
  vth?: number,
  riv?: number,
  alm?: number,
  lsz?: number,
  tsn?: number,
  htp?: number,
  cdt?: number,
  dri?: number,
  sto?: number,
  mod?: number,
  ati?: number,
  ato?: number,
  atib?: number,
  atob?: number,
  noto?: number,
  usi?: number,
  ssid?: string,
  auth?: string,
  bdmn?: string,
  bprt?: number,
  name?: string,
  iftt?: string,
  mqtt?: string,
  mqpt?: number,
  mqun?: string,
  mqpw?: string,
  dvip?: string,
  gwip?: string,
  subn?: string,
  nkey?: string,
  ckey?: string,
  [key: string]: string | number | undefined,
}

// SETTERS

/** 
 * Set the device array to an array
 */
export const setDevices = async (devArr: Device[]) => {
  try {
    await AsyncStorage.setItem('devices', JSON.stringify(devArr))
  } catch (err) {
    console.log(err)
  }
}

/** 
 * Set the current device to the one at the provided index
 */
export const setCurrIndex = async (index: number) => {
  try {
    await AsyncStorage.setItem('currIndex', JSON.stringify(index))
  } catch (err) {
    console.log(err)
  }
}

/**
 * set the current device with the provided param and value
 */
export const setCurrDeviceParam = async (params: Device) => {
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
  } catch (err) {
    console.log(err)
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
  }
  return [0, []];
}

/**
 *  Get the device key of the current device
 */
export const getDevKey = async (): Promise<string> => {
  try {
    const [currIdx, devices] = await getDevices();
    const deviceKey = devices[currIdx].devKey;
    if (deviceKey !== undefined)
      return deviceKey;
    return ''
  } catch (err) {
    console.log(err);
    return '';
  }
}

// Get the inputted value for connectivity 
// getConInput(): string
export const getConInput = async (): Promise<string | undefined> => {
  try {
    const [currIdx, devices] = await getDevices();
    return devices[currIdx].conInput;
  } catch (err) {
    console.log(err);
  }
}

// Get the url of the device at the given index (or the current device if no index is given)
// getURL(index?: number): string
export const getURL = async (index?: number) => {
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
      case undefined:
        url = 'no device';
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

// Get the image attached to the device at the given index/current device
// Returns undefined if no image exists
// getImage(index?: number): image
export const getImage = async (index?: number) => {
  try {
    const [currIdx, devices] = await getDevices();
    if (index === undefined) index = currIdx;
    let device = devices[index]
    return device.image
  } catch (err) {
    console.log(err)
  }
}

// HELPER METHODS

// Remove the device at the given index. Returns the deleted devices
// removeDev(index: number): device
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
  }
}

// COMPONENTS

/**
 * 'Base Text' component for the Open Garage App 
 * @param props same props as the Text component
 */
export const BaseText: FC<TextProps> = (props) => <Text style={[{ fontFamily: FONT }]} {...props}>{props.children}</Text>