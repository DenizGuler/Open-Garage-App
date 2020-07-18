import React, { useState, useCallback, FC } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import 'react-native-gesture-handler';
import { Icon } from 'react-native-elements';
import { BaseText as Text } from '../utils/utils';
import { useFocusEffect } from '@react-navigation/native';
import { AppNavigationProp } from '../App';
import { ScreenHeader } from '../components';
import { getLogData } from '../utils/APIUtils';

export default LogScreen;

type LogTableProps = {
  logs: number[][],
  loading: boolean,
  refreshing: boolean,
  onRefresh: () => void,
  header: React.ReactElement,
}

const LogTable: FC<LogTableProps> = (props) => {
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
  // sort logs by time
  props.logs.sort((a: number[], b: number[]) => (b[0] - a[0]))
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
          <Text style={[styles.tableItem, { borderRightWidth: 1 }]}>{item[2]} cm</Text>
        </View>
      )}
    />
  );
};


function LogScreen({ navigation }: { navigation: AppNavigationProp<'Logs'> }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [logs, setLogs] = useState<number[][]>([]);

  const grabLogs = async () => {
    setLoading(true);
    getLogData()
      .then((json) => {
        if (json.message !== undefined) throw Error(json.message)
        setLogs(json.logs)
      }
        )
      .catch((err) => {
        setLogs([]);
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  // grab the logs as soon as possible
  useFocusEffect(
    useCallback(() => {
      grabLogs();
    }, [])
  )

  const refreshLogs = async () => {
    setRefreshing(true);
    grabLogs();
  }

  return (
    <View style={[styles.container, { alignItems: 'center' }]}>
      <ScreenHeader
        text={'Log'}
        left={'hamburger'}
        right={'home'}
      />
      <LogTable
        loading={loading}
        refreshing={refreshing}
        logs={logs}
        onRefresh={refreshLogs}
        header={
          <View style={{ flex: 1, flexDirection: 'row', width: '100%' }}>
            <Text style={[styles.tableItem, styles.tableHeader]}>Event</Text>
            <Text style={[styles.tableItem, styles.tableHeader, { flexGrow: 2, }]}>Date &amp; Time</Text>
            <Text style={[styles.tableItem, styles.tableHeader, { borderRightWidth: 1 }]}>Details</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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

  tableItem: {
    display: 'flex',
    flexBasis: 1,
    flexGrow: 1,
    height: 50,
    textAlignVertical: 'center',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    padding: 5,
  },

  tableHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    borderTopWidth: 1,
  },
});