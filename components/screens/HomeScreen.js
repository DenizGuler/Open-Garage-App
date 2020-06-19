import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Platform } from 'react-native';
import 'react-native-gesture-handler';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { getDevKey, ScreenHeader, getURL } from './utils';
import Animated from 'react-native-reanimated';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Overlay } from 'react-native-elements';

export default HomeScreen;

const InfoWindow = (props) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: .65,
      duration: 500,
    }).start();
  }, [])

  const windowStyles = StyleSheet.create({
    backdrop: {
      position: "absolute",
      backgroundColor: '#52525299',
      // opacity: .65,
      width: '100%',
      height: '100%',
    },

    centered: {
      flex: 1,
      alignContent: 'center',
      justifyContent: 'center',
    },

    modal: {
      width: '75%',
      alignSelf: 'center',
      backgroundColor: 'white',
      padding: 25,
      // height: '75%',
      borderRadius: 10,
      elevation: 4,
    },

    titleText: {
      fontSize: 26,
    },

    bodyText: {
      fontSize: 20,
    }
  })

  if (!props.visible) return null;
  return (

    <Overlay
      animationType='slide'
      isVisible={props.visible}
      backdropStyle={windowStyles.backdrop}
      overlayStyle={windowStyles.modal}
      onBackdropPress={() => props.setVisible(false)}
    >
      <Text style={windowStyles.titleText}>More Information:</Text>
      <Text style={windowStyles.bodyText}>Distance: {props.vars.dist}</Text>
      <Text style={windowStyles.bodyText}>Read Count: {props.vars.rcnt}</Text>
      <Text style={windowStyles.bodyText}>WiFi Signal: {props.vars.rssi}</Text>
      <Text style={windowStyles.bodyText}>MAC address:</Text>
      <Text style={windowStyles.bodyText}>{props.vars.mac}</Text>
      
    </Overlay>
  );
};

function HomeScreen({ navigation }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState({});

  // registers device for Expo push notifications ands sets the expoPushToken state to this device's
  // expo push token, we can use this with FCM, APNS, OTF, or HTTP requests.
  const registerForPushNotifAsync = async () => {
    if (Constants.isDevice) {
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
      // Alert.alert('must be a physical device to receive push notificaitons')
    }
  }

  // call registerForPushNotifAsync as soon as loaded (unless on web)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerForPushNotifAsync();
    }
  }, [])

  // grab info every 5 seconds while focused on the Home screen
  let pollInterval;
  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      grabInfo();
      clearInterval(pollInterval);
      pollInterval = setInterval(grabInfo, 5000);
    });
    return unsubFocus;
  }, [navigation]);

  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      clearInterval(pollInterval);
    })
    return unsubBlur;
  }, [navigation]);

  // state for grabInfo
  const [controlVars, setControlVars] = useState({
    dist: 0,
    door: 0,
    vehicle: 0,
    rcnt: 0,
    fwv: 0,
    name: 'No Device Found',
    mac: '',
    cid: 0,
    rssi: 0,
  })

  const grabInfo = function () {
    getURL()
      .then((url) => {
        return fetch(url + '/jc')
      })
      .then((response) => response.json())
      .then((json) => {
        if (json) {
          setControlVars(json);
        }
      })
      .catch((err) => {
        clearInterval(pollInterval);
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        console.log(err);
      })
  }

  const toggleDoor = function () {
    let req = ''
    getURL()
      .then((url) => {
        req += url
        let devKey = getDevKey();
        return devKey
      })
      .then((devKey) => {
        req += '/cc?dkey=' + devKey
        req += controlVars.door ? '&close=1' : '&open=1'
      })
      .then(() => fetch(req))
      .then((response) => response.json())
      .then((json) => {
        if (json.result === 1) {
          // we can have the controller send a notification and force an update
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        } else {
          console.log(json.result);
        }
      })
      .catch((err) => {
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        console.log(err)
      })
  }

  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <View style={styles.container}>
      <InfoWindow visible={infoVisible} setVisible={setInfoVisible} vars={controlVars} />
      <ScreenHeader
        text={controlVars.name}
        left={'hamburger'}
        right={'info'}
        onInfo={() => { setInfoVisible(!infoVisible) }}
      />
      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.bigButtonContainer, controlVars.door ? styles.green : styles.red]}
          onPress={toggleDoor}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>{controlVars.door ? 'Close' : 'Open'}</Text>
        </TouchableOpacity>
        <Text style={styles.largeText}>Status: <Text style={controlVars.door ? styles.redText : styles.greenText}>{controlVars.door ? 'Opened' : 'Closed'}</Text></Text>
      </View>
    </View >
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
    // borderWidth: 1,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#121212',
  },

  green: {
    backgroundColor: '#2a2'
  },

  red: {
    backgroundColor: '#a22'
  },

  greenText: {
    color: '#2a2'
  },

  redText: {
    color: '#a22'
  },

  buttonText: {
    color: '#fff',
    fontSize: 60,
  },

  largeText: {
    fontSize: 40,
  },
});