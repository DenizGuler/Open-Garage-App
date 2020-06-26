import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Platform, Image, Dimensions } from 'react-native';
import 'react-native-gesture-handler';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { getDevKey, ScreenHeader, getURL, getImage, BaseText as Text, BottomDraggable } from './utils';
// import Animated from 'react-native-reanimated';
// import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
// import SwipeUpDown from 'react-native-swipe-up-down';
// import { Overlay, Icon } from 'react-native-elements';

export default HomeScreen;

const InfoWindow = (props) => {
  // const fadeAnimation = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   Animated.timing(fadeAnimation, {
  //     toValue: .65,
  //     duration: 500,
  //   }).start();
  // }, [])

  const [image, setImage] = useState(null);

  useEffect(() => {
    getImage().then((img) => {
      setImage(img)
    })
  }, [props.visible])

  const windowStyles = StyleSheet.create({
    backdrop: {
      position: "absolute",
      backgroundColor: '#52525299',
      // opacity: .65,
      width: '100%',
      height: '100%',
    },

    cardContainer: {
      flex: 1,
      alignContent: 'center',
      padding: 20,
      paddingTop: 12,
      // justifyContent: 'center',
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
      fontSize: 30,
      // padding: 10,
      marginBottom: 10,
      // borderBottomWidth: 1,
    },

    row: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    rowText: {
      fontSize: 20,
    },

    closeButton: {
      position: 'absolute',
      top: -15,
      right: -15,
    }
  })

  // if (!props.visible) return null;
  return (
    <View style={windowStyles.cardContainer}>
      {/* <Icon containerStyle={windowStyles.closeButton} name='close' size={28}/> */}
      <Text style={windowStyles.titleText}>More Information</Text>
      <View style={windowStyles.row}>
        <Text style={windowStyles.rowText}>Distance:</Text>
        <Text style={windowStyles.rowText}>{props.vars.dist} cm</Text>
      </View>
      <View style={windowStyles.row}>
        <Text style={windowStyles.rowText}>Read Count:</Text>
        <Text style={windowStyles.rowText}>{props.vars.rcnt}</Text>
      </View>
      <View style={windowStyles.row}>
        <Text style={windowStyles.rowText}>WiFi Signal:</Text>
        <Text style={windowStyles.rowText}>{props.vars.rssi} dBm</Text>
      </View>
      <View style={windowStyles.row}>
        <Text style={windowStyles.rowText}>MAC address:</Text>
        <Text style={windowStyles.rowText} selectable>{props.vars.mac}</Text>
      </View>
      <View style={windowStyles.row}>
        <Text style={windowStyles.rowText}>Firmware Version</Text>
        <Text style={windowStyles.rowText} selectable>{props.vars.fwv}</Text>
      </View>
      {/* {image && <Image source={{ uri: image.uri }} style={{ width: 400, height: image.height / image.width * 400, alignSelf: 'center', borderRadius: 5 }} />} */}
    </View>
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
      {/* <InfoWindow visible={infoVisible} setVisible={setInfoVisible} vars={controlVars} /> */}
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
        <View>
          <View style={styles.row}>
            <Text style={styles.largeText}>Door Status  </Text>
            <Text style={[styles.largeText, controlVars.door ? styles.redText : styles.greenText]}>{controlVars.door ? 'Opened' : 'Closed'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.largeText}>Vehicle Status  </Text>
            <Text style={[styles.largeText, controlVars.vehicle ? styles.greenText : styles.redText]}>{controlVars.vehicle ? 'Present' : 'Absent'}</Text>
          </View>
        </View>
      </View>
      {/* <View style={{ position: 'absolute', bottom: 0, width: '100%', height: 75 }}> */}
      <BottomDraggable
        threshold={17 * Dimensions.get('window').height / 60}
        thresholdGive={.25}
        maxHeight={2 * Dimensions.get('window').height / 5}
        minHeight={Dimensions.get('window').height / 6}
      >
        <InfoWindow vars={controlVars} />
      </BottomDraggable>
      {/* </View> */}
      {/* <ScrollView
        style={{
          position: 'absolute',
          top: '90%',
          width: '100%',
        }}
        contentContainerStyle={{
          backgroundColor: 'grey',
          display: 'flex',
          alignItems: 'center',
          // height: 100,
        }}
      >
        <InfoWindow vars={controlVars}/>
      </ScrollView> */}
      {/* <SwipeUpDown
        itemMini={
          <View style={{ alignItems: 'center' }}>
            <Text>This is the mini view, swipe up!</Text>
          </View>
        } // Pass props component when collapsed
        itemFull={<InfoWindow vars={controlVars} />} // Pass props component when show full
        // onShowMini={() => console.log('mini')}
        // onShowFull={() => console.log('full')}
        // onMoveDown={() => console.log('down')}
        // onMoveUp={() => console.log('up')}
        disablePressToShow={true} // Press item mini to show full
        style={{
          backgroundColor: 'white',
          elevation: 10,
        }} // style for swipe
      /> */}
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

  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  green: {
    backgroundColor: '#2a2'
  },

  red: {
    backgroundColor: '#a22'
  },

  greenText: {
    alignSelf: 'flex-end',
    color: '#2a2'
  },

  redText: {
    alignSelf: 'flex-end',
    color: '#a22'
  },

  buttonText: {
    color: '#fff',
    fontSize: 60,
  },

  largeText: {
    fontSize: 34,
  },
});