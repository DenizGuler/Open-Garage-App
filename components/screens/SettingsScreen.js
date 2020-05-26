import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Linking, ScrollView, AsyncStorage, Button } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Header, Icon } from 'react-native-elements';
import { TouchableHighlight, TextInput } from 'react-native-gesture-handler';
import { setAutoFocusEnabled } from 'expo/build/AR';

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

function IPModal({ navigation, route }) {
  const [IP, setIP] = useState('');
  const [devKey, setDevKey] = useState('');
  // const { currIP } = route.params

  const getDevKey = async () => {
    try {
      const devKey = await AsyncStorage.getItem('devKey')
      if (devKey !== null)
        setDevKey(devKey)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {getDevKey()}, [])

  const setOGDevKey = async (key) => {
    try {
      await AsyncStorage.setItem('devKey', key);
      setDevKey(key);
    } catch (error) {
      console.log(error);
    }
  }

  const updateParams = () => {
    setOGDevKey(devKey)
      .then(navigation.navigate('Settings', { OGIP: IP }))
      .catch((err) => console.log(err))
  }

  return (
    <View>
      <Header
        containerStyle={styles.topNav}
        backgroundColor="#d8d8d8"
        leftComponent={<Icon name='chevron-left' onPress={() => navigation.goBack()} />}
        centerComponent={{ text: 'Set Device IP', style: { fontSize: 20 } }}
        rightComponent={<Icon name='check' onPress={() => updateParams()} />}
      />
      <Text style={styles.optionTitle}>IP:</Text>
      <TextInput
        style={styles.optionInput}
        onChangeText={(text) => setIP(text)}
        value={IP}
        placeholder={route.params.currIP}
      // defaultValue={route.params.currIP ? route.name : ''}
      />
      <Text style={styles.optionTitle}>Device Key:</Text>
      <TextInput
        style={styles.optionInput}
        onChangeText={(text) => setDevKey(text)}
        value={devKey}
        secureTextEntry
      />
    </View>
  );
}

function BasicSettings({ navigation, route }) {

  const [devName, setDevName] = useState('')

  const getDevKey = async () => {
    try {
      const devKey = await AsyncStorage.getItem('devKey')
      if (devKey !== null)
        return devKey
    } catch (err) {
      console.log(err)
    }
  }

  const updateBasicSettings = () => {
    getDevKey()
      .then((devKey) => 'http://' + route.params.OGIP + '/co?dkey=' + devKey)
      .then((req) => {
        if (devName !== '')
          return req + '&name=' + encodeURIComponent(devName);
        return req
      })
      .then((req) => fetch(req))
      .then((response) => response.json())
      .then((json) => {
        if (json.result == 1) {
          navigation.navigate('Settings')
        } else {
          console.log(json.result)
        }
      })
      .catch((err) => console.log(err));
  }

  return (
    <View>
      <Header
        containerStyle={styles.topNav}
        backgroundColor="#d8d8d8"
        leftComponent={<Icon name='chevron-left' onPress={() => navigation.goBack()} />}
        centerComponent={{ text: 'Set Device IP', style: { fontSize: 20 } }}
        rightComponent={<Icon name='check' onPress={() => updateBasicSettings()} />}
      />
      <Text style={styles.optionTitle}>Device Name:</Text>
      <TextInput
        style={styles.optionInput}
        onChangeText={(text) => setDevName(text)}
        value={devName}
      />

    </View>
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
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
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

function SettingsScreen({ navigation, route, test }) {
  const [hideIPPrompt, setHideIPPrompt] = useState(true);
  const [IP, setIP] = useState('');

  const docs = 'https://nbviewer.jupyter.org/github/OpenGarage/OpenGarage-Firmware/blob/master/docs/OGManual.pdf';

  const setOGIP = async (IP) => {
    try {
      await AsyncStorage.setItem('OGIP', IP);
      setIP(IP);
    } catch (error) {
      console.log(error);
    }
  };

  const getOGIP = async () => {
    try {
      const OGIP = await AsyncStorage.getItem('OGIP');
      if (OGIP !== null) {
        setIP(OGIP);
      }
    } catch (error) {
      console.log(error)
    }
  }

  if (route.params?.OGIP) { setOGIP(route.params?.OGIP) }

  useEffect(() => {
    getOGIP()
  }, []);

  return (
    <View style={styles.container}>
      <Header
        containerStyle={styles.topNav}
        backgroundColor="#d8d8d8"
        leftComponent={<Icon name='menu' onPress={() => navigation.toggleDrawer()} />}
        centerComponent={{ text: 'Settings', style: { fontSize: 20 } }}
        rightComponent={<Icon name='home' onPress={() => navigation.navigate('Home')} />}
      />
      <TextPrompt
        hidden={hideIPPrompt}
        hider={setHideIPPrompt}
        value={IP}
        setter={setIP}
        submitter={setOGIP}
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
        <Text style={{ alignSelf: 'center' }}>App Version 0</Text>
      </ScrollView>
    </View>
  );
}

function SettingsStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="IPModal" component={IPModal} />
      <Stack.Screen name="BasicSettings" component={BasicSettings} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  topNav: {
    width: '100%',
  },

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
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#aaa',
    padding: 8,
  },

  optionInput: {
    width: '100%',
    // height: 60,
    fontSize: 20,
    borderBottomWidth: 1,
    borderColor: '#aaa',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 10,
    //   height: 10,
    // },
    // shadowOpacity: 1.0,
    padding: 10,
  },
});