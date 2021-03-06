import React, { FC } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../App';
import { Icon, Header } from 'react-native-elements';
// import { FONT } from '../utils/utils';

/*
  'hamburger': menu hamburger; opens the navigation drawer 
  'back': back button; invokes navigate.goBack() 
  'home' : home button; navigates to the 'Home' screen 
  'check' : check button;
  'add' : plus/add button;
  'cancel' : 'X' button;
  'info' : info button;
*/

interface Props {
  left?: string,
  text?: string,
  right?: string,
  onPressRight?: () => void,
  onPressLeft?: () => void,
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
  const HeaderComponent = (type: string | undefined, position: 'right' | 'left') => {
    let comp = undefined;
    switch (type) {
      case 'hamburger':
        if (Dimensions.get('window').width < 600) {
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
        comp = <Icon name='check' onPress={position === 'right' ? props.onPressRight : props.onPressLeft} />
        break;
      case 'add':
        comp = <Icon name='add' onPress={position === 'right' ? props.onPressRight : props.onPressLeft} />
        break;
      case 'cancel':
        comp = <Icon name='close' onPress={position === 'right' ? props.onPressRight : props.onPressLeft} />
        break;
      case 'info':
        comp = <Icon name='info-outline' onPress={position === 'right' ? props.onPressRight : props.onPressLeft} />
        break;
      case undefined:
        break;
      default:
        comp = <Icon name={type} onPress={position === 'right' ? props.onPressRight : props.onPressLeft} />
        break;
    }
    return comp
  }

  return (
    <Header
      containerStyle={style.header}
      statusBarProps={{ translucent: true }}
      backgroundColor="#fff"
      leftComponent={HeaderComponent(props.left, 'left')}
      centerComponent={{ text: props.text, style: { fontSize: 24, /* fontFamily: FONT */ } }}
      rightComponent={HeaderComponent(props.right, 'right')}
    />
  );
}

export { ScreenHeader };
export default ScreenHeader;