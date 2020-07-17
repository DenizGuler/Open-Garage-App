import React, { useState, useEffect, FC } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Dimensions, ViewStyle, Image, StyleProp, ImageStyle } from 'react-native';
import 'react-native-gesture-handler';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { BaseText as Text, createAlert, useInterval, getDevices } from '../utils/utils';
import { AppNavigationProp } from '../App';
import { ScreenHeader, BottomDraggable } from '../components';
import { closeDoor, openDoor, interpResult, getControllerVars } from '../utils/APIUtils';

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
    },

    modal: {
      width: '75%',
      alignSelf: 'center',
      backgroundColor: 'white',
      padding: 25,
      borderRadius: 10,
      elevation: 4,
    },

    titleText: {
      fontSize: 30,
      marginBottom: 20,
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

  return (
    <View style={[windowStyles.cardContainer, props.style]}>
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
        createAlert('Failed to get push token for push notifications');
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
    grabInfo();
    if (Platform.OS !== 'web') {
      registerForPushNotifAsync();
    }
  }, [])

  // grab info every 3 seconds while focused on the Home screen
  useInterval(async () => {
    await grabInfo()
  }, 3000);


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

  const grabInfo = async (handle?: number) => {
    console.log('grabbing info')
    try {
      const json = await getControllerVars();
      setControlVars(json);
    } catch (err) {
      const [currIdx, devices] = await getDevices();
      if (devices.length !== 0) {
        createAlert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
      }
      console.log(err);
    }
  }

  const [buttonDisabled, setButtonDisabled] = useState(false);
  /**
   * Closes door if door is open and opens door if door is closed
   */
  const toggleDoor = async () => {
    setButtonDisabled(true)
    setTimeout(() => setButtonDisabled(false), 5000)
    try {
      // if door is open
      if (controlVars.door === 1) {
        const json = await closeDoor();
        return interpResult(json, navigation);
      } else {
        const json = await openDoor();
        return interpResult(json, navigation);
      }
    } catch (err) {
      console.log(err)
    }
  }

  const DoorIcon = (props: { style: StyleProp<ImageStyle> }) => {
    if (controlVars.door === 1) {
      return <Image source={require('../assets/icons/Open.png')} style={props.style} />
    } else if (controlVars.vehicle === 1) {
      return <Image source={require('../assets/icons/ClosedPresent.png')} style={props.style} />
    } else {
      return <Image source={require('../assets/icons/ClosedAbsent.png')} style={props.style} />
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        text={controlVars.name}
        left={'hamburger'}
      />
      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.bigButtonContainer, buttonDisabled ? styles.grey : controlVars.door ? styles.green : styles.red]}
          onPress={toggleDoor}
          activeOpacity={0.5}
          disabled={buttonDisabled}
        >
          <Text style={styles.buttonText}>{buttonDisabled ? 'Working' : controlVars.door ? 'Press to Close' : 'Press to Open'}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', maxWidth: 500 }}>
          <DoorIcon style={styles.doorIcon} />
          <View style={{ maxWidth: 550, alignSelf: 'center' }}>
            <View style={styles.row}>
              <Text style={styles.largeText}>Door </Text>
              <Text style={[styles.largeText, controlVars.door ? styles.redText : styles.greenText]}>{controlVars.door ? 'Opened' : 'Closed'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.largeText}>Vehicle   </Text>
              <Text style={[styles.largeText, controlVars.vehicle ? styles.greenText : styles.redText]}>{controlVars.vehicle ? 'Present' : 'Absent'}</Text>
            </View>
          </View>
        </View>
      </View>
      {Platform.OS !== 'web' && <BottomDraggable
        threshold={17 * Dimensions.get('window').height / 60}
        thresholdGive={.25}
        maxHeight={2 * Dimensions.get('window').height / 5}
        minHeight={Dimensions.get('window').height / 6}
        maximizedComponent={(props) => <InfoWindow vars={controlVars} {...props} />}
        minimizedComponent={(props) => (
          <Text style={{ fontSize: 26 }} {...props}>More Information</Text>
        )}
      />}
      {Platform.OS === 'web' && <View style={{
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
    width: 225,
    height: 225,
    borderRadius: 112.5,
    backgroundColor: '#121212',
    elevation: 2,
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

  grey: {
    backgroundColor: '#999'
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
    width: '80%',
    color: '#fff',
    textAlign: 'center',
    fontSize: 45,
  },

  largeText: {
    fontSize: 30,
  },

  doorIcon: {
    alignSelf: 'center',
    height: 64,
    width: 112,
  },
});