import React, { useState, useEffect, FC } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Platform, Dimensions, ViewStyle } from 'react-native';
import 'react-native-gesture-handler';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { getDevKey, getURL, BaseText as Text } from './utils';
import { AppNavigationProp } from '../App';
import { ScreenHeader, BottomDraggable } from '../components';

export default HomeScreen;

type ControllerVars = {
  dist: number,
  door: number,
  vehicle: number,
  rcnt: number,
  fwv: number,
  name: string,
  mac: string,
  cid: number,
  rssi: number,
}

type InfoWindowProps = {
  vars: ControllerVars,
  style?: ViewStyle,
}

const InfoWindow: FC<InfoWindowProps> = (props) => {
  // const fadeAnimation = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   Animated.timing(fadeAnimation, {
  //     toValue: .65,
  //     duration: 500,
  //   }).start();
  // }, [])

  // const [image, setImage] = useState(null);

  // useEffect(() => {
  //   getImage().then((img) => {
  //     setImage(img)
  //   })
  // }, [props.visible])

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
      marginBottom: 20,
      // borderBottomWidth: 1,
    },

    row: {
      marginVertical: 2,
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
    <View style={[windowStyles.cardContainer, props.style]}>
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
        <Text style={windowStyles.rowText}>Firmware Version:</Text>
        <Text style={windowStyles.rowText} selectable>{~~(props.vars.fwv / 100) + '.' + ~~(props.vars.fwv / 10 % 10) + '.' + ~~(props.vars.fwv % 10)}</Text>
      </View>
      {/* {image && <Image source={{ uri: image.uri }} style={{ width: 400, height: image.height / image.width * 400, alignSelf: 'center', borderRadius: 5 }} />} */}
    </View>
  );
};

function HomeScreen({ navigation }: { navigation: AppNavigationProp<'Home'> }) {
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
  let pollInterval: number;
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      grabInfo();
      clearInterval(pollInterval);
      pollInterval = setInterval(grabInfo, 5000);
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      clearInterval(pollInterval);
    })
    return unsub;
  }, [navigation]);

  // state for grabInfo
  const [controlVars, setControlVars] = useState<ControllerVars>({
    dist: 0,
    door: 0,
    vehicle: 0,
    rcnt: 0,
    fwv: 0,
    name: 'No Device Found',
    mac: 'No Device Found',
    cid: 0,
    rssi: 0,
  })

  const grabInfo = async () => {
    try {
      let url = await getURL();
      if (url === 'no devices') return;
      const response = await fetch(url + '/jc');
      const json = await response.json();
      if (json.message !== undefined) throw Error(json.message)
      if (json) setControlVars(json);
    } catch (err) {
      clearInterval(pollInterval);
      Alert.alert('No Device Found', 'No device was found at the entered address',
        [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
      console.log(err);
    }
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

  // const [infoVisible, setInfoVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* <InfoWindow visible={infoVisible} setVisible={setInfoVisible} vars={controlVars} /> */}
      <ScreenHeader
        text={controlVars.name}
        left={'hamburger'}
      // right={'info'}
      // onInfo={() => { setInfoVisible(!infoVisible) }}
      />
      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.bigButtonContainer, controlVars.door ? styles.green : styles.red]}
          onPress={toggleDoor}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>{controlVars.door ? 'Close' : 'Open'}</Text>
        </TouchableOpacity>
        <View style={{ width: '90%', maxWidth: 550 }}>
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
      {Platform.OS !== 'web' && <BottomDraggable
        threshold={17 * Dimensions.get('window').height / 60}
        thresholdGive={.25}
        maxHeight={2 * Dimensions.get('window').height / 5}
        minHeight={Dimensions.get('window').height / 6}
        maximizedComponent={(props) => <InfoWindow vars={controlVars} {...props} />}
        minimizedComponent={(props) => (
          <Text style={{ fontSize: 26 }} {...props}>More Information</Text>
        )
        }
      />}
      {Platform.OS === 'web' && <View style={{
        // position: 'absolute',
        // zIndex: 2,
        // bottom: 0,
        // left: -360,
        alignSelf: "center",
        width: '100%',
        maxWidth: 600
      }}>
        <InfoWindow vars={controlVars} />
      </View>}
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
    fontSize: 30,
  },
});