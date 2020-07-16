import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Linking, ScrollView, AsyncStorage, Alert, Platform, Image } from 'react-native';
import 'react-native-gesture-handler';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { getDevKey, getDevices, getURL, getConInput, BaseText as Text, setDeviceParam, createAlert } from '../utils/utils'
import { Icon, Divider } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RadioButton, Checkbox } from 'react-native-paper';
import { RootStackParams, AppNavigationProp } from '../App';
import { FullLengthButton, ScreenHeader } from '../components';
import { getControllerOptions, changeControllerOptions, interpResult } from '../utils/APIUtils';
import { Device, ControllerOptions } from '../utils/types';

export function IPSettings({ navigation }: StackScreenProps<RootStackParams, 'IPSettings'>) {
  const [deviceState, setDeviceState] = useState<Device>({
    conMethod: 'IP',
    conInput: '',
    // devKey: '',
    // image: undefined,
  });
  const setDeviceStateParam = (param: Device) => {
    setDeviceState({
      ...deviceState,
      ...param,
    });
  }

  useEffect(() => {
    getDevices().then((tuple) => {
      const [currIdx, devs] = tuple
      if (devs !== null && devs[currIdx] !== undefined)
        return setDeviceState(devs[currIdx])
    })
  }, [])

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestCameraRollPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required')
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    })

    if (!result.cancelled) {
      setDeviceStateParam({ image: result });
    }
  }

  const updateParams = async () => {
    return await setDeviceParam(deviceState).catch((err) => console.log(err))
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, backgroundColor: '#fff' }}
      keyboardShouldPersistTaps={"handled"}
      stickyHeaderIndices={[0]}
    >
      <ScreenHeader
        text={'Set Device IP'}
        left={'back'}
        right={'check'}
        onCheck={() => {
          updateParams().then(() => {
            navigation.goBack();
          });
        }}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>IP or OTF Token: {deviceState.conMethod}</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setDeviceStateParam({ conInput: text })}
          value={deviceState.conInput}
          placeholder={'e.g.: 127.0.0.1 or [token]currDev'}
          onSubmitEditing={() => {
            setDeviceParam({ conInput: deviceState.conInput })
              .then(() => setDeviceParam({ conMethod: deviceState.conMethod }))
          }}
          autoCapitalize={"none"}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Device Key:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setDeviceStateParam({ devKey: text })}
          value={deviceState.devKey}
          onSubmitEditing={() => setDeviceParam({ devKey: deviceState.devKey })}
          secureTextEntry
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>Site Image:</Text>
        <TouchableOpacity
          onPress={pickImage}
        >
          <View style={[styles.optionInput, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
            {deviceState.image !== undefined ?
              <Image source={{ uri: deviceState.image.uri }}
                style={{
                  width: 200,
                  height: Platform.OS === 'web' ? 180 : deviceState.image.height / deviceState.image.width * 200
                }} /> :
              <Icon name='image' type='material-community' />
            }
            <Text style={styles.optionText}>Pick Image</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export function BasicSettings({ navigation }: StackScreenProps<RootStackParams, 'BasicSettings'>) {
  const [currParams, setCurrParams] = useState<ControllerOptions>({});
  const setParam = (param: string, val: any) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const grabCurrParams = async () => {
    try {
      let json = await getControllerOptions()
      setCurrParams(json);
    } catch (err) {
      createAlert('No Device Found', 'No device was found at the entered address',
        [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
      console.log(err)
    }
  }

  const updateSettings = () => {
    changeControllerOptions(currParams)
      .then((json) => {
        if (json.message !== undefined) {
          throw Error(json.message)
        } else if (json.result === 1) {
          navigation.goBack();
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
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
    grabCurrParams();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps={'handled'}
      stickyHeaderIndices={[0]}
    >
      <ScreenHeader
        text={'Basic Settings'}
        left={'back'}
        right={'check'}
        onCheck={updateSettings}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>Device Name:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('name', text)}
          value={currParams.name}
          selectTextOnFocus
        />
        <Text style={styles.radioTitle}>Door Sensor:</Text>
        <Divider />
        <RadioButton.Group
          onValueChange={(value) => setParam('mnt', Number(value))}
          value={'' + currParams.mnt}
        >
          <RadioButton.Item label='Ceiling Mount' value='0' />
          <RadioButton.Item label='Side Mount' value='1' />
          <RadioButton.Item label='Norm Closed Switch on GO4' value='2' />
          <RadioButton.Item label='Norm Open Switch on GO4' value='3' />
        </RadioButton.Group>
        <Divider />
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
        <Text style={styles.optionHelperText}>set to 0 to disable  </Text>
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
        <Text style={styles.radioTitle}>Sensor Timeout:</Text>
        <Divider />
        <RadioButton.Group
          value={'' + currParams.sto}
          onValueChange={(value) => setParam('sto', Number(value))}
        >
          <RadioButton.Item label='Ignore' value='0' />
          <RadioButton.Item label='Cap' value='1' />
        </RadioButton.Group>
        <Divider />
        <Text style={styles.radioTitle}>Sound Alarm:</Text>
        <Divider />
        <View style={{ backgroundColor: '#fff', paddingVertical: 5 }}>
          <RadioButton.Group
            value={'' + currParams.alm}
            onValueChange={(type) => setParam('alm', Number(type))}
          >
            <RadioButton.Item label="Disabled" value='0' />
            <RadioButton.Item label="5 seconds" value='1' />
            <RadioButton.Item label="10 seconds" value='2' />
          </RadioButton.Group>
        </View>
        <Divider />
        <Text style={styles.radioTitle}>Log Size:</Text>
        <Divider />
        <RadioButton.Group
          value={'' + currParams.lsz}
          onValueChange={(type) => setParam('lsz', type)}
        >
          <RadioButton.Item label="20" value='20' />
          <RadioButton.Item label="50" value='50' />
          <RadioButton.Item label="100" value='100' />
          <RadioButton.Item label="200" value='200' />
          <RadioButton.Item label="400" value='400' />
        </RadioButton.Group>
        <Divider />
        <Text style={styles.radioTitle}>T/H Sensor:</Text>
        <Divider />
        <RadioButton.Group
          value={'' + currParams.tsn}
          onValueChange={(type) => setParam('tsn', Number(type))}
        >
          <RadioButton.Item label="(none)" value='0' />
          <RadioButton.Item label="AM2320 (I2C)" value='1' />
          <RadioButton.Item label="DHT11 on G05" value='2' />
          <RadioButton.Item label="DHT22 on G05" value='3' />
          <RadioButton.Item label="DS18B20 on G05" value='4' />
        </RadioButton.Group>
        {/* <Divider /> */}
      </View>

    </ScrollView>
  )
}

export function IntegrationSettings({ navigation }: StackScreenProps<RootStackParams, 'IntegrationSettings'>) {
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false)
  const [currParams, setCurrParams] = useState<ControllerOptions>({});
  const setParam = (param: string, val: string | number) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const grabCurrParams = async () => {
    try {
      let json = await getControllerOptions()
      setCurrParams(json);
    } catch (err) {
      createAlert('No Device Found', 'No device was found at the entered address',
        [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
      console.log(err)
    }
  }

  const updateSettings = () => {
    changeControllerOptions(currParams)
      .then((json) => {
        if (json.message !== undefined) {
          throw Error(json.message)
        } else if (json.result === 1) {
          navigation.goBack();
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
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
    grabCurrParams();
  }, [])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      stickyHeaderIndices={[0]}
    >
      <ScreenHeader
        text={'Integration Settings'}
        left={'back'}
        right={'check'}
        onCheck={updateSettings}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>OTC Token:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('auth', text)}
          value={currParams.auth}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>OTC Domain:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('bdmn', text)}
          value={currParams.bdmn}
          keyboardType={'url'}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>OTC Port:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('bprt', Number(text))}
          value={'' + currParams.bprt}
          keyboardType={'number-pad'}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>IFTTT Key:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('iftt', text)}
          value={currParams.iftt}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>MQTT Server:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('mqtt', text)}
          value={currParams.mqtt}
          keyboardType={'numbers-and-punctuation'}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>MQTT Port:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('mqpt', text)}
          value={'' + currParams.mqpt}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>MQTT Username:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('mqun', text)}
          value={currParams.mqun}
          selectTextOnFocus
        />
        <Text style={styles.optionTitle}>MQTT Password:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('mqpw', text)}
          value={currParams.mqpw}
          selectTextOnFocus
          secureTextEntry
        />
        <Text style={styles.radioTitle}>Notify me...</Text>
        <Divider />
        <Checkbox.Item
          label='On Door Open'
          status={currParams.noto !== undefined ? (Boolean(currParams.noto & 1) ? 'checked' : 'unchecked') : 'indeterminate'}
          onPress={() => {
            if (currParams.noto === undefined) currParams.noto = 0
            setParam('noto', currParams.noto ^ 1)
          }}
        />
        <Checkbox.Item
          label='On Door Close'
          status={currParams.noto !== undefined ? Boolean((currParams.noto >> 1) & 1) ? 'checked' : 'unchecked' : 'indeterminate'}
          onPress={() => {
            if (currParams.noto === undefined) currParams.noto = 0
            setParam('noto', currParams.noto ^ 2)
          }}
        />
        <Divider />
        <Text style={styles.radioTitle}>Automation:</Text>
        <Divider />
        <View style={styles.inlineContainer}>
          <Text style={styles.inlineOptionText}>If open for longer than</Text>
          <TextInput
            style={styles.inlineInput}
            onChangeText={(text) => setParam('ati', Number(text))}
            value={'' + currParams.ati}
            keyboardType={'number-pad'}
            selectTextOnFocus
          />
          <Text style={styles.inlineOptionText}>minutes...</Text>
        </View>
        <Divider />
        <Checkbox.Item
          label='Notify me'
          status={currParams.ato !== undefined ? Boolean(currParams.ato & 1) ? 'checked' : 'unchecked' : 'indeterminate'}
          onPress={() => {
            if (currParams.ato === undefined) currParams.ato = 0
            setParam('ato', currParams.ato ^ 1)
          }}
        />
        <Checkbox.Item
          label='Auto-close'
          status={currParams.ato !== undefined ? Boolean((currParams.ato >> 1) & 1) ? 'checked' : 'unchecked' : 'indeterminate'}
          onPress={() => {
            if (currParams.ato === undefined) currParams.ato = 0
            setParam('ato', currParams.ato ^ 2)
          }}
        />
        <Divider />

        <View style={styles.inlineContainer}>
          <Text style={styles.inlineOptionText}>If open after</Text>
          {/* {showTimePicker && (<DateTimePicker
            value={new Date(new Date(Date.now()).setUTCHours((currParams.atib ? currParams.atib : 0), 0, 0, 0))}
            mode={'time'}
            display="default"
            onChange={(e, time) => {
              if (e.type === 'set' && time !== undefined)
                setParam('atib', time.getUTCHours());
              setShowTimePicker(false);
            }}
          />)}
          {Platform.OS !== 'web' &&
            (<TouchableOpacity
              style={[styles.inlineInput, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ fontSize: 20 }}>{'' + currParams.atib}</Text>
            </TouchableOpacity>)} */}
          {/* {Platform.OS === 'web' && ( */}
          <TextInput
            style={styles.inlineInput}
            onChangeText={(text) => setParam('atib', Number(text))}
            value={'' + currParams.atib}
            keyboardType={'number-pad'}
            selectTextOnFocus
          />
          {/* )} */}
          <Text style={styles.inlineOptionText}>UTC...</Text>
        </View>
        <Divider />
        <Checkbox.Item
          label='Notify Me'
          status={currParams.atob !== undefined ? Boolean(currParams.atob & 1) ? 'checked' : 'unchecked' : 'indeterminate'}
          onPress={() => {
            if (currParams.atob === undefined) currParams.atob = 0
            setParam('atob', currParams.atob ^ 1)
          }}
        />
        <Checkbox.Item
          label='Auto-close'
          status={currParams.atob !== undefined ? Boolean(currParams.atob & 2) ? 'checked' : 'unchecked' : 'indeterminate'}
          onPress={() => {
            if (currParams.atob === undefined) currParams.atob = 0
            setParam('atob', currParams.atob ^ 2)
          }}
        />
      </View>
    </ScrollView>
  )
}

export function AdvancedSettings({ navigation }: StackScreenProps<RootStackParams, 'AdvancedSettings'>) {
  const [changingKey, setChangingKey] = useState(false);
  const [currParams, setCurrParams] = useState<ControllerOptions>({});
  const setParam = (param: string, val: number | string) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const grabCurrParams = async () => {
    try {
      let json = await getControllerOptions()
      setCurrParams(json);
    } catch (err) {
      createAlert('No Device Found', 'No device was found at the entered address',
        [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
      console.log(err)
    }
  }

  const updateSettings = () => {
    changeControllerOptions(currParams)
      .then((json) => {
        if (json.message !== undefined) {
          throw Error(json.message)
        } else if (json.result === 1) {
          navigation.goBack();
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
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
    grabCurrParams();
  }, [])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      stickyHeaderIndices={[0]}
    >
      <ScreenHeader
        text={'Advanced Settings'}
        left={'back'}
        right={'check'}
        onCheck={updateSettings}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>HTTP Port:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setParam('htp', Number(text))}
          value={'' + currParams.htp}
          keyboardType={'number-pad'}
          selectTextOnFocus
        />
        <Divider />
        <Checkbox.Item
          label='Use Static IP'
          status={currParams.usi ? 'checked' : 'unchecked'}
          onPress={() => {
            if (currParams.usi === undefined) currParams.usi = 0
            setParam('usi', currParams.usi ^ 1)
          }}
        />
        <Divider />
        <Text style={[styles.optionTitle, !currParams.usi ? styles.optionTitleDisabled : {}]}>Device IP:</Text>
        <TextInput
          style={[styles.optionInput, !currParams.usi ? styles.optionInputDisabled : {}]}
          onChangeText={(text) => setParam('dvip', text)}
          value={currParams.dvip}
          keyboardType={'url'}
          selectTextOnFocus
          editable={Boolean(currParams.usi)}
        />
        <Text style={[styles.optionTitle, !currParams.usi ? styles.optionTitleDisabled : {}]}>Gateway IP:</Text>
        <TextInput
          style={[styles.optionInput, !currParams.usi ? styles.optionInputDisabled : {}]}
          onChangeText={(text) => setParam('gwip', text)}
          value={currParams.gwip}
          keyboardType={'url'}
          selectTextOnFocus
          editable={Boolean(currParams.usi)}
        />
        <Text style={[styles.optionTitle, !currParams.usi ? styles.optionTitleDisabled : {}]}>Subnet:</Text>
        <TextInput
          style={[styles.optionInput, !currParams.usi ? styles.optionInputDisabled : {}]}
          onChangeText={(text) => setParam('subn', text)}
          value={currParams.subn}
          keyboardType={'url'}
          selectTextOnFocus
          editable={Boolean(currParams.usi)}
        />
        <Divider />
        <Checkbox.Item
          label='Change Device Key'
          status={changingKey ? 'checked' : 'unchecked'}
          onPress={() => { setChangingKey(!changingKey) }}
        />
        <Divider />
        <Text style={[styles.optionTitle, !changingKey ? styles.optionTitleDisabled : {}]}>New Key:</Text>
        <TextInput
          style={[styles.optionInput, !changingKey ? styles.optionInputDisabled : {}]}
          onChangeText={(text) => setParam('nkey', text)}
          value={currParams.nkey}
          keyboardType={'url'}
          selectTextOnFocus
          editable={changingKey}
        />
        <Text style={[styles.optionTitle, !changingKey ? styles.optionTitleDisabled : {}]}>Confirm New Key:</Text>
        <TextInput
          style={[styles.optionInput, !changingKey ? styles.optionInputDisabled : {}]}
          onChangeText={(text) => setParam('ckey', text)}
          value={currParams.ckey}
          keyboardType={'url'}
          selectTextOnFocus
          editable={changingKey}
        />
      </View>
    </ScrollView>
  )
}

export default function SettingsScreen({ navigation }: { navigation: AppNavigationProp<'Settings'> }) {
  const [conInput, setConInput] = useState('');

  const docs = 'https://nbviewer.jupyter.org/github/OpenGarage/OpenGarage-Firmware/blob/master/docs/OGManual.pdf';

  const issueCommand = (command: 'clearlog' | 'reboot' | 'apmode') => {
    Promise.all([getURL(), getDevKey()])
      .then((values) => {
        const [url, devKey] = values;
        let req = url
        switch (command) {
          case 'clearlog':
            req += '/clearlog?dkey=' + devKey;
            break;
          case 'reboot':
            req += '/cc?dkey=' + devKey + '&reboot=1';
            break;
          case 'apmode':
            req += '/cc?dkey=' + devKey + '&apmode=1';
            break;
        }
        if (req === undefined) req = ''
        return fetch(req);
      })
      .then((response) => response.json())
      .then((json) => {
        if (json.result === 1) {
          Alert.alert('Command Issued Successfully')
        } else if (json.result === 2) {
          Alert.alert('Invalid Device Key', 'The entered device key was rejected',
            [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        }
      })
      .catch((err) => console.log(err));
  }

  useFocusEffect(
    useCallback(() => {
      getConInput().then((conInput) => setConInput(conInput ? conInput : ''));
    }, [])
  )

  return (
    <View style={styles.container}>
      <ScreenHeader
        text={'Settings'}
        left={'hamburger'}
        right={'home'}
      />
      <ScrollView contentContainerStyle={styles.list}>
        <FullLengthButton
          icon={{ name: 'garage-alert' }}
          text="Open Garage Device Set-up"
          subText={'Connection method, device key'}
          onPress={() => navigation.navigate('IPSettings')}
        />
        <FullLengthButton
          icon={{ name: 'settings' }}
          text="Basic Device Settings"
          subText={'Site name, sensor, alarm, log size'}
          onPress={() => navigation.navigate('BasicSettings')}
        />
        <FullLengthButton
          icon={{ name: 'arrow-decision' }}
          text="Integration Settings"
          subText={'OTC, IFTTT, MQTT, notifications'}
          onPress={() => navigation.navigate('IntegrationSettings')}
        />
        <FullLengthButton
          icon={{ name: 'cogs' }}
          text="Advanced Settings"
          subText={'HTTP port, static IP, change device key'}
          onPress={() => navigation.navigate('AdvancedSettings')}
        />
        <FullLengthButton
          icon={{ name: 'script-outline' }}
          text="Clear Logs"
          subText={'Clear log data'}
          onPress={() => {
            createAlert('Confirm Clear Logs', 'Are you sure you want to clear the logs?',
              [{ text: 'Cancel' }, { text: 'Reset Logs', onPress: () => { issueCommand('clearlog') } }]
            )
          }}
        />
        <FullLengthButton
          icon={{ name: 'restart' }}
          text="Reboot Device"
          subText={'Reboot the OpenGarage controller'}
          onPress={() => {
            createAlert('Confirm Reboot Device', 'Are you sure you want to reboot the controller?',
              [{ text: 'Cancel' }, { text: 'Reboot Device', onPress: () => { issueCommand('reboot') } }]
            )
          }}
        />
        <FullLengthButton
          icon={{ name: 'book-open-variant' }}
          text="User Manual"
          subText={"OpenGarage user manual"}
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
        <FullLengthButton
          icon={{ name: 'delete' }}
          text="Clear AsyncStorage"
          subText="DEBUG"
          onPress={() => {
            AsyncStorage.clear()
          }}
        />
        <Text style={{ alignSelf: 'center' }}>App Version 1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },

  inlineContainer: {
    padding: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },

  inlineOptionTitle: {
    fontSize: 16,
    padding: 4,
    marginLeft: 20,
  },

  inlineOptionText: {
    fontSize: 16,
    padding: 6,
    // height: '100%',
  },

  inlineInput: {
    // flexGrow: 1,
    fontSize: 16,
    backgroundColor: '#fff',
    width: 60,
    height: 43,
    textAlign: 'center',
    color: '#000000',
    borderColor: '#00000020',
    borderWidth: 2,
    borderRadius: 6,
  },

  list: {
    maxWidth: 600,
    width: '100%',
    paddingBottom: 5,
    alignSelf: 'center',
  },

  optionTitle: {
    marginBottom: -24,
    fontSize: 16,
    position: 'relative',
    alignSelf: 'flex-start',
    // top: 14,
    left: 22,
    backgroundColor: '#fff',
    color: '#000000c0',
    zIndex: 1,
    padding: 4,
  },

  optionTitleDisabled: {
    color: '#00000030'
  },

  optionText: {
    fontSize: 20,
    padding: 8,
    // paddingLeft: 10,
    flexGrow: 1,
  },

  optionHelperText: {
    alignSelf: 'flex-start',
    marginLeft: 26,
    fontSize: 16,
    color: '#aaa',
  },

  optionInput: {
    // width: '100%',
    marginHorizontal: 10,
    padding: 10,
    paddingLeft: 16,
    // alignSelf: 'center',
    fontSize: 20,
    color: '#000000',
    backgroundColor: '#fff',
    borderColor: '#00000020',
    borderRadius: 6,
    borderWidth: 2,
    marginVertical: 10,
  },

  optionInputDisabled: {
    color: '#00000040',
    borderColor: '#e5e5e5'
  },

  radioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000c0',
    padding: 16,
  },

  fsModal: {
    width: '100%',
    // height: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
});