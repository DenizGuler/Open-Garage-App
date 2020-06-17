import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Linking, ScrollView, AsyncStorage, Button, Alert, Picker, Switch, Vibration, Platform } from 'react-native';
import 'react-native-gesture-handler';
import { TouchableHighlight, TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { getDevKey, ScreenHeader, getDevices, setDevices, getURL, getConInput } from './utils'
import { ButtonGroup } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';


const Setting = (props) => {
  return (
    <>
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
      {/* <View style={styles.line} /> */}
    </>
  )
};

export function IPSettings({ navigation }) {
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
  }, [])

  // Updates the device (or given param) in async storage 
  // updateDevice(param?: string): void
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
          onPress={(idx) => setDeviceParam('conMethod', CON_METHODS[idx])}
          selectedIndex={CON_METHODS.indexOf(device.conMethod)}
          buttons={CON_METHODS}
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
        <Text selectable>6bfcd666b6a8d948f1f5090b0e5d900e</Text>
      </View>
    </ScrollView>
  );
}

export function BasicSettings({ navigation }) {
  const [currParams, setCurrParams] = useState({});
  const setParam = (param, val) => {
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

export function IntegrationSettings({ navigation }) {
  const [currParams, setCurrParams] = useState({});
  const setParam = (param, val) => {
    setCurrParams({
      ...currParams,
      [param]: val
    });
  }
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  useEffect(() => {
    grabCurrParams();
  }, [])

  const updateSettings = () => {
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

  return (
    <ScrollView
      // style={}
      // contentContainerStyle={styles.list}
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
          value={currParams.mqpt}
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
            value={Boolean(currParams.noto & 1)}
            onValueChange={(val) => setParam('noto', Number(val) | currParams.noto & 2)}
          />
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>On Door Close:</Text>
          <Switch
            value={Boolean((currParams.noto >> 1) & 1)}
            onValueChange={(val) => setParam('noto', (Number(val) << 1) | currParams.noto & 1)}
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
            value={Boolean(currParams.ato & 1)}
            onValueChange={(val) => setParam('ato', Number(val) | currParams.ato & 2)}
          />
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>Auto-close</Text>
          <Switch
            value={Boolean((currParams.ato >> 1) & 1)}
            onValueChange={(val) => setParam('ato', (Number(val) << 1) | currParams.ato & 1)}
          />
        </View>
        <View style={styles.inlineContainer}>
          <Text style={styles.inlineOptionText}>If open after</Text>
          {showTimePicker && (<DateTimePicker
            value={new Date(Date.now()).setUTCHours((currParams.atib ? currParams.atib : 0), 0, 0, 0)}
            mode={'time'}
            display="default"
            onChange={(e, time) => {
              if (e.type === 'set')
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
            value={Boolean(currParams.atob & 1)}
            onValueChange={(val) => setParam('atob', Number(val) | currParams.atob & 2)}
          />
        </View>
        <View style={[styles.switchContainer, { marginLeft: 10 }]}>
          <Text style={styles.optionText}>Auto-close</Text>
          <Switch
            value={Boolean((currParams.atob >> 1) & 1)}
            onValueChange={(val) => setParam('atob', (Number(val) << 1) | currParams.atob & 1)}
          />
        </View>
      </View>
    </ScrollView>
  )
}

export function AdvancedSettings({ navigation }) {
  const [changingKey, setChangingKey] = useState(false);
  const [currParams, setCurrParams] = useState({});
  const setParam = (param, val) => {
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

  useEffect(() => {
    grabCurrParams();
  }, [])

  const updateSettings = () => {
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

  return (
    <ScrollView
      // style={}
      // contentContainerStyle={styles.list}
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

export default function SettingsScreen({ navigation }) {
  const [hideIPPrompt, setHideIPPrompt] = useState(true);
  const [conInput, setConInput] = useState('');

  const docs = 'https://nbviewer.jupyter.org/github/OpenGarage/OpenGarage-Firmware/blob/master/docs/OGManual.pdf';

  const issueCommand = (command) => {
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
      getConInput().then((conInput) => setConInput(conInput));
    }, [])
  )

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
          text="Open Garage Device Set-up"
          subText={conInput}
          onPress={() =>
            //setHideIPPrompt(!hideIPPrompt)
            navigation.navigate('IPSettings')
          }
        />
        <Setting
          text="Basic Device Settings"
          subText={'Configure basic settings'}
          onPress={() => navigation.navigate('BasicSettings')}
        />
        <Setting
          text="Integration Settings"
          subText={'Configure integration settings'}
          onPress={() => navigation.navigate('IntegrationSettings')}
        />
        <Setting
          text="Advanced Settings"
          subText={'Configure advanced settings'}
          onPress={() => navigation.navigate('AdvancedSettings')}
        />
        <Setting
          text="Clear Logs"
          subText={'Clear the logs collected by your device'}
          onPress={() => Alert.alert('Confirm Clear Logs', 'Are you sure you want to clear the logs?',
            [{ text: 'Cancel' }, { text: 'Reset Logs', onPress: () => { issueCommand('clearlog') } }]
          )}
        />
        <Setting
          text="Reboot Device"
          subText={'Reboot the OpenGarage Controller'}
          onPress={() => Alert.alert('Confirm Reboot Device', 'Are you sure you want to reboot the controller?',
            [{ text: 'Cancel' }, { text: 'Reboot Device', onPress: () => { issueCommand('reboot') } }]
          )}
        />
        <Setting
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
    display: 'flex',
    maxWidth: 600,
    width: '100%',
    padding: 5,
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'center',
  },

  line: {
    width: 600,
    height: 1,
    alignSelf: 'center',
    backgroundColor: '#aaa'
  },

  settingButton: {
    // flex: 1,
    // justifyContent: 'center',
    height: 60,
    // margin: 2,
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    marginVertical: 2,
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
    flexGrow: 1,
  },

  optionText: {
    fontSize: 20,
    padding: 8,
    flexGrow: 1,
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