import React, { useState, useEffect } from 'react';
import { FlatList, TouchableHighlight } from 'react-native-gesture-handler';
import { ScreenHeader, setDevices, getDevices, setCurrDev, removeDev } from './utils';
import { StyleSheet, Text, View, Alert } from 'react-native';

export default function DevicesScreen({ navigation }) {
  const [deleteMode, setDeleteMode] = useState(false);
  const [devsToDel, setDevsToDel] = useState([]);
  const [devState, setDevState] = useState([]);
  const [currState, setCurrState] = useState(0);

  const startUp = () => {
    getDevices()
        .then((touple) => {
          const [curr, devs] = touple
          // console.log(touple);
          setCurrState(curr);
          setDevState(devs);
          return devs;
        })
        .then((devs) => getNames(devs));
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      startUp();
    })
    return unsubscribe;
  }, []);

  const getNames = (devs) => {
    let newDevState = devs.slice();
    for (let i = 0; i < devs.length; ++i) {
      fetch('http://' + devs[i].OGIP + '/jc')
        .then((response) => response.json())
        .then((json) => {
          newDevState[i].name = json.name
          setDevState(newDevState);
        })
        .catch((err) => {
          newDevState[i].name = 'No Device Found'
          setDevState(newDevState);
          console.log(err);
        })
    }
  }

  const onAdd = () => {
    setCurrDev(devState.length)
      .then(navigation.navigate('Settings', { screen: 'IPModal' }))
  }

  const toggleDel = (index) => {
    let newDevsToDel = devsToDel.slice();
    if (devsToDel.indexOf(index) >= 0) {
      newDevsToDel.splice(devsToDel.indexOf(index), 1);
    } else {
      newDevsToDel.push(index);
    }
    setDevsToDel(newDevsToDel);
  }

  const deleteDevs = () => {
    devsToDel.forEach((index) => { removeDev(index) })
  }

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
          left="hamburger"
          text="Devices"
          right={deleteMode ? "check" : "add"}
          onAdd={onAdd}
          onCheck={() => {
            Alert.alert("ARE YOU SURE ABOUT THAT?", "", [{ text: 'Cancel', onPress: () => {
              setDevsToDel([]);
              setDeleteMode(false);
            } }, { text: 'Confirm', onPress: () => {
              deleteDevs();
              setDeleteMode(false);
              startUp();
            }}])
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
                setCurrDev(index).then(() => setCurrState(index));
              } else {
                toggleDel(index);
              }
            }}
            onLongPress={
              () => {
                setDeleteMode(true);
              }
            }
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.deviceName, index === currState ? { color: '#12dd12' } : {}]}>{item.name}</Text>
              <Text style={styles.devSubText}>{item.OGIP}</Text>
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
    // maxWidth: 600,
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