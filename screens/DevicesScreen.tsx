import React, { useState, useCallback } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { getDevices, setCurrIndex, removeDev, BaseText as Text, createAlert, setDevices, addDev } from '../utils/utils';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppNavigationProp } from '../App';
import { FullLengthButton, ScreenHeader } from '../components';
import { Icon } from 'react-native-elements';
import { getControllerVars } from '../utils/APIUtils';
import { Device } from '../utils/types';
import { usePopup } from '../components/Popup';
import { Snackbar } from 'react-native-paper';

export default function DevicesScreen({ navigation }: { navigation: AppNavigationProp<'Sites'> }) {
  const [devsToDel, setDevsToDel] = useState<number[]>([]);
  const [devState, setDevState] = useState<Device[]>([]);
  const [currState, setCurrState] = useState<number>(0);

  // function that grabs all the devices and their names and stores them in devState
  // startUp(): void
  const startUp = async () => {
    const [currIdx, devs] = await getDevices();
    setCurrState(currIdx);
    setDevState(devs);
    setDevsToDel([]);
  }

  // function that grabs all the names of a given array of devices
  // async getNames(): void
  const getNames = async () => {
    let newDevState = devState.slice();
    for (let i = 0; i < devState.length; ++i) {
      try {
        let json = await getControllerVars(i);
        newDevState[i].name = json.name;
      }
      catch (err) {
        newDevState[i].name = 'No Device Found';
        // console.log(err);
      }
    }
    await setDevices(newDevState);
    setDevState(newDevState);
  }


  // call startUp() everytime the screen is focused
  useFocusEffect(
    useCallback(() => {
      startUp();
    }, [])
  )

  /**
   *  Function that handles adding a new device by incrementing the device number and sending the user to the IPSettings to set it up
   */
  const onAdd = async () => {
    if (await setCurrIndex(devState.length)) {
      navigation.navigate('IPSettings')
    }
  }

  /**
   * Function that handles marking devices for deletion
   * @param index target device's index
   */
  const toggleDel = (index: number) => {
    let newDevsToDel = devsToDel.slice();
    if (isMarked(index)) {
      newDevsToDel.splice(devsToDel.indexOf(index), 1);
    } else {
      newDevsToDel.push(index);
    }
    setDevsToDel(newDevsToDel);
  }

  const isMarked = (index: number) => {
    return devsToDel.indexOf(index) >= 0;
  }
  
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const onRefresh = async () => {
    setRefreshing(true);
    setSnackbarText("Refreshing site list");
    setSnackbarVisible(true);
    await startUp();
    await getNames();
    setSnackbarVisible(true);
    setSnackbarText("Done");
    setRefreshing(false);
  }

  /**
   * Function that handles deleting the marked devices and refreshes the device list
   */
  const deleteDevs = async () => {
    setRefreshing(true);
    setDevsToDel(devsToDel.sort((a, b) => b - a))
    const removedDevs: Device[] = [];
    for (let i = 0; i < devsToDel.length; ++i) {
      console.log('deleting device: ' + devsToDel[i])
      const removedDev = await removeDev(devsToDel[i])
      if (removedDev) removedDevs.push(removedDev);
      devState.splice(devsToDel[i], 1)
    }
    // await startUp();
    devsToDel.length = 0;
    setDevsToDel([]);
    setRefreshing(false);
    return removedDevs
  }

  const undoDeletion = async (deletedDevs: Device[]) => {
    await addDev(...deletedDevs);
    await startUp();
    showSnackbar(`Undid deletion of ${deletedDevs.length} ${deletedDevs.length === 1 ? 'device' : 'devices'}`)
  }

  /** 
   * Returns what the background color of the button at index should be
   */
  const backgroundStyle = (index: number) => {
    let bgColor = 'transparent';
    if (isMarked(index)) {
      bgColor = '#ffd8d8'
    }
    else if (index === currState) {
      bgColor = '#a0c9e660'
    }

    return bgColor
  }

  const popup = usePopup();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');
  const [snackbarAction, setSnackbarAction] = useState<{ label: string; accessibilityLabel?: string; onPress: () => void; } | undefined>(undefined);

  const showSnackbar = (text: string, action?: { label: string; accessibilityLabel?: string; onPress: () => void; }) => {
    setSnackbarText(text);
    setSnackbarAction(action);
    setSnackbarVisible(true);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        left={"hamburger"}
        text="Devices"
        right={"add"}
        onPressRight={onAdd}
      />
      <FlatList
        style={styles.list}
        data={devState}
        keyExtractor={(item, index) => index.toString()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          <Text style={{ alignSelf: 'center', fontSize: 14, color: '#aaa', width: '75%', textAlign: 'center' }}>Press the circle to the right of a device to mark it for deletion.</Text>
        }
        renderItem={({ item, index }) => {
          return (
            <View style={{
              flexDirection: 'row',
              borderBottomColor: '#e5e5e5',
              borderBottomWidth: 1,
              width: '100%',
            }}>
              <FullLengthButton
                style={{
                  borderWidth: 0,
                }}
                backgroundColor={backgroundStyle(index)}
                onPress={() => {
                  setCurrIndex(index)
                    .then(() => setCurrState(index))
                    .then(() => navigation.navigate('Home'));

                }}
                text={item.name ? item.name : ''}
                subText={item.conInput}
                icon={{ name: 'garage' }}
              />
              <View style={{
                width: '20%',
                alignContent: 'center',
                justifyContent: 'center',
                backgroundColor: backgroundStyle(index),
              }}>
                <Icon name={isMarked(index) ? 'minus-circle' : 'circle-outline'} type='material-community' size={30} color={isMarked(index) ? '#d00' : '#aaa'} onPress={() => toggleDel(index)} />
              </View>
            </View>
          )
        }}
      />
      <View style={{ position: 'absolute', bottom: 60, right: '7%' }}>
        {(devsToDel.length === 0 && !refreshing) && <Icon
          name={'refresh'}
          reverse
          color="#444"
          raised
          size={30}
          onPress={onRefresh}
        />}
        {(devsToDel.length > 0 && !refreshing) && <Icon
          name={'delete'}
          reverse
          color="#444"
          raised
          size={30}
          onPress={async () => {
            if (devsToDel.length > 0) {
              createAlert(popup, 'Confirm Deletion', 'Are you sure you want to delete the selected sites?', [{
                text: 'Cancel', onPress: () => {
                  setDevsToDel([]);
                }
              }, {
                text: 'Confirm', onPress: async () => {
                  const removedDevs = await deleteDevs();
                  showSnackbar(`${removedDevs.length} ${removedDevs.length === 1 ? 'device' : 'devices'} removed`, { label: 'undo', onPress: async () => await undoDeletion(removedDevs) });
                  await startUp();
                }
              }])
            } else {
              showSnackbar('No devices selected for deletion')
            }
          }}
        />}
      </View>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_MEDIUM}
        accessibilityStates
        action={snackbarAction}
      >
        {snackbarText}
      </Snackbar>
    </View>

  );
}




const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',

  },

  list: {
    display: 'flex',
    maxWidth: 600,
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'center',
  },
});