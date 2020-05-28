import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Platform } from 'react-native';
import 'react-native-gesture-handler';
import { Header, Icon } from 'react-native-elements';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { getDevKey, getOGIP, ScreenHeader } from './utils';

function HomeScreen({ navigation }) {

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState({});

  const registerForPushNotifAsync = async () => {
    if (Constants.deviceId) {
      // check if notifications permissions already granted
      const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        // if not then ask for permissions
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notifications');
        return;
      }
      let token = await Notifications.getExpoPushTokenAsync();
      console.log(token);
      setExpoPushToken(token);
    } else {
      Alert.alert('must be a physical device to receive push notificaitons')
    }
  }

  // call registerForPushNotifAsync as soon as loaded (unless on web)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerForPushNotifAsync();
    }
    const unsubscribe = navigation.addListener('focus', grabInfo);
    return unsubscribe;
  }, []);

  // states for grabInfo (can add more just name for now)
  const [name, setName] = useState('')
  const [doorStatus, setDoorStatus] = useState(true);

  const grabInfo = function () {
    getOGIP()
      .then((OGIP) => fetch('http://' + OGIP + '/jc'))
      .then((response) => response.json())
      .then((json) => {
        if (json) {
          setName(json.name)
          setDoorStatus(json.door === 1 ? true : false)
        }
      })
      .catch((err) => {
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('Settings', { screen: 'IPModal' }) }])
        setName('No Device Connected')
        console.log(err);
      })
  }

  const toggleDoor = function () {
    let req = ''
    getOGIP()
      .then((OGIP) => {
        req += 'http://' + OGIP
        let devKey = getDevKey();
        return devKey
      })
      .then((devKey) => {
        req += '/cc?dkey=' + devKey
        req += doorStatus ? '&close=1' : '&open=1'
      })
      .then(() => fetch(req))
      .then((response) => response.json())
      .then((json) => {
        if (json.result === 1) {
          // we can have the device send a notification and force an update instead of manually setting the door's status
          setDoorStatus(!doorStatus)
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('Settings', { screen: 'IPModal' }) }])
        } else {
          console.log(json.result)
        }
      })
      .catch((err) => console.log(err))
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        text={name}
        left={'hamburger'}
      />
      <View style={styles.center}>
        <TouchableOpacity
          style={styles.bigButtonContainer}
          onPress={toggleDoor}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>{doorStatus ? 'Close' : 'Open'}</Text>
        </TouchableOpacity>
        <Text style={styles.largeText}>Status: {doorStatus ? 'Opened' : 'Closed'} </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },

  bigButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#121212',
  },

  buttonText: {
    color: '#fff',
    fontSize: 60,
  },

  largeText: {
    fontSize: 40,
  },
});

export default HomeScreen;