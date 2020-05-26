import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, AsyncStorage } from 'react-native';
import 'react-native-gesture-handler';
import { Header, Icon } from 'react-native-elements';

export default LogScreen;

const getOGIP = async () => {
  try {
    const OGIP = await AsyncStorage.getItem('OGIP');
    if (OGIP !== null) {
      return OGIP
    }
  } catch (error) {
    console.log(error)
  }
}

const LogTable = (props) => {
  if (props.loading) {
    return <Text>Log Loading</Text>;
  }

  if (props.logs.length === 0) {
    return (
      <View style={{
        flex: 1,
        width: '100%',
        // borderWidth: 2,
        alignItems: 'center',
      }}>
        <Text>No Log Found tap to refresh</Text>
        <Icon name='refresh' reverse onPress={props.onRefresh} />
      </View>
    );
  }

  props.logs.sort((a, b) => (b[0] - a[0]))
  return (
    <FlatList
      style={{
        width: '100%',
        paddingHorizontal: 20,
        marginVertical: 10,
        maxWidth: 900,
      }}
      data={props.logs}
      keyExtractor={(item) => item[0].toString()}
      ListHeaderComponent={props.header}
      refreshing={props.refreshing}
      onRefresh={props.onRefresh}
      renderItem={({ item }) => (
        <View style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <Text style={styles.tableItem}>{item[1] ? 'Opened' : 'Closed'}</Text>
          <Text style={[styles.tableItem, { flexGrow: 2 }]}>{new Date(item[0] * 1000).toLocaleString()}</Text>
          <Text style={styles.tableItem}>{item[2]} cm</Text>
        </View>
      )}
    />
  );
};


function LogScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);

  // fetch the logs from https://OGIP/jl
  const grabLogs = async () => {
    setLoading(true);
    let OGIP = await getOGIP();
    if (OGIP === '') {
      setLogs([]);
      return;
    }
    // 192.168.1.205
    fetch('http://' + OGIP + '/jl')
      .then((response) => response.json())
      .then((json) => setLogs(json.logs))
      .catch((error) => {
        setLogs([]);
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  // grab the logs as soon as possible
  useEffect(() => { grabLogs() }, []);

  const refreshLogs = async () => {
    setRefreshing(true);
    grabLogs();
  }

  return (
    <View style={[styles.container, { alignItems: 'center' }]}>
      <Header
        containerStyle={styles.topNav}
        statusBarProps={{
          translucent: true
        }}
        backgroundColor="#d8d8d8"
        leftComponent={<Icon name='menu' onPress={() => navigation.toggleDrawer()} />}
        centerComponent={{ text: 'Log', style: { fontSize: 20 } }}
        rightComponent={<Icon name='home' onPress={() => navigation.navigate('Home')} />}
      />
      <LogTable
        loading={loading}
        refreshing={refreshing}
        logs={logs}
        onRefresh={refreshLogs}
        header={
          () => {
            return (
              <View style={{ flex: 1, flexDirection: 'row', width: '100%' }}>
                <Text style={[styles.tableItem, styles.tableHeader]}>Event</Text>
                <Text style={[styles.tableItem, styles.tableHeader, { flexGrow: 2 }]}>Date &amp; Time</Text>
                <Text style={[styles.tableItem, styles.tableHeader]}>Details</Text>
              </View>
            )
          }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topNav: {
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 2,
  },

  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },

  largeText: {
    fontSize: 40,
  },

  tableItem: {
    display: 'flex',
    flexBasis: 1,
    flexGrow: 1,
    height: 50,
    textAlignVertical: 'center',
    borderWidth: 1,
    padding: 5,
  },

  tableHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});