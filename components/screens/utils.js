import React from 'react';
import { AsyncStorage } from "react-native";
import { Icon, Header } from "react-native-elements";
import { useNavigation } from '@react-navigation/native';

export const getDevKey = async () => {
  try {
    const devKey = await AsyncStorage.getItem('devKey')
    if (devKey !== null)
      return devKey
  } catch (err) {
    console.log(err)
  }
}

export const getOGIP = async () => {
  try {
    const OGIP = await AsyncStorage.getItem('OGIP');
    if (OGIP !== null) {
      return OGIP
    }
  } catch (err) {
    console.log(err)
  }
}

export const ScreenHeader = (props) => {
  const navigation = useNavigation();
  const HeaderComponent = (type) => {
    let comp = null;
    switch (type) {
      case 'hamburger':
        comp = <Icon name='menu' onPress={() => navigation.toggleDrawer()} />;
        break;
      case 'back':
        comp = <Icon name='chevron-left' onPress={() => navigation.goBack()} />;
        break;
      case 'home':
        comp = <Icon name='home' onPress={() => navigation.navigate('Home')} />;
        break;
      case 'check':
        comp = <Icon name='check' onPress={() => { props.onCheck() }} />
        break;
      default:
        break;
    }
    return comp
  }

  return (
    <Header
      containerStyle={{ width: '100%' }}
      statusBarProps={{ translucent: true }}
      backgroundColor="#d8d8d8"
      leftComponent={HeaderComponent(props.left)}
      centerComponent={{ text: props.text, style: { fontSize: 20 } }}
      rightComponent={HeaderComponent(props.right)}
    />
  );
}