import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Linking, ScrollView, AsyncStorage, Button, Alert, Picker } from 'react-native';
import 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableHighlight, TextInput } from 'react-native-gesture-handler';
import { getDevKey, ScreenHeader, getDevices, setDevices, getURL, getConInput } from './utils'
import { ButtonGroup, CheckBox } from 'react-native-elements';
import { CommonActions } from '@react-navigation/native';

export default SettingsStack;

const Stack = createStackNavigator();

const Setting = (props) => {
  return (
    <TouchableHighlight
      style={styles.settingButton}
      onPress={props.onPress}
      underlayColor="#e0efff"
      activeOpacity={1}
    >
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.settingText}>{props.text}</Text>
        <Text style={styles.setttingSubText}>{props.subText ? props.subText : ''}</Text>
      </View>
    </TouchableHighlight>
  )
};

function IPModal({ navigation }) {
  const CON_METHODS = ['IP', 'OTF']

  const [device, setDevice] = useState({
    conMethod: 'IP',
    conInput: '',
    devKey: '',
  });

  const setDeviceParam = (param, val) => {
    setDevice({
      ...device,
      [param]: val,
    });
  }

  useEffect(() => {
    getDevices().then((tuple) => {
      const [currIdx, devs] = tuple
      if (devs !== null && devs[currIdx] !== undefined)
        return setDevice(devs[currIdx])
    })
    // const unsubscribe = navigation.addListener('blur', () => {
    //   navigation.dispatch(
    //     CommonActions.reset({
    //       index: 0,
    //       routes: [{ name: 'Settings' }],
    //     })
    //   )
    // })
    // return unsubscribe
  }, [])

  const updateDeivce = async (param) => {

    if (param === undefined || param === 'conMethod') {
      // regex for an IP address (can probably be improved)
      if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(device.conInput)) {
        setDeviceParam('conMethod', 'IP')
        device.conMethod = 'IP'
      } else {
        setDeviceParam('conMethod', 'OTF')
        device.conMethod = 'OTF'
      }
    }

    let newDevs;
    try {
      const [currDev, devices] = await getDevices();
      // copy the array to change it
      if (devices === null) {
        newDevs = [{}];
      } else {
        newDevs = devices.slice()
      }
      if (newDevs[currDev] === undefined) {
        newDevs[currDev] = {};
      }
      // console.log(device)
      if (param === undefined) {
        newDevs[currDev] = device
      } else {
        newDevs[currDev][param] = device[param]
      }
      console.log(newDevs)
      await setDevices(newDevs);
      // await setDevice(device);
    } catch (error) {
      console.log(error);
    }
  }

  const updateParams = () => {
    updateDeivce().catch((err) => console.log(err))
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps={"handled"}
      stickyHeaderIndices={[0]}
    >
      <ScreenHeader
        text={'Set Device IP'}
        left={'back'}
        right={'check'}
        onCheck={() => {
          updateParams();
          navigation.goBack();
        }}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>Connection Method:</Text>
        <ButtonGroup
          onPress={(idx) => setDeviceParam('conMethod', CON_METHODS[idx])}
          selectedIndex={CON_METHODS.indexOf(device.conMethod)}
          buttons={['IP', 'OTF']}
          containerStyle={{ width: '85%', alignSelf: 'center' }}
          disabled
        />
        <Text style={styles.optionTitle}>IP or OTF Token:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setDeviceParam('conInput', text)}
          value={device.conInput}
          placeholder={'e.g.: 127.0.0.1 or [token]'}
          onSubmitEditing={() => {
            updateDeivce('conInput')
              .then(() => updateDeivce('conMethod'))
          }}
          autoCapitalize={"none"}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Device Key:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setDeviceParam('devKey', text)}
          value={device.devKey}
          onSubmitEditing={() => updateDeivce('devKey')}
          secureTextEntry
          selectTextOnFocus
        />
        {/* <Text>{JSON.stringify(device)}</Text> */}
      </View>
    </ScrollView>
  );
}

function BasicSettings({ navigation }) {

  const [currParams, setCurrParams] = useState({});
  const setParam = (param, val) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const getCurrParams = () => {
    getURL()
      .then((url) => fetch(url + '/jo'))
      .then((response) => response.json())
      .then((json) => {
        setCurrParams(json);
      })
      .catch((err) => {
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPModal') }])
        console.log(err);
      })
  }

  const updateBasicSettings = () => {
    Promise.all([getURL(), getDevKey()])
      .then((values) => {
        const [url, devKey] = values;
        return url + '/co?dkey=' + devKey;
      })
      .then((req) => {
        Object.keys(currParams).forEach((key) => {
          req += '&' + key + '=' + encodeURIComponent(currParams[key]);
        })
        return req;
      })
      .then((req) => fetch(req))
      .then((response) => response.json())
      .then((json) => {
        if (json.result === 1) {
          navigation.goBack();
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPModal') }])
        } else {
          console.log('ERROR CODE: ' + json.result)
        }
      })
      .catch((err) => {
        console.log(err)
        Alert.alert('Invalid Device IP', 'Was not able to establish a connection with the entered device IP. Are you sure the IP is correct and the device is on?', [{ text: 'OK' }])
      });
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getCurrParams();
    });
    return unsubscribe;
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
      keyboardShouldPersistTaps={'handled'}
      stickyHeaderIndices={[0]}
    >
      <ScreenHeader
        text={'Basic Settings'}
        left={'back'}
        right={'check'}
        onCheck={updateBasicSettings}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>Device Name:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('name', text)}
          value={currParams.name}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Door Sensor:</Text>
        <View style={{ backgroundColor: '#fff', paddingVertical: 5 }}>
          <Picker
            style={styles.optionPicker}
            // itemStyle={styles.optionInput}
            selectedValue={currParams.mnt}
            onValueChange={(type) => setParam('mnt', type)}
          >
            <Picker.Item label='Ceiling Mount' value={0} />
            <Picker.Item label='Side Mount' value={1} />
            {/* <Picker.Item label='Norm Closed Switch on GO4' value='' /> */}
            {/* <Picker.Item label='Norm Open Switch on GO4' value='' /> */}
          </Picker>
        </View>
        <Text style={styles.optionTitle}>Door Threshold (cm):</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('dth', Number(text))}
          value={'' + currParams.dth}
          keyboardType={"number-pad"}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Car Threshold (cm):</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('vth', Number(text))}
          value={'' + currParams.vth}
          // defaultValue={'' + currParams.vth}
          keyboardType={"number-pad"}
          selectTextOnFocus
        />
        <Text style={styles.setttingSubText}>set to 0 to disable  </Text>
        <Text style={styles.optionTitle}>Read Interval (s):</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('riv', Number(text))}
          value={'' + currParams.riv}
          keyboardType={"number-pad"}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Click Time (ms):</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('cdt', Number(text))}
          value={'' + currParams.cdt}
          keyboardType={"number-pad"}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Distance Read (ms):</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('dri', Number(text))}
          value={'' + currParams.dri}
          keyboardType={"number-pad"}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Sensor Timeout:</Text>
        <ButtonGroup
          onPress={(idx) => setParam('sto', idx)}
          selectedIndex={currParams.sto}
          buttons={['Ignore', 'Cap']}
          containerStyle={{ width: '85%', alignSelf: 'center' }}
        />
        <Text style={styles.optionTitle}>Sound Alarm:</Text>
        <View style={{ backgroundColor: '#fff', paddingVertical: 5 }}>
          <Picker
            style={styles.optionPicker}
            selectedValue={currParams.alm}
            onValueChange={(type) => setParam('alm', type)}
          >
            <Picker.Item label="Disabled" value={0} />
            <Picker.Item label="5 seconds" value={1} />
            <Picker.Item label="10 seconds" value={2} />
          </Picker>
        </View>
        {/* <View style={{flex: 1, flexDirection:'row' , justifyContent: 'space-between'}}>
          <Text style={styles.optionTitle}>Disable Alarm:</Text>
          <CheckBox 
            checked={}
          />
        </View> */}
        <Text style={styles.optionTitle}>Log Size:</Text>
        <View style={{ backgroundColor: '#fff', paddingVertical: 5 }}>
          <Picker
            style={styles.optionPicker}
            selectedValue={currParams.lsz}
            onValueChange={(type) => setParam('lsz', type)}
          >
            <Picker.Item label="20" value={20} />
            <Picker.Item label="50" value={50} />
            <Picker.Item label="100" value={100} />
            <Picker.Item label="200" value={200} />
            <Picker.Item label="400" value={400} />
          </Picker>
        </View>
        <Text style={styles.optionTitle}>T/H Sensor:</Text>
        <View style={{ backgroundColor: '#fff', paddingVertical: 5 }}>
          <Picker
            style={styles.optionPicker}
            selectedValue={currParams.tsn}
            onValueChange={(type) => setParam('tsn', type)}
          >
            <Picker.Item label="(none)" value={0} />
            <Picker.Item label="AM2320 (I2C)" value={1} />
            <Picker.Item label="DHT11 on G05" value={2} />
            <Picker.Item label="DHT22 on G05" value={3} />
            <Picker.Item label="DS18B20 on G05" value={4} />
          </Picker>
        </View>
      </View>

    </ScrollView>
  )
}

const TextPrompt = (props) => {
  if (!props.hidden) {
    return (
      <View style={styles.modal}>
        <Text>IP:</Text>
        <TextInput
          style={[styles.input]}
          // {...props}
          onChangeText={(text) => props.setter(text)}
          value={props.value}
          onSubmitEditing={() => {
            props.hider(!props.hidden);
            props.submitter(props.value);
          }}
        />
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }} accessible={false}>
          <Button
            style={styles.button}
            onPress={() => {
              props.hider(!props.hidden);
              props.submitter(props.value);
            }}
            title={'OK'} />
          <Button
            style={styles.button}
            onPress={() => {
              props.hider(!props.hidden);
              props.getter();
            }}
            title={'Cancel'} />
        </View>
      </View>
    )
  }
  return null;
}

function SettingsScreen({ navigation }) {
  const [hideIPPrompt, setHideIPPrompt] = useState(true);
  const [conInput, setConInput] = useState('');

  const docs = 'https://nbviewer.jupyter.org/github/OpenGarage/OpenGarage-Firmware/blob/master/docs/OGManual.pdf';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getConInput().then((conInput) => setConInput(conInput));
    })
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader
        text={'Settings'}
        left={'hamburger'}
        right={'home'}
      />
      {/* <TextPrompt
        hidden={hideIPPrompt}
        hider={setHideIPPrompt}
        value={IP}
        setter={setIP}
        // submitter={setOGIP}
        getter={getOGIP}
      /> */}
      <ScrollView contentContainerStyle={styles.list}>
        <Setting
          text="Open Garage Device IP & Key"
          subText={conInput}
          onPress={() =>
            //setHideIPPrompt(!hideIPPrompt)
            navigation.navigate('IPModal')
          }
        />
        <Setting
          text="Basic Device Settings"
          subText={'Configure basic settings'}
          onPress={() => navigation.navigate('BasicSettings')}
        />
        <Setting
          text="Documentation"
          subText={"Links you out of this app"}
          onPress={() => {
            Linking.canOpenURL(docs).then(supported => {
              if (supported) {
                Linking.openURL(docs);
              } else {
                console.log('could not open docs');
              }
            });
          }}
        />
        <Setting
          text="Clear AsyncStorage"
          subText="DEBUG"
          onPress={() => {
            AsyncStorage.clear()
          }}
        />
        <Text style={{ alignSelf: 'center' }}>App Version 0</Text>
      </ScrollView>
    </View>
  );
}

function SettingsStack({ navigation }) {

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('blur', () => {
  //     navigation.dispatch(
  //       CommonActions.reset({
  //         index: 0,
  //         routes: [{ name: 'Settings' }],
  //       })
  //     )
  //   })
  //   return unsubscribe
  // }, [navigation])

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="IPModal" component={IPModal} />
      <Stack.Screen name="BasicSettings" component={BasicSettings} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    // maxWidth: 600,
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },

  input: {
    width: '70%',
    alignSelf: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    borderRadius: 2,
    marginVertical: 10,
  },

  list: {
    display: 'flex',
    maxWidth: 600,
    width: '100%',
    padding: 5,
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'center',
  },

  settingButton: {
    // flex: 1,
    // justifyContent: 'center',
    height: 60,
    // margin: 2,
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    borderRadius: 3,
  },

  settingText: {
    fontSize: 20,
  },

  setttingSubText: {
    alignSelf: 'flex-end',
    fontSize: 16,
    color: '#aaa',
  },

  modal: {
    position: 'absolute',
    zIndex: 1,
    top: '35%',
    width: '85%',
    maxWidth: 510,
    padding: 20,
    borderRadius: 2,
    alignSelf: 'center',
    alignContent: 'center',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
  },

  button: {
    display: 'flex',
    flexBasis: 1,
    flexGrow: 1,
    margin: 5,
  },

  optionTitle: {
    fontSize: 26,
    // width: '100%',
    // borderBottomWidth: 1,
    // borderColor: '#aaa',
    padding: 8,
  },

  optionInput: {
    width: '100%',
    fontSize: 20,
    color: '#000',
    backgroundColor: '#fff',
    padding: 10,
  },

  optionPicker: {
    alignSelf: 'center',
    width: '84%',
    height: 40,
    transform: [
      { scaleX: 1.18 },
      { scaleY: 1.18 },
    ],
    // backgroundColor: '#fff',
    padding: 10,
  },

  fsModal: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
});