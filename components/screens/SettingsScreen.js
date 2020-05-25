import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Linking, ScrollView, AsyncStorage, Button } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Header, Icon } from 'react-native-elements';
import { TouchableHighlight, TextInput } from 'react-native-gesture-handler';

export default SettingsScreen;

const Stack = createStackNavigator();

const Setting = (props) => {
  return (
    <TouchableHighlight
      style={styles.settingButton}
      onPress={props.onPress}
      underlayColor="#e0efff"
      activeOpacity={1}
    >
      <Text style={styles.settingText}>{props.text}</Text>
    </TouchableHighlight>
  )
};

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
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly'}}>
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

  useEffect(() => { getOGIP() }, []);

  return (
    <View style={styles.container}>
      <Header
        containerStyle={styles.topNav}
        backgroundColor="#d8d8d8"
        leftComponent={<Icon name='menu' onPress={() => navigation.toggleDrawer()} />}
        centerComponent={{ text: 'Settings' }}
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
        <Setting text="Set IP of Open Garage Device" onPress={() => setHideIPPrompt(!hideIPPrompt)} />
        <Setting
          text="Documentation"
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
    justifyContent: 'center',
    height: 50,
    // margin: 2,
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    borderRadius: 3,
  },

  settingText: {
    fontSize: 20,
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
});