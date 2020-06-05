import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Linking, ScrollView, AsyncStorage, Button, Alert, Picker, Switch } from 'react-native';
import 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableHighlight, TextInput } from 'react-native-gesture-handler';
import { getDevKey, getOGIP, ScreenHeader, getDevices, setDevices } from './utils'
import { ButtonGroup, CheckBox } from 'react-native-elements';
import { StackActions } from '@react-navigation/native';

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
  const [currIP, setCurrIP] = useState('');
  const [IP, setIP] = useState('');
  const [devKey, setDevKey] = useState('');
  // const { currIP } = route.params

  useEffect(() => { getDevKey().then((key) => setDevKey(key)) }, [])

  const setOGIP = async (IP) => {
    if (IP) {
      let newDev;
      try {
        const [currDev, devices] = await getDevices();
        // copy the array to change it
        if (devices === null) {
          newDev = [{ id: 0 , OGIP: '', devKey: '' }];
        } else {
          newDev = devices.slice()
        }
        if (newDev[currDev] === undefined) {
          newDev[currDev] = { id: currDev , OGIP: '', devKey: '' };
        }
        newDev[currDev].OGIP = IP
        await setDevices(newDev);
        setIP(IP);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const setOGDevKey = async (key) => {
    let newDev;
    try {
      const [currDev, devices] = await getDevices();
      // copy the array to change it
      if (devices === null) {
        newDev = [{ id: 0 , OGIP: '', devKey: '' }];
      } else {
        newDev = devices.slice()        
      }
      if (newDev[currDev] === undefined) {
        newDev[currDev] = { id: currDev , OGIP: '', devKey: '' };
      }
      newDev[currDev].devKey = key
      await setDevices(newDev);
      setDevKey(key);
    } catch (error) {
      console.log(error);
    }
  };

  const updateParams = () => {
    setOGDevKey(devKey)
      .then(() => setOGIP(IP))
      .catch((err) => console.log(err))
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getOGIP().then((OGIP) => setCurrIP(OGIP));
    })
    return unsubscribe;
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps={"handled"}
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
        <Text style={styles.optionTitle}>IP:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setIP(text)}
          value={IP}
          placeholder={currIP}
          onSubmitEditing={() => setOGIP(IP)}
          autoCapitalize={"none"}
        />
        <Text style={styles.optionTitle}>Device Key:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setDevKey(text)}
          value={devKey}
          onSubmitEditing={() => setOGDevKey(devKey)}
          secureTextEntry
        />
      </View>
    </ScrollView>
  );
}

function BasicSettings({ navigation, route }) {

  const [currParams, setCurrParams] = useState({});
  const setParam = (param, val) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const getCurrParams = () => {
    getOGIP()
      .then((OGIP) => fetch('http://' + OGIP + '/jo'))
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
    getDevKey()
      .then((devKey) => 'http://' + route.params.OGIP + '/co?dkey=' + devKey)
      .then((req) => {
        Object.keys(currParams).forEach((key) => {
          req += '&' + key + '=' + encodeURIComponent(currParams[key])
        })
        return req
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
  const [IP, setIP] = useState('');

  const docs = 'https://nbviewer.jupyter.org/github/OpenGarage/OpenGarage-Firmware/blob/master/docs/OGManual.pdf';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getOGIP().then((OGIP) => setIP(OGIP));
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
      <TextPrompt
        hidden={hideIPPrompt}
        hider={setHideIPPrompt}
        value={IP}
        setter={setIP}
        // submitter={setOGIP}
        getter={getOGIP}
      />
      <ScrollView contentContainerStyle={styles.list}>
        <Setting
          text="Open Garage Device IP & Key"
          subText={IP}
          onPress={() =>
            //setHideIPPrompt(!hideIPPrompt)
            navigation.navigate('IPModal', { currIP: IP })
          }
        />
        <Setting
          text="Basic Device Settings"
          subText={'Configure basic settings'}
          onPress={() => navigation.navigate('BasicSettings', { OGIP: IP })}
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

  useEffect(() => {
    StackActions.reset
  }, [])

  return (
    <Stack.Navigator
    initialRouteName='Settings'
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