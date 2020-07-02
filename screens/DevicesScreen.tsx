import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, TouchableHighlight } from 'react-native-gesture-handler';
import { ScreenHeader, getDevices, setCurrIndex, removeDev, getURL, BaseText as Text, Device } from './utils';
import { StyleSheet, View, Alert, Vibration, BackHandler, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppNavigationProp } from '../App';

export default function DevicesScreen({ navigation }: {navigation : AppNavigationProp<'Sites'>}) {
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const [devsToDel, setDevsToDel] = useState<number[]>([]);
  const [devState, setDevState] = useState<Device[]>([]);
  const [currState, setCurrState] = useState<number>(0);

  // function that grabs all the devices and their names and stores them in devState
  // startUp(): void
  const startUp = () => {
    getDevices()
      .then((tuple) => {
        const [curr, devs] = tuple
        setCurrState(curr);
        setDevState(devs);
        return devs;
      })
      .then((devs) => getNames(devs))
      .catch((err) => console.log(err));
  }

  // function that grabs all the names of a given array of devices
  // async getNames(devs: device[]): void
  const getNames = async (devs: Device[]) => {
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
    }, [])
  )

  useFocusEffect(
    useCallback(() => {
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

  // Function that handles adding a new device by incrementing the device number and sending the user to the IPSettings to set it up
  // onAdd():void
  const onAdd = () => {
    setCurrIndex(devState?.length ? devState.length : 0)
      .then(() => navigation.navigate('IPSettings'))
  }

  // Function that handles marking devices for deletion
  // toggleDel(index: number): void
  const toggleDel = (index: number) => {
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
  const buttonStyle = (index: number): ViewStyle => {
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
      marginVertical: 2,
      borderRadius: 3,
      backgroundColor: bgColor,
    }
  }

  return (
    <View style={styles.container}>
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
      />

      <FlatList
        style={styles.list}
        data={devState}
        keyExtractor={(item, index) => index.toString()}
        ListFooterComponent={
          <Text style={{ alignSelf: 'center', fontSize: 14, color: '#aaa' }}>Hold down on a device to toggle deletion mode.</Text>
        }
        renderItem={({ item, index }) => {
          return (
            <TouchableHighlight
              containerStyle={buttonStyle(index)}
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
    </View>

  );
}




const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fff',

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

  deviceName: {
    fontSize: 20,
  },

  devSubText: {
    alignSelf: 'flex-end',
    fontSize: 16,
    color: '#aaa',
  },
});