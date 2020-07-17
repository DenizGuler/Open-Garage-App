import React, { FC } from 'react';
import { StyleSheet, Platform, TouchableNativeFeedback, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { BaseText as Text } from '../utils/utils'
import { TouchableHighlight } from 'react-native-gesture-handler';
import { withTheme, Theme } from 'react-native-paper';

interface Props {
  onPress: () => void,
  onLongPress?: () => void,
  icon: { name: string },
  text: string,
  subText?: string,
  backgroundColor?: string,
  style?: {
    height?: number | string,
    fontSize: number,
  },
  theme: Theme
}

/**
 * Full screen length button component
 */
const FullLengthButton: FC<Props> = (props) => {
  const { colors } = props.theme
  const styles = StyleSheet.create({
    button: {
      backgroundColor: props.backgroundColor ? props.backgroundColor : 'transparent',
      minHeight: props.style?.height ? props.style?.height : 65,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e5e5',
      flex: 1,
      flexDirection: 'row',
      alignSelf: 'stretch',
      alignItems: 'center'
    },

    text: {
      fontSize: props.style?.fontSize ? props.style?.fontSize : 20,
      color: colors.text
    },

    subText: {
      alignSelf: 'flex-start',
      fontSize: 16,
      color: colors.text + '89',
    },
  })


  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        background={TouchableNativeFeedback.Ripple('#adacac', false)}
      >
        <View style={styles.button}>
          {props.icon && <Icon style={{ paddingRight: 15 }} name={props.icon.name} type={'material-community'} color={colors.text} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>{props.text}</Text>
            {props.subText !== undefined && <Text style={styles.subText}>{props.subText}</Text>}
          </View>
        </View>
      </TouchableNativeFeedback>
    )
  }
  return (
    <TouchableHighlight
      onPress={props.onPress}
      underlayColor={'#adacac55'}
      activeOpacity={.75}
    >
      <View style={styles.button}>
        {props.icon && <Icon style={{ paddingRight: 10 }} name={props.icon.name} type={'material-community'} color={"#444"} />}
        <View style={{ flex: 1 }} >
          <Text style={styles.text}>{props.text}</Text>
          <Text style={styles.subText}>{props.subText ? props.subText : ''}</Text>
        </View>
      </View>
    </TouchableHighlight>
  )
};

export { FullLengthButton };
export default withTheme(FullLengthButton);