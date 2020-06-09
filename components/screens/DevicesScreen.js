import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, TouchableHighlight } from 'react-native-gesture-handler';
import { ScreenHeader, getDevices, setCurrIndex, removeDev, getURL } from './utils';
import { StyleSheet, Text, View, Alert, Vibration, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function DevicesScreen({ navigation }) {
  const [deleteMode, setDeleteMode] = useState(false);
  const [devsToDel, setDevsToDel] = useState([]);
  const [devState, setDevState] = useState([]);
  const [currState, setCurrState] = useState(0);

  // function that grabs all the devices and their names and stores them in devState
  // startUp(): void
  const startUp = () => {
    getDevices()
      .then((tuple) => {
        const [curr, devs] = tuple
        setCurrState(curr);
        // setDevState(devs);
        return devs;
      })
      .then((devs) => getNames(devs));
  }

  // function that grabs all the names of a given array of devices
  // async getNames(devs: device[]): void
  const getNames = async (devs) => {
    let newDevState = devs.slice();
    for (let i = 0; i < devs.length; ++i) {
      try {
        let url = await getURL(i);
        let response = await fetch(url + '/jc');
        let json = await response.json();
        // console.log(json)
        newDevState[i].name = json.name;
      }
      catch (err) {
        newDevState[i].name = 'No Device Found';
        console.log(err);
      }
    }
    setDevState(newDevState);
  }


  // call startUp() everytime the screen is focused
  useFocusEffect(
    useCallback(() => {
      startUp();
      const onBackPress = () => {
        if (deleteMode) {
          setDevsToDel([])
          setDeleteMode(!deleteMode)
          return true;
        } else {
          return false;
        }
      };
      
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [deleteMode])
  )

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     startUp();
  //   })
  //   return unsubscribe;
  // }, [navigation]);

  // Function that handles adding a new device by incrementing the device number and sending the user to the IPModal to set it up
  // onAdd():void
  const onAdd = () => {
    setCurrIndex(devState?.length ? devState.length : 0)
      .then(navigation.navigate('Settings', { screen: 'IPModal' }))
  }

  // Function that handles marking devices for deletion
  // toggleDel(index: number): void
  const toggleDel = (index) => {
    let newDevsToDel = devsToDel.slice();
    if (devsToDel.indexOf(index) >= 0) {
      newDevsToDel.splice(devsToDel.indexOf(index), 1);
    } else {
      newDevsToDel.push(index);
    }
    setDevsToDel(newDevsToDel);
  }

  // Function that handles deleting the marked devices and refreshes the device list
  // deleteDevs(): void
  const deleteDevs = () => {
    devsToDel.forEach((index) => { removeDev(index).then(() => startUp()) })
  }

  // Returns what the style of the button at index should be
  // buttonStyle(index: number): style
  const buttonStyle = (index) => {
    let bgColor = '#fff';
    if (deleteMode && devsToDel.indexOf(index) >= 0) {
      bgColor = '#ffd8d8'
    }
    else if (index === currState) {
      bgColor = '#d8ffd8'
    }

    return {
      height: 60,
      alignSelf: 'stretch',
      paddingHorizontal: 10,
      margin: 5,
      borderRadius: 3,
      backgroundColor: bgColor,
    }
  }

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={() =>
        <ScreenHeader
          left={deleteMode ? "cancel" : "hamburger"}
          text="Devices"
          right={deleteMode ? "check" : "add"}
          onAdd={onAdd}
          onCancel={() => {
            setDevsToDel([]);
            setDeleteMode(false);
          }}
          onCheck={() => {
            Alert.alert("ARE YOU SURE ABOUT THAT?", "", [{
              text: 'Cancel', onPress: () => {
                setDevsToDel([]);
                setDeleteMode(false);
              }
            }, {
              text: 'Confirm', onPress: () => {
                deleteDevs();
                setDeleteMode(false);
              }
            }])
          }}
        />}
      data={devState}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => {
        return (
          <TouchableHighlight
            style={buttonStyle(index)}
            underlayColor="#e0efff"
            activeOpacity={1}
            onPress={() => {
              if (!deleteMode) {
                setCurrIndex(index).then(() => setCurrState(index));
                // navigation.navigate('Home')
              } else {
                toggleDel(index);
              }
            }}
            onLongPress={
              () => {
                Vibration.vibrate(100)
                setDeleteMode(true);
                toggleDel(index)
              }
            }
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.deviceName, index === currState ? { color: '#12dd12' } : {}]}>{item.name}</Text>
              <Text style={styles.devSubText}>{item.conInput}</Text>
            </View>
          </TouchableHighlight>
        )
      }}
    />
  );
}




const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },

  deviceName: {
    fontSize: 20,
  },

  devSubText: {
    alignSelf: 'flex-end',
    fontSize: 16,
    color: '#aaa',
  },
});