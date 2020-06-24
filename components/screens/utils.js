import React, { useRef, useState, useEffect } from 'react';
import { AsyncStorage, StyleSheet, Platform, Text, Dimensions } from "react-native";
import { Icon, Header } from "react-native-elements";
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const FONT = Platform.OS === 'ios' ? 'San Francisco' : 'sans-serif'
/*
  device obj{
    conMethod: 'IP' | 'OTF',
    conInput: string,
    devKey: string,
    image?: {
      uri: string,
      width: number,
      height: number,
    },
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

// Get the image attached to the device at the given index/current device
// Returns undefined if no image exists
// getImage(index?: number): image
export const getImage = async (index) => {
  try {
    const [currIdx, devices] = await getDevices();
    index = (index === undefined) ? currIdx : index
    let device = devices[index]
    return device.image
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
      centerComponent={{ text: props.text, style: { fontSize: 24, fontFamily: FONT } }}
      rightComponent={HeaderComponent(props.right)}
    />
  );
}

export const BaseText = (props) => <Text {...props} style={[{ fontFamily: FONT }, props.style]}>{props.children}</Text>

const {
  event,
  set,
  defined,
  greaterOrEq,
  lessOrEq,
  eq,
  sub,
  add,
  multiply,
  cond,
  min,
  max,
  or,
  not,
  clockRunning,
  Clock,
  Value,
  stopClock,
  startClock,
  spring,
  debug,
} = Animated;

function runSpring(clock, value, velocity, dest) {
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

export class BottomDraggable extends React.Component {

  constructor(props) {
    super(props);
    this.translateY = new Value(props.minHeight);
    const dragY = new Value(0);
    const dragVY = new Value(0);
    const absY = new Value(0);
    const state = new Value(-1);
    const snapped = new Value(false);

    const thresh = new Value(props.threshold * (1 - props.thresholdGive));
    this.getSnapPoint = (currPos) => {
      // debug('snapped: ', snapped)
      // cond(snapped, setThresh(-props.threshold - props.thresholdGive), setThresh(-props.threshold + props.thresholdGive))
      // console.log(thresh)
      return cond(
        lessOrEq(currPos, thresh)
      , [
        set(snapped, false),
        set(thresh, props.threshold * (1 - props.thresholdGive)),
        props.minHeight
      ], [
        set(snapped, true),
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
        set(oldSnapped, snapped),
        // set(transY, sub(Dimensions.get('window').height, absY)),
        cond(oldSnapped, 
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
  }

  // console.log(greaterOrEq(currPos, new Value(-props.threshold)))
  // return greaterOrEq(currPos, new Value(-props.threshold)) ? 0 : -props.height

  render() {
    return (
      <PanGestureHandler
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onGestureEvent}
        // failOffsetY={[-this.props.height * 1.25, this.props.height * 1.25]}
      >
        <Animated.View style={{
          position: 'absolute',
          bottom: 0, 
          width: '100%',
          height: this.translateY,
          paddingTop: 5,
          marginTop: -5,
          overflow: 'hidden',
          // transform: [{ translateY: this.translateY }]
        }}>
          {this.props.children}
        </Animated.View>
      </PanGestureHandler>
    )
  }
}