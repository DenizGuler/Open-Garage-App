import React, { FC } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../App';
import { Icon, Header } from 'react-native-elements';
import { FONT } from '../screens/utils';

/*
  'hamburger': menu hamburger; opens the navigation drawer 
  'back': back button; invokes navigate.goBack() 
  'home' : home button; navigates to the 'Home' screen 
  'check' : check button; invokes onCheck() 
  'add' : plus/add button; invokes onAdd()
  'cancel' : 'X' button; invokes onCancel()
  'info' : info button; invokes onInfo()
*/

interface Props {
  left?: 'hamburger' | 'back' | 'home' | 'check' | 'add' | 'cancel' | 'info',
  text?: string,
  right?: 'hamburger' | 'back' | 'home' | 'check' | 'add' | 'cancel' | 'info',
  onCancel?: () => void,
  onInfo?: () => void,
  onCheck?: () => void,
  onAdd?: () => void,
}

/**
 * Header component for screens
 */
const ScreenHeader: FC<Props> = (props) => {
  const style = StyleSheet.create({
    header: {
      zIndex: 2,
      width: '100%',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.34,
      shadowRadius: 6.27,

      elevation: 10,
    },
  })

  const navigation = useNavigation<AppNavigationProp<'Home'>>();
  const HeaderComponent = (type: 'hamburger' | 'back' | 'home' | 'check' | 'add' | 'cancel' | 'info' | undefined) => {
    let comp = undefined;
    switch (type) {
      case 'hamburger':
        if (Platform.OS !== 'web') {
          comp = <Icon name='menu' onPress={() => navigation.toggleDrawer()} />;
        }
        break;
      case 'back':
        comp = <Icon name='chevron-left' onPress={() => navigation.goBack()} />;
        break;
      case 'home':
        comp = <Icon name='home' onPress={() => navigation.navigate('Home')} />;
        break;
      case 'check':
        comp = <Icon name='check' onPress={props.onCheck} />
        break;
      case 'add':
        comp = <Icon name='add' onPress={props.onAdd} />
        break;
      case 'cancel':
        comp = <Icon name='close' onPress={props.onCancel} />
        break;
      case 'info':
        comp = <Icon name='info-outline' onPress={props.onInfo} />
        break;
      default:
        break;
    }
    return comp
  }

  return (
    <Header
      containerStyle={style.header}
      statusBarProps={{ translucent: true }}
      backgroundColor="#fff"
      leftComponent={HeaderComponent(props.left)}
      centerComponent={{ text: props.text, style: { fontSize: 24, fontFamily: FONT } }}
      rightComponent={HeaderComponent(props.right)}
    />
  );
}

export { ScreenHeader };
export default ScreenHeader;