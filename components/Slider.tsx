import React, { FC, useState } from 'react';
import { Theme, withTheme } from 'react-native-paper';
import SliderBase, { SliderProps } from '@react-native-community/slider';
import { View, TextInput } from 'react-native';

const Slider: FC<SliderProps & { theme: Theme, withFeedBack?: boolean }> = (props) => {
  const [value, setValue] = useState(props.value);
  const [textValue, setTextValue] = useState(String(props.value))
  return (
    <View
      style={{
        width: '100%',
        padding: 8,
        height: 52,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <SliderBase
        thumbTintColor={props.theme.colors.accent}
        maximumTrackTintColor={'#00000040'}
        minimumTrackTintColor={props.theme.colors.accent}
        style={{ flexGrow: 2, marginRight: 10 }}
        {...props}
        value={value}
        onValueChange={(val) => {
          setTextValue(String(val));
        }}
      />
      {props.withFeedBack && <TextInput
        style={{
          fontSize: 16,
          backgroundColor: '#fff',
          width: 60,
          height: 43,
          textAlign: 'center',
          color: '#000000',
          borderColor: '#00000020',
          borderWidth: 2,
          borderRadius: 6,
        }}
        value={textValue}
        onChangeText={(text) => {
          setTextValue(text);
        }}
        onSubmitEditing={(e) => {
          props.onSlidingComplete ? props.onSlidingComplete(Number(e.nativeEvent.text)) : undefined
          isNaN(Number(e.nativeEvent.text)) ? undefined :  setValue(Number(e.nativeEvent.text));
          // setTextValue(e.nativeEvent.text);
        }}
        keyboardType={'number-pad'}
        selectTextOnFocus
      />}
    </View>
  )
}

export { Slider };
export default withTheme(Slider);