import React, { useState, useEffect, useCallback, FC } from 'react';
import { StyleSheet, View, Linking, ScrollView, AsyncStorage, Alert, Picker, Switch, Platform, Image, TouchableNativeFeedback } from 'react-native';
import 'react-native-gesture-handler';
import { TouchableHighlight, TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { getDevKey, getDevices, setDevices, getURL, getConInput, BaseText as Text, Device, Params } from './utils'
import { ButtonGroup, Icon } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams, AppNavigationProp } from '../App';
import { FullLengthButton, ScreenHeader } from '../components';

export function IPSettings({ navigation }: StackScreenProps<RootStackParams, 'IPSettings'>) {
  const CON_METHODS = ['IP', 'OTF']

  const [device, setDevice] = useState<Device>({
    conMethod: 'IP',
    conInput: '',
    // devKey: '',
    // image: undefined,
  });
  const setDeviceParam = (param: Device) => {
    setDevice({
      ...device,
      ...param,
    });
  }

  useEffect(() => {
    getDevices().then((tuple) => {
      const [currIdx, devs] = tuple
      if (devs !== null && devs[currIdx] !== undefined)
        return setDevice(devs[currIdx])
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
      setDeviceParam({ image: result });
    }
  }

  // Updates the device (or given param) in async storage 
  // updateDevice(param?: string): void
  const updateDeivce = async (param?: 'conMethod' | 'conInput' | 'devKey' | 'image') => {

    if ((param === undefined || param === 'conMethod') && device.conInput !== undefined) {
      // regex for an IP address (can probably be improved)
      if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(device.conInput)) {
        setDeviceParam({ conMethod: 'IP' })
        device.conMethod = 'IP'
      } else {
        setDeviceParam({ conMethod: 'OTF' })
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
      if (param === undefined) {
        newDevs[currDev] = {
          ...newDevs[currDev],
          ...device
        }
      } else {
        newDevs[currDev] = {
          ...newDevs[currDev],
          [param]: device[param]
        }
      }
      await setDevices(newDevs);
      // await setDevice(device);
    } catch (error) {
      console.log(error);
    }
  }

  const updateParams = async () => {
    return await updateDeivce().catch((err) => console.log(err))
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
          updateParams().then(() => {
            navigation.goBack();
          });
        }}
      />
      <View style={styles.fsModal}>
        <Text style={styles.optionTitle}>Connection Method:</Text>
        <ButtonGroup
          onPress={(idx) => setDeviceParam({ conMethod: idx === 0 ? 'IP' : 'OTF' })}
          selectedIndex={device.conMethod === undefined ? 0 : CON_METHODS.indexOf(device.conMethod)}
          buttons={CON_METHODS}
          containerStyle={{ width: '85%', alignSelf: 'center' }}
          disabled
        />
        <Text style={styles.optionTitle}>IP or OTF Token:</Text>
        <TextInput
          style={styles.optionInput}
          onChangeText={(text) => setDeviceParam({ conInput: text })}
          value={device.conInput}
          placeholder={'e.g.: 127.0.0.1 or [token]currDev'}
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
          onChangeText={(text) => setDeviceParam({ devKey: text })}
          value={device.devKey}
          onSubmitEditing={() => updateDeivce('devKey')}
          secureTextEntry
          selectTextOnFocus
        />
        {/* <Text>{JSON.stringify(device)}</Text> */}
        <Text selectable>6bfcd666b6a8d948f1f5090b0e5d900e</Text>
        <Text style={styles.optionTitle}>Site Image:</Text>
        <TouchableOpacity
          onPress={pickImage}
        >
          <View style={[styles.optionInput, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
            {device.image !== undefined ?
              <Image source={{ uri: device.image.uri }} style={{ width: 200, height: device.image.height / device.image.width * 200 }} /> :
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
  const [currParams, setCurrParams] = useState<Params>({});
  const setParam = (param: string, val: any) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const grabCurrParams = () => {
    getURL()
      .then((url) => fetch(url + '/jo'))
      .then((response) => response.json())
      .then((json) => {
        setCurrParams(json);
      })
      .catch((err) => {
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        console.log(err);
      })
  }

  const updateSettings = () => {
    Promise.all([getURL(), getDevKey()])
      .then((values) => {
        const [url, devKey] = values;
        return url + '/co?dkey=' + devKey;
      })
      .then((req) => {
        Object.keys(currParams).forEach((key: string) => {
          let param = currParams[key]
          if (param !== undefined) {
            req += '&' + key + '=' + encodeURIComponent(param);
          }
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
      contentContainerStyle={{ flexGrow: 1 }}
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
        <Text style={styles.optionSubText}>set to 0 to disable  </Text>
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

export function IntegrationSettings({ navigation }: StackScreenProps<RootStackParams, 'IntegrationSettings'>) {
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false)
  const [currParams, setCurrParams] = useState<Params>({});
  const setParam = (param: string, val: string | number) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const grabCurrParams = () => {
    getURL()
      .then((url) => fetch(url + '/jo'))
      .then((response) => response.json())
      .then((json) => {
        setCurrParams(json);
      })
      .catch((err) => {
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        console.log(err);
      })
  }

  const updateSettings = () => {
    Promise.all([getURL(), getDevKey()])
      .then((values) => {
        const [url, devKey] = values;
        return url + '/co?dkey=' + devKey;
      })
      .then((req) => {
        Object.keys(currParams).forEach((key: string) => {
          let param = currParams[key]
          if (param !== undefined) {
            req += '&' + key + '=' + encodeURIComponent(param);
          }
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
    <ScrollView stickyHeaderIndices={[0]}>
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
        <Text style={styles.optionTitle}>Notify me...</Text>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>On Door Open:</Text>
          <Switch
            value={currParams.noto ? Boolean(currParams.noto & 1) : false}
            onValueChange={(val) => {
              if (currParams.noto === undefined) currParams.noto = 0
              setParam('noto', Number(val) | currParams.noto & 2)
            }}
          />
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>On Door Close:</Text>
          <Switch
            value={currParams.noto ? Boolean((currParams.noto >> 1) & 1) : false}
            onValueChange={(val) => {
              if (currParams.noto === undefined) currParams.noto = 0
              setParam('noto', (Number(val) << 1) | currParams.noto & 1)
            }}
          />
        </View>
        <Text style={styles.optionTitle}>Automation:</Text>
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
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>Notify me</Text>
          <Switch
            value={currParams.ato ? Boolean(currParams.ato & 1) : false}
            onValueChange={(val) => {
              if (currParams.ato === undefined) currParams.ato = 0
              setParam('ato', Number(val) | currParams.ato & 2)
            }}
          />
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>Auto-close</Text>
          <Switch
            value={currParams.ato ? Boolean((currParams.ato >> 1) & 1) : false}
            onValueChange={(val) => {
              if (currParams.ato === undefined) currParams.ato = 0
              setParam('ato', (Number(val) << 1) | currParams.ato & 1)
            }}
          />
        </View>
        <View style={styles.inlineContainer}>
          <Text style={styles.inlineOptionText}>If open after</Text>
          {showTimePicker && (<DateTimePicker
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
            </TouchableOpacity>)}
          {Platform.OS === 'web' &&
            (<TextInput
              style={styles.inlineInput}
              onChangeText={(text) => setParam('atib', Number(text))}
              value={'' + currParams.atib}
              keyboardType={'number-pad'}
              selectTextOnFocus
            />)}
          <Text style={styles.inlineOptionText}>UTC...</Text>
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>Notify me</Text>
          <Switch
            value={currParams.atob ? Boolean(currParams.atob & 1) : false}
            onValueChange={(val) => {
              if (currParams.atob === undefined) currParams.atob = 0
              setParam('atob', Number(val) | currParams.atob & 2)
            }}
          />
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>Auto-close</Text>
          <Switch
            value={currParams.atob ? Boolean((currParams.atob >> 1) & 1) : false}
            onValueChange={(val) => {
              if (currParams.atob === undefined) currParams.atob = 0
              setParam('atob', (Number(val) << 1) | currParams.atob & 1)
            }}
          />
        </View>
      </View>
    </ScrollView>
  )
}

export function AdvancedSettings({ navigation }: StackScreenProps<RootStackParams, 'AdvancedSettings'>) {
  const [changingKey, setChangingKey] = useState(false);
  const [currParams, setCurrParams] = useState<Params>({});
  const setParam = (param: string, val: number | string) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }

  const grabCurrParams = () => {
    getURL()
      .then((url) => fetch(url + '/jo'))
      .then((response) => response.json())
      .then((json) => {
        setCurrParams(json);
      })
      .catch((err) => {
        Alert.alert('No Device Found', 'No device was found at the entered address',
          [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
        console.log(err);
      })
  }

  const updateSettings = () => {
    Promise.all([getURL(), getDevKey()])
      .then((values) => {
        const [url, devKey] = values;
        return url + '/co?dkey=' + devKey;
      })
      .then((req) => {
        Object.keys(currParams).forEach((key: string) => {
          let param = currParams[key]
          if (param !== undefined) {
            req += '&' + key + '=' + encodeURIComponent(param);
          }
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
    <ScrollView stickyHeaderIndices={[0]}>
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
        <View style={styles.switchContainer}>
          <Text style={styles.optionTitle}>Use Static IP</Text>
          <Switch
            value={Boolean(currParams.usi)}
            onValueChange={(val) => setParam('usi', Number(val))}
          />
        </View>
        <Text style={styles.optionTitle}>Device IP:</Text>
        <TextInput
          style={currParams.usi ? styles.optionInput : styles.optionInputDisabled}
          onChangeText={(text) => setParam('dvip', text)}
          value={currParams.dvip}
          keyboardType={'url'}
          selectTextOnFocus
          editable={Boolean(currParams.usi)}
        />
        <Text style={styles.optionTitle}>Gateway IP:</Text>
        <TextInput
          style={currParams.usi ? styles.optionInput : styles.optionInputDisabled}
          onChangeText={(text) => setParam('gwip', text)}
          value={currParams.gwip}
          keyboardType={'url'}
          selectTextOnFocus
          editable={Boolean(currParams.usi)}
        />
        <Text style={styles.optionTitle}>Subnet:</Text>
        <TextInput
          style={currParams.usi ? styles.optionInput : styles.optionInputDisabled}
          onChangeText={(text) => setParam('subn', text)}
          value={currParams.subn}
          keyboardType={'url'}
          selectTextOnFocus
          editable={Boolean(currParams.usi)}
        />
        <View style={styles.switchContainer}>
          <Text style={styles.optionTitle}>Change Device Key</Text>
          <Switch
            value={changingKey}
            onValueChange={(val) => setChangingKey(val)}
          />
        </View>
        <Text style={styles.optionTitle}>New Key:</Text>
        <TextInput
          style={changingKey ? styles.optionInput : styles.optionInputDisabled}
          onChangeText={(text) => setParam('nkey', text)}
          value={currParams.nkey}
          keyboardType={'url'}
          selectTextOnFocus
          editable={changingKey}
        />
        <Text style={styles.optionTitle}>Confirm New Key:</Text>
        <TextInput
          style={changingKey ? styles.optionInput : styles.optionInputDisabled}
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
          subText={conInput}
          onPress={() => navigation.navigate('IPSettings')}
        />
        <FullLengthButton
          icon={{ name: 'settings' }}
          text="Basic Device Settings"
          subText={'Configure basic settings'}
          onPress={() => navigation.navigate('BasicSettings')}
        />
        <FullLengthButton
          icon={{ name: 'arrow-decision' }}
          text="Integration Settings"
          subText={'Configure integration settings'}
          onPress={() => navigation.navigate('IntegrationSettings')}
        />
        <FullLengthButton
          icon={{ name: 'cogs' }}
          text="Advanced Settings"
          subText={'Configure advanced settings'}
          onPress={() => navigation.navigate('AdvancedSettings')}
        />
        <FullLengthButton
          icon={{ name: 'script-outline' }}
          text="Clear Logs"
          subText={'Clear the logs collected by your device'}
          onPress={() => Alert.alert('Confirm Clear Logs', 'Are you sure you want to clear the logs?',
            [{ text: 'Cancel' }, { text: 'Reset Logs', onPress: () => { issueCommand('clearlog') } }]
          )}
        />
        <FullLengthButton
          icon={{ name: 'restart' }}
          text="Reboot Device"
          subText={'Reboot the OpenGarage Controller'}
          onPress={() => Alert.alert('Confirm Reboot Device', 'Are you sure you want to reboot the controller?',
            [{ text: 'Cancel' }, { text: 'Reboot Device', onPress: () => { issueCommand('reboot') } }]
          )}
        />
        <FullLengthButton
          icon={{ name: 'book-open-variant' }}
          text="User Manual"
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
        <FullLengthButton
          icon={{ name: 'delete' }}
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

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    // maxWidth: 600,
    backgroundColor: '#fff',
  },

  inlineContainer: {
    marginLeft: 10,
    flex: 1,
    flexDirection: 'row',
  },

  inlineOptionText: {
    fontSize: 20,
    padding: 8,
  },

  inlineInput: {
    // flexGrow: 1,
    fontSize: 20,
    backgroundColor: '#fff',
    width: 60,
    height: 43,
    textAlign: 'center',
    // padding: 0,
    borderBottomWidth: 2,
  },

  list: {
    maxWidth: 600,
    width: '100%',
    paddingBottom: 5,
    alignSelf: 'center',
  },

  optionTitle: {
    fontSize: 26,
    // width: '100%',
    // borderBottomWidth: 1,
    // borderColor: '#aaa',
    padding: 8,
    flexGrow: 1,
  },

  optionText: {
    fontSize: 20,
    padding: 8,
    flexGrow: 1,
  },

  optionSubText: {
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#aaa',
  },

  optionInput: {
    width: '100%',
    fontSize: 20,
    color: '#000',
    backgroundColor: '#fff',
    padding: 10,
  },

  optionInputDisabled: {
    width: '100%',
    fontSize: 20,
    color: '#999',
    backgroundColor: '#f8f8f8',
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

  switchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  fsModal: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginBottom: 10,
  },
});