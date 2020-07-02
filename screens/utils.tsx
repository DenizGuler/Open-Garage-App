import React, { useRef, useState, useEffect, FC } from 'react';
import { AsyncStorage, StyleSheet, Platform, Text, View, Image, TextProps } from "react-native";
import { Icon, Header } from "react-native-elements";
// import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler, State, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { DrawerContentScrollView, DrawerItemList, useIsDrawerOpen, DrawerNavigationProp, DrawerContentOptions } from '@react-navigation/drawer';
import { useNavigation, CompositeNavigationProp, DrawerNavigationState } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types';
import { MainDrawerParams, RootStackParams, AppNavigationProp } from '../App';
import { DrawerNavigationHelpers, DrawerDescriptorMap } from '@react-navigation/drawer/lib/typescript/src/types';

const FONT = Platform.OS === 'ios' ? 'San Francisco' : 'sans-serif'

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

// setDevices(devArr: device[]): void
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

// setCurrIndex(index: number): void
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

// setCurrDeviceParam(param: string, val: any): void
/**
 * set the current device with the provided param and value
 */
export const setCurrDeviceParam = async (params: Device) => {
  let newDevs;
  try {
    const [currIdx, devices] = await getDevices();
    if (devices === null) {
      let newDevice: Device = {};
      newDevs = [newDevice];
    } else {
      newDevs = devices.slice()
    }
    if (newDevs[currIdx] === undefined) {
      newDevs[currIdx] = {};
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

// getDevices(): number, device[]undefined
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

// getDevKey(): string
/**
 *  Get the device key of the current device
 */
export const getDevKey = async (): Promise<string | undefined> => {
  try {
    const [currIdx, devices] = await getDevices();
    return devices[currIdx].devKey;
  } catch (err) {
    console.log(err);
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


// Header component for screens

interface ScreenHeaderProps {
  left?: 'hamburger' | 'back' | 'home' | 'check' | 'add' | 'cancel' | 'info',
  text?: string,
  right?: 'hamburger' | 'back' | 'home' | 'check' | 'add' | 'cancel' | 'info',
  onCancel?: () => void,
  onInfo?: () => void,
  onCheck?: () => void,
  onAdd?: () => void,
}
/*
  'hamburger': menu hamburger; opens the navigation drawer 
  'back': back button; invokes navigate.goBack() 
  'home' : home button; navigates to the 'Home' screen 
  'check' : check button; invokes onCheck() 
  'add' : plus/add button; invokes onAdd()
  'cancel' : 'X' button; invokes onCancel()
  'info' : info button; invokes onInfo()
*/
export const ScreenHeader: FC<ScreenHeaderProps> = (props) => {
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

  const navigation = useNavigation<AppNavigationProp<'Home'>>();
  const HeaderComponent = (type: 'hamburger' | 'back' | 'home' | 'check' | 'add' | 'cancel' | 'info' | undefined) => {
    let comp = undefined;
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
      centerComponent={{ text: props.text, style: { fontSize: 24, fontFamily: FONT } }}
      rightComponent={HeaderComponent(props.right)}
    />
  );
}

/**
 * 'Base Text' component for the Open Garage App 
 * @param props same props as the Text component
 */
export const BaseText: FC<TextProps> = (props) => <Text style={[{ fontFamily: FONT }]} {...props}>{props.children}</Text>

const {
  event,
  set,
  defined,
  lessOrEq,
  eq,
  add,
  multiply,
  cond,
  clockRunning,
  Clock,
  Value,
  stopClock,
  startClock,
  spring,
  debug,
} = Animated;

function runSpring(clock: Animated.Clock, value: Animated.Adaptable<any>, velocity: Animated.Adaptable<number> | number, dest: Animated.Adaptable<number>) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0)
  };

  const config = {
    damping: 12,
    mass: 1,
    stiffness: 121.6,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: new Value(0)
  };
  return [
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.velocity, velocity),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock)
    ]),
    spring(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position
  ];
}

type BottomDraggableProps = {
  minHeight: number,
  maxHeight: number,
  threshold: number,
  thresholdGive: number,
}

export class BottomDraggable extends React.Component<BottomDraggableProps>{
  translateY: Animated.Node<any>;
  snapped: Animated.Value<number>;
  getSnapPoint: (currPos: any) => Animated.Node<any>;
  onGestureEvent: (...args: any[]) => void;
  toggleDraggable: () => void;

  constructor(props: BottomDraggableProps) {
    super(props);
    this.translateY = new Value(props.minHeight);
    const dragY = new Value(0);
    const dragVY = new Value(0);
    const absY = new Value(0);
    const state = new Value(-1);
    // this.snapped = false;
    this.snapped = new Value(0);

    const thresh = new Value(props.threshold * (1 - props.thresholdGive));
    this.getSnapPoint = (currPos) => {
      // set(this.snapped, false)
      return cond(
        lessOrEq(currPos, thresh)
        , [
          // this.snapped = false,
          // this.snapped.setValue(false),
          set(this.snapped, 0),
          set(thresh, props.threshold * (1 - props.thresholdGive)),
          props.minHeight
        ]
        , [
          set(this.snapped, 1),
          // this.snapped = true,
          set(thresh, props.threshold * (1 + props.thresholdGive)),
          props.maxHeight
        ])
    }


    this.onGestureEvent = event([{
      nativeEvent: {
        absoluteY: absY,
        translationY: dragY,
        velocityY: dragVY,
        state: state
      }
    }])

    const clock = new Clock();
    const transY = new Value();
    const oldSnapped = new Value(false);

    this.translateY = cond(eq(state, State.ACTIVE), [
      // state active
      stopClock(clock),
      // set(oldSnapped, this.snapped),
      // set(transY, sub(Dimensions.get('window').height, absY)),
      cond(eq(this.snapped, 1),
        // transY = -dragY + maxHeight
        set(transY, add(multiply(dragY, -1), props.maxHeight)),
        // transY = -dragY + minHeight
        set(transY, add(multiply(dragY, -1), props.minHeight))),
      transY
    ], [
      // state inactive
      set(
        transY,
        cond(defined(transY), runSpring(clock, transY, 5, this.getSnapPoint(transY)), props.minHeight),
        // debug('transY ', transY),
      )
    ]);

    this.toggleDraggable = () => {
      this.translateY = cond(eq(this.snapped, 0), [
        stopClock(clock),
        set(this.snapped, 1),
        runSpring(clock, this.translateY, 5, 500),
        // this.translateY
      ], [
        stopClock(clock),
        set(this.snapped, 0),
        runSpring(clock, this.translateY, 5, 100),
      ])
    }


    // this.translateY = cond(eq(this.snapped, false), [
    //   stopClock(clock),
    //   runSpring(clock, this.translateY, 5, 500),
    //   // set(this.snapped, true),
    //   // this.translateY
    // ], [
    //   stopClock(clock),
    //   runSpring(clock, this.translateY, -5, 100),
    //   // set(this.snapped, false),
    // ])
  }


  render() {
    return (
      <PanGestureHandler
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onGestureEvent}
      // failOffsetY={[-this.props.height * 1.25, this.props.height * 1.25]}
      >
        <Animated.View style={{
          // position: 'absolute',
          bottom: 0,
          width: '100%',
          height: this.translateY,
          paddingTop: 5,
          marginTop: -5,
          overflow: 'hidden',
          // transform: [{ translateY: this.translateY }]
        }}>
          <View style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -1,
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            borderRadius: 20,
            elevation: 4,
          }}>
            <View style={{
              height: '100%',
              width: '100%',
              backgroundColor: 'white',
              marginTop: 4,
              borderTopRightRadius: 20,
              borderTopLeftRadius: 20,
            }}>
              <TouchableWithoutFeedback
                style={{
                  height: 4,
                  borderRadius: 2,
                  width: '20%',
                  backgroundColor: '#55555555',
                  alignSelf: 'center',
                  marginTop: 8,
                }}
              // onPress={this.toggleDraggable}
              />
              {this.props.children}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    )
  }
}